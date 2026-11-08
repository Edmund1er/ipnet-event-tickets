package tg.ipnetinstitute.technology.features.controle.application;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.features.billet.application.SignateurJeton;
import tg.ipnetinstitute.technology.features.billet.domaine.Billet;
import tg.ipnetinstitute.technology.features.billet.infrastructure.BilletRepository;
import tg.ipnetinstitute.technology.features.controle.domaine.JournalScan;
import tg.ipnetinstitute.technology.features.controle.domaine.ResultatScan;
import tg.ipnetinstitute.technology.features.controle.domaine.ResultatScanEnum;
import tg.ipnetinstitute.technology.features.controle.infrastructure.JournalScanRepository;
import tg.ipnetinstitute.technology.features.evenement.domaine.Evenement;
import tg.ipnetinstitute.technology.features.evenement.domaine.StatutEvenement;
import tg.ipnetinstitute.technology.features.evenement.infrastructure.EvenementRepository;
import tg.ipnetinstitute.technology.features.participant.application.ProfilFactory;
import tg.ipnetinstitute.technology.features.participant.application.ResumePersonne;
import tg.ipnetinstitute.technology.features.reservation.domaine.Inscription;
import tg.ipnetinstitute.technology.features.reservation.infrastructure.InscriptionRepository;

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
    private final SignateurJeton signateur;
    private final ProfilFactory profilFactory;
    private final Map<FormatExport, ExportateurStatistiques> exportateurs;

    public ServiceControle(BilletRepository billets,
                           InscriptionRepository inscriptions,
                           EvenementRepository evenements,
                           JournalScanRepository journalScans,
                           SignateurJeton signateur,
                           ProfilFactory profilFactory,
                           List<ExportateurStatistiques> exportateurList) {
        this.billets = billets;
        this.inscriptions = inscriptions;
        this.evenements = evenements;
        this.journalScans = journalScans;
        this.signateur = signateur;
        this.profilFactory = profilFactory;
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

        // 3. Vérification signature HMAC à temps constant
        Optional<UUID> validationSign = signateur.verifier(jeton, evenementId, billet.getNonce());
        if (validationSign.isEmpty()) {
            journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.INVALIDE, now));
            return new ResultatScan.Invalide();
        }

        // 4. Vérification de l'événement et de son statut (RG-19)
        Inscription inscription = inscriptions.findById(billet.getInscriptionId()).orElseThrow();
        Evenement evenement = evenements.findById(inscription.getEvenementId()).orElseThrow();

        if (!evenement.getId().equals(evenementId)) {
            journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.MAUVAIS_EVENEMENT, now));
            return new ResultatScan.MauvaisEvenement();
        }

        if (evenement.getStatut() == StatutEvenement.ANNULE || billet.isInvalide()) {
            journalScans.save(new JournalScan(billet.getId(), evenementId, agentId, ResultatScanEnum.EVENEMENT_ANNULE, now));
            return new ResultatScan.EvenementAnnule();
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

        // Résumé de la personne
        ResumePersonne resume = profilFactory.pour(
                inscriptions.findById(billet.getInscriptionId()).get().getStatut() != null 
                        ? tg.ipnetinstitute.technology.features.participant.domaine.TypeProfil.ETUDIANT 
                        : tg.ipnetinstitute.technology.features.participant.domaine.TypeProfil.VISITEUR
        ).resumer(inscription.getUtilisateurId());

        return new ResultatScan.Accepte(resume.nom(), resume.prenom(), resume.adresse(), now);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_SCANNER') or hasRole('ROLE_ADMIN')")
    public StatistiquesEvenement obtenirStatistiques(Long evenementId) {
        long nombreEntrees = journalScans.countByEvenementIdAndResultat(evenementId, ResultatScanEnum.ACCEPTE);

        var scansAcceptes = journalScans.findByEvenementIdAndResultatOrderByHorodatageAsc(evenementId, ResultatScanEnum.ACCEPTE);
        List<PersonneEntree> personnes = new ArrayList<>();

        for (var s : scansAcceptes) {
            if (s.getBilletId() != null) {
                billets.findById(s.getBilletId()).ifPresent(b -> {
                    inscriptions.findById(b.getInscriptionId()).ifPresent(i -> {
                        ResumePersonne res = profilFactory.pour(tg.ipnetinstitute.technology.features.participant.domaine.TypeProfil.ETUDIANT)
                                .resumer(i.getUtilisateurId());
                        personnes.add(new PersonneEntree(res.nom(), res.prenom(), res.adresse(), s.getHorodatage()));
                    });
                });
            }
        }

        return new StatistiquesEvenement(nombreEntrees, personnes.size(), personnes);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public byte[] exporterStatistiques(Long evenementId, FormatExport format) {
        StatistiquesEvenement stats = obtenirStatistiques(evenementId);
        ExportateurStatistiques exportateur = exportateurs.get(format);
        if (exportateur == null) {
            throw new IllegalArgumentException("Format d'export non supporté : " + format);
        }
        return exportateur.exporter(stats);
    }
}
