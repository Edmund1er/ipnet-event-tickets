package tg.ipnetinstitute.technology.features.paiement.service;
import tg.ipnetinstitute.technology.features.paiement.wrapper.StockagePreuveWrapper;

import org.apache.tika.Tika;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.features.evenement.service.EvenementAnnuleEvent;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.repository.EvenementRepository;
import tg.ipnetinstitute.technology.features.paiement.model.Paiement;
import tg.ipnetinstitute.technology.features.paiement.model.ReleveTransaction;
import tg.ipnetinstitute.technology.features.paiement.model.StatutPaiement;
import tg.ipnetinstitute.technology.features.paiement.repository.PaiementRepository;
import tg.ipnetinstitute.technology.features.paiement.repository.ReleveTransactionRepository;
import tg.ipnetinstitute.technology.features.reservation.model.Inscription;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

/**
 * Service de gestion des paiements (EF-21 à EF-26, RG-13 à RG-17, RG-21).
 */
@Service
public class ServicePaiement {

    private final PaiementRepository paiements;
    private final InscriptionRepository inscriptions;
    private final EvenementRepository evenements;
    private final ReleveTransactionRepository releves;
    private final StockagePreuveWrapper stockagePreuve;
    private final ApplicationEventPublisher publieur;
    private final Tika tika = new Tika();

