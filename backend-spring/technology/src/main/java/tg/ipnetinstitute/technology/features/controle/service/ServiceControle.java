package tg.ipnetinstitute.technology.features.controle.service;
import tg.ipnetinstitute.technology.features.controle.wrapper.ExportateurStatistiques;
import tg.ipnetinstitute.technology.features.controle.dto.request.FormatExport;
import tg.ipnetinstitute.technology.features.controle.dto.response.PersonneEntree;
import tg.ipnetinstitute.technology.features.controle.dto.response.StatistiquesEvenement;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.features.billet.wrapper.HmacWrapper;
import tg.ipnetinstitute.technology.features.billet.model.Billet;
import tg.ipnetinstitute.technology.features.billet.repository.BilletRepository;
import tg.ipnetinstitute.technology.features.controle.model.JournalScan;
import tg.ipnetinstitute.technology.features.controle.model.ResultatScan;
import tg.ipnetinstitute.technology.features.controle.model.ResultatScanEnum;
import tg.ipnetinstitute.technology.features.controle.repository.JournalScanRepository;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;
import tg.ipnetinstitute.technology.features.evenement.model.TypeEvenement;
import tg.ipnetinstitute.technology.features.evenement.repository.EvenementRepository;
import tg.ipnetinstitute.technology.features.identite.service.ServiceIdentite;
import tg.ipnetinstitute.technology.features.evenement.service.ServiceEvenement;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import tg.ipnetinstitute.technology.features.identite.dto.response.ResumePersonne;
import tg.ipnetinstitute.technology.features.reservation.model.Inscription;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service de contrôle d'accès et statistiques en temps réel (EF-40 à EF-45, RG-11).
 */
@Service
public class ServiceControle {

    private final BilletRepository billets;
    private final InscriptionRepository inscriptions;
    private final EvenementRepository evenements;
    private final JournalScanRepository journalScans;
    private final HmacWrapper signateur;
    private final ServiceIdentite serviceIdentite;
    private final ServiceEvenement serviceEvenement;
    private final Map<FormatExport, ExportateurStatistiques> exportateurs;