    public ServicePaiement(PaiementRepository paiements,
                           InscriptionRepository inscriptions,
                           EvenementRepository evenements,
                           ReleveTransactionRepository releves,
                           StockagePreuveWrapper stockagePreuve,
                           ApplicationEventPublisher publieur) {
        this.paiements = paiements;
        this.inscriptions = inscriptions;
        this.evenements = evenements;
        this.releves = releves;
        this.stockagePreuve = stockagePreuve;
        this.publieur = publieur;
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_PARTICIPANT')")
    @Auditable(action = "SOUMISSION_PREUVE", typeCible = "PAIEMENT")
    public void soumettrePreuve(Long inscriptionId, Long utilisateurId, String referenceOperateur, MultipartFile fichier) {
        Inscription inscription = inscriptions.findById(inscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Inscription introuvable : " + inscriptionId));

        // Contrôle de propriété OWASP A01
        if (!inscription.getUtilisateurId().equals(utilisateurId)) {
            throw new AccessDeniedException("Accès refusé à cette inscription");
        }

        // RG-21 : Référence unique sur la plateforme
        if (referenceOperateur == null || referenceOperateur.isBlank()) {
            throw new IllegalArgumentException("La référence de transaction mobile money est obligatoire");
        }
        referenceOperateur = referenceOperateur.trim();

        Optional<Paiement> existantRef = paiements.findByReferenceOperateur(referenceOperateur);
        if (existantRef.isPresent() && !existantRef.get().getInscriptionId().equals(inscriptionId)) {
            throw new IllegalArgumentException("Cette référence opérateur a déjà été utilisée sur une autre réservation (RG-21)");
        }

        String cheminFichier = null;
        String empreinteSha256 = null;

        // Traitement facultatif de la capture d'écran (RG-21, RG-13, Section 5.5 OWASP)
        if (fichier != null && !fichier.isEmpty()) {
            if (fichier.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("La taille du fichier dépasse la limite autorisée de 5 Mo");
            }
            try {
                // Détection MIME par magic bytes via Tika (Section 5.5)
                String detectedMime = tika.detect(fichier.getInputStream());
                if (!List.of("image/jpeg", "image/png", "image/webp", "application/pdf").contains(detectedMime)) {
                    throw new IllegalArgumentException("Format de fichier non supporté : " + detectedMime);
                }

                // Calcul empreinte SHA-256
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                byte[] bytes = fichier.getBytes();
                byte[] hash = md.digest(bytes);
                empreinteSha256 = HexFormat.of().formatHex(hash);

                if (paiements.existsByEmpreintePreuve(empreinteSha256)) {
                    throw new IllegalArgumentException("Cette image de preuve a déjà été soumise pour une réservation (RG-13)");
                }

                cheminFichier = stockagePreuve.enregistrer(fichier.getInputStream(), fichier.getOriginalFilename(), detectedMime);
            } catch (Exception e) {
                throw new RuntimeException("Erreur lors de l'enregistrement de la preuve", e);
            }
        }

        // Récupérer ou initialiser le paiement avec montant figé de l'événement (RG-17)
        Evenement evenement = evenements.findById(inscription.getEvenementId()).orElseThrow();
        Paiement paiement = paiements.findByInscriptionId(inscriptionId)
                .orElseGet(() -> Paiement.initialiser(inscriptionId, evenement.getPrix(), evenement.getDevise()));

        paiement.soumettrePreuve(referenceOperateur, cheminFichier, empreinteSha256);
        paiements.save(paiement);

        inscription.transitionnerVers(StatutInscription.PREUVE_ENVOYEE, null);
        inscriptions.save(inscription);

        // Tentative de rapprochement automatique immédiat si le relevé est déjà présent (EF-26)
        rapprocherAutomatiquement(paiement, inscription);
    }

    private void rapprocherAutomatiquement(Paiement paiement, Inscription inscription) {
        if (paiement.getReferenceOperateur() == null) return;

        Optional<ReleveTransaction> optReleve = releves.findByReferenceOperateurAndRapprocheFalse(paiement.getReferenceOperateur());
        if (optReleve.isPresent()) {
            ReleveTransaction releve = optReleve.get();
            // Rapprochement exact : même référence ET même montant
            if (releve.getMontant().compareTo(paiement.getMontant()) == 0) {
                paiement.valider(null); // Validé automatiquement par le système
                paiements.save(paiement);

                releve.marquerRapproche();
                releves.save(releve);

                inscription.transitionnerVers(StatutInscription.CONFIRMEE, null);
                inscriptions.save(inscription);

                publieur.publishEvent(new PaiementConfirmeEvent(inscription.getId(), paiement.getId(), null));
            }
        }
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "VALIDATION_PAIEMENT", typeCible = "PAIEMENT")
    public void valider(Long paiementId, Long adminId) {
        Paiement p = paiements.findById(paiementId)
                .orElseThrow(() -> new IllegalArgumentException("Paiement non trouvé : " + paiementId));

        Inscription inscription = inscriptions.findById(p.getInscriptionId()).orElseThrow();

        // RG-15 : Un administrateur ne peut pas valider une preuve qu'il a lui-même soumise
        if (inscription.getUtilisateurId().equals(adminId)) {
            throw new AccessDeniedException("Un administrateur ne peut pas valider sa propre inscription (RG-15)");
        }

        p.valider(adminId);
        paiements.save(p);

        inscription.transitionnerVers(StatutInscription.CONFIRMEE, null);
        inscriptions.save(inscription);

        publieur.publishEvent(new PaiementConfirmeEvent(inscription.getId(), p.getId(), adminId));
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "REJET_PAIEMENT", typeCible = "PAIEMENT")
    public void rejeter(Long paiementId, Long adminId, String motif) {
        Paiement p = paiements.findById(paiementId)
                .orElseThrow(() -> new IllegalArgumentException("Paiement non trouvé : " + paiementId));

        Inscription inscription = inscriptions.findById(p.getInscriptionId()).orElseThrow();

        p.rejeter(adminId, motif);
        paiements.save(p);

        inscription.transitionnerVers(StatutInscription.REJETEE, motif);
        inscriptions.save(inscription);

        publieur.publishEvent(new PaiementRejeteEvent(inscription.getId(), motif));
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "IMPORT_RELEVE", typeCible = "RELEVE")
    public int importerReleveCsv(MultipartFile csvFile) {
        int nbRapproches = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(csvFile.getInputStream()))) {
            String ligne;
            boolean entete = true;
            while ((ligne = reader.readLine()) != null) {
                if (entete) { entete = false; continue; }
                String[] parts = ligne.split(",");
                if (parts.length >= 2) {
                    String ref = parts[0].trim();
                    BigDecimal montant = new BigDecimal(parts[1].trim());

                    ReleveTransaction releve = new ReleveTransaction(ref, montant, LocalDateTime.now());
                    releve = releves.save(releve);

                    // Chercher un paiement en attente avec cette référence
                    Optional<Paiement> optP = paiements.findByReferenceOperateur(ref);
                    if (optP.isPresent()) {
                        Paiement p = optP.get();
                        if (p.getStatut() == StatutPaiement.EN_ATTENTE && p.getMontant().compareTo(montant) == 0) {
                            Inscription insc = inscriptions.findById(p.getInscriptionId()).orElseThrow();
                            p.valider(null);
                            paiements.save(p);

                            releve.marquerRapproche();
                            releves.save(releve);

                            insc.transitionnerVers(StatutInscription.CONFIRMEE, null);
                            inscriptions.save(insc);

                            publieur.publishEvent(new PaiementConfirmeEvent(insc.getId(), p.getId(), null));
                            nbRapproches++;
                        }
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'import CSV", e);
        }
        return nbRapproches;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Page<Paiement> listerPreuves(StatutPaiement statut, Pageable pageable) {
        return paiements.findByStatut(statut, pageable);
    }

    @EventListener
    @Transactional
    public void surEvenementAnnule(EvenementAnnuleEvent evt) {
        List<Inscription> inscriptionsEvt = inscriptions.findByEvenementIdAndStatutIn(
                evt.evenementId(),
                List.of(StatutInscription.CONFIRMEE)
        );
        for (Inscription i : inscriptionsEvt) {
            paiements.findByInscriptionId(i.getId()).ifPresent(p -> {
                if (p.getStatut() == StatutPaiement.VALIDE) {
                    p.marquerARembourser(); // RG-19
                    paiements.save(p);
                }
            });
        }
    }
}