    public ServiceControle(BilletRepository billets,
                           InscriptionRepository inscriptions,
                           EvenementRepository evenements,
                           JournalScanRepository journalScans,
                           HmacWrapper signateur,
                           ServiceIdentite serviceIdentite,
                           ServiceEvenement serviceEvenement,
                           List<ExportateurStatistiques> exportateurList) {
        this.billets = billets;
        this.inscriptions = inscriptions;
        this.evenements = evenements;
        this.journalScans = journalScans;
        this.signateur = signateur;
        this.serviceIdentite = serviceIdentite;
        this.serviceEvenement = serviceEvenement;
        this.exportateurs = exportateurList.stream()
                .collect(Collectors.toMap(ExportateurStatistiques::format, e -> e));
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_SCANNER') or hasRole('ROLE_ADMIN')")
    public ResultatScan scanner(String jeton, Long evenementId, Long agentId) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Extraction préliminaire de l'UUID pour retrouver le nonce du billet
        UUID billetIdExtrait;
        try {
            String jetonDecode = new String(Base64.getUrlDecoder().decode(jeton), StandardCharsets.UTF_8);
            String[] parts = jetonDecode.split("\\.");
            billetIdExtrait = UUID.fromString(parts[0]);
        } catch (Exception e) {
            journalScans.save(new JournalScan(null, evenementId, agentId, ResultatScanEnum.INVALIDE, now));
            return new ResultatScan.Invalide();
        }

        // 2. Recherche du billet
        Optional<Billet> optBillet = billets.findById(billetIdExtrait);
        if (optBillet.isEmpty()) {
            journalScans.save(new JournalScan(null, evenementId, agentId, ResultatScanEnum.INVALIDE, now));
            return new ResultatScan.Invalide();
        }

        Billet billet = optBillet.get();

        // 3. Vérification de la signature HMAC (temps constant) avec l'événement réel du billet :
        //    un jeton altéré est INVALIDE ; un billet authentique d'un autre événement est MAUVAIS_EVENEMENT (EF-43)
        Inscription inscription = inscriptions.findById(billet.getInscriptionId()).orElseThrow();
        Optional<UUID> validationSign = signateur.verifier(jeton, inscription.getEvenementId(), billet.getNonce());
        if (validationSign.isEmpty() || !validationSign.get().equals(billet.getId())) {
            journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.INVALIDE, now));
            return new ResultatScan.Invalide();
        }

        // 4. Vérification de l'événement et de son statut (RG-19)
        Evenement evenement = evenements.findById(inscription.getEvenementId()).orElseThrow();

        boolean pass = evenement.getType() == TypeEvenement.PASS;
        if (pass) {
            // Un pass ouvre le programme (cadre) et toutes ses activités
            Evenement scanne = evenements.findById(evenementId).orElse(null);
            boolean dansLeProgramme = scanne != null && evenement.getParentId() != null
                    && (evenement.getParentId().equals(scanne.getId()) || evenement.getParentId().equals(scanne.getParentId()));
            if (!dansLeProgramme) {
                journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.MAUVAIS_EVENEMENT, now));
                return new ResultatScan.MauvaisEvenement();
            }
        } else if (!evenement.getId().equals(evenementId)) {
            journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.MAUVAIS_EVENEMENT, now));
            return new ResultatScan.MauvaisEvenement();
        }

        if (evenement.getStatut() == StatutEvenement.ANNULE || billet.isInvalide()) {
            journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.EVENEMENT_ANNULE, now));
            return new ResultatScan.EvenementAnnule();
        }

        if (pass) {
            // Pass : valable seulement pendant sa période, une entrée par activité (jamais deux fois à la même)
            boolean valide = "JOURNEE".equals(evenement.getPassPortee())
                    ? now.toLocalDate().equals(evenement.getPassJour())
                    : !now.isBefore(evenement.getDateDebut().toLocalDate().atStartOfDay()) && !now.isAfter(evenement.getDateFin());
            if (!valide) {
                journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.INVALIDE, now));
                return new ResultatScan.Invalide();
            }
            var deja = journalScans.findFirstByBilletIdAndEvenementIdAndResultatOrderByHorodatageAsc(
                    billet.getId(), evenementId, ResultatScanEnum.ACCEPTE);
            if (deja.isPresent()) {
                journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.DEJA_UTILISE, now));
                return new ResultatScan.DejaUtilise(deja.get().getHorodatage());
            }
            journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.ACCEPTE, now));
            ResumePersonne porteur = serviceIdentite.resumer(inscription.getUtilisateurId());
            return new ResultatScan.Accepte(porteur.nom(), porteur.prenom(), porteur.detail(), now);
        }

        // 5. Vérification si déjà scanné (RG-11)
        if (billet.getScanneLe() != null) {
            journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.DEJA_UTILISE, now));
            return new ResultatScan.DejaUtilise(billet.getScanneLe());
        }

        // 6. Acceptation du scan et mise à jour
        billet.marquerScanne(agentId, now);
        billets.save(billet);

        journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.ACCEPTE, now));

        // Résumé du porteur selon son type de profil réel (EF-41)
        ResumePersonne resume = serviceIdentite.resumer(inscription.getUtilisateurId());

        return new ResultatScan.Accepte(resume.nom(), resume.prenom(), resume.detail(), now);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_SCANNER') or hasRole('ROLE_ADMIN')")
    public StatistiquesEvenement obtenirStatistiques(Long evenementId) {
        serviceEvenement.consulter(evenementId); // 404 si l'événement n'existe pas
        var scansAcceptes = journalScans.findByEvenementIdAndResultatOrderByHorodatageAsc(evenementId, ResultatScanEnum.ACCEPTE);
        List<PersonneEntree> personnes = new ArrayList<>();

        for (var s : scansAcceptes) {
            if (s.getBilletId() != null) {
                billets.findById(s.getBilletId()).ifPresent(b ->
                        inscriptions.findById(b.getInscriptionId()).ifPresent(i -> {
                            ResumePersonne res = serviceIdentite.resumer(i.getUtilisateurId());
                            personnes.add(new PersonneEntree(res.nom(), res.prenom(), res.detail(), s.getHorodatage()));
                        }));
            }
        }
        Collections.reverse(personnes); // la plus récente en premier

        long nombreEntrees = personnes.size();
        long confirmes = inscriptions.countByEvenementIdAndStatut(evenementId, StatutInscription.CONFIRMEE);
        long restants = Math.max(0, confirmes - nombreEntrees);
        return new StatistiquesEvenement(evenementId, nombreEntrees, confirmes, restants, personnes);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public byte[] exporterStatistiques(Long evenementId, FormatExport format) {
        var evenement = serviceEvenement.consulter(evenementId);
        StatistiquesEvenement stats = obtenirStatistiques(evenementId);
        ExportateurStatistiques exportateur = exportateurs.get(format);
        if (exportateur == null) {
            throw new IllegalArgumentException("Format d'export non supporté : " + format);
        }
        return exportateur.exporter(evenement, stats);
    }
}
