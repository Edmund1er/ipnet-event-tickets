package tg.ipnetinstitute.technology.features.paiement.service;

import org.apache.tika.Tika;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.features.evenement.dto.response.EvenementResume;
import tg.ipnetinstitute.technology.features.evenement.service.EvenementAnnuleEvent;
import tg.ipnetinstitute.technology.features.evenement.service.ServiceEvenement;
import tg.ipnetinstitute.technology.features.identite.service.ServiceIdentite;
import tg.ipnetinstitute.technology.features.paiement.dto.response.PaiementAdminResponse;
import tg.ipnetinstitute.technology.features.paiement.dto.response.RapportRapprochementResponse;
import tg.ipnetinstitute.technology.features.paiement.model.Paiement;
import tg.ipnetinstitute.technology.features.paiement.model.ReleveTransaction;
import tg.ipnetinstitute.technology.features.paiement.model.StatutPaiement;
import tg.ipnetinstitute.technology.features.paiement.repository.PaiementRepository;
import tg.ipnetinstitute.technology.features.paiement.repository.ReleveTransactionRepository;
import tg.ipnetinstitute.technology.features.paiement.utils.ReferencePaiementUtils;
import tg.ipnetinstitute.technology.features.paiement.wrapper.ReleveCsvWrapper;
import tg.ipnetinstitute.technology.features.paiement.wrapper.StockagePreuveWrapper;
import tg.ipnetinstitute.technology.features.reservation.model.Inscription;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service de gestion des paiements (EF-21 à EF-26, RG-13 à RG-17, RG-21).
 */
@Service
public class ServicePaiement {

    /** Fichier de preuve prêt à être servi. */
    public record FichierPreuve(Resource contenu, MediaType type, String nom) {}

    private static final long TAILLE_MAX = 5L * 1024 * 1024;
    private static final List<String> TYPES_AUTORISES = List.of("image/jpeg", "image/png", "application/pdf");

    private final PaiementRepository paiements;
    private final InscriptionRepository inscriptions;
    private final ReleveTransactionRepository releves;
    private final StockagePreuveWrapper stockagePreuve;
    private final ReleveCsvWrapper releveCsv;
    private final ApplicationEventPublisher publieur;
    private final ServiceEvenement serviceEvenement;
    private final ServiceIdentite serviceIdentite;
    private final Tika tika = new Tika();

    public ServicePaiement(PaiementRepository paiements,
                           InscriptionRepository inscriptions,
                           ReleveTransactionRepository releves,
                           StockagePreuveWrapper stockagePreuve,
                           ReleveCsvWrapper releveCsv,
                           ApplicationEventPublisher publieur,
                           ServiceEvenement serviceEvenement,
                           ServiceIdentite serviceIdentite) {
        this.paiements = paiements;
        this.inscriptions = inscriptions;
        this.releves = releves;
        this.stockagePreuve = stockagePreuve;
        this.releveCsv = releveCsv;
        this.publieur = publieur;
        this.serviceEvenement = serviceEvenement;
        this.serviceIdentite = serviceIdentite;
    }

    /** EF-21 : référence obligatoire, capture facultative (JPG, PNG, PDF ≤ 5 Mo). */
    @Transactional
    @PreAuthorize("hasRole('ROLE_PARTICIPANT')")
    @Auditable(action = "SOUMISSION_PREUVE", typeCible = "PAIEMENT")
    public void soumettrePreuve(Long inscriptionId, Long utilisateurId, String referenceBrute, MultipartFile fichier) {
        Inscription inscription = inscriptions.findById(inscriptionId)
                .orElseThrow(() -> new RessourceIntrouvableException("Réservation", inscriptionId));

        // Contrôle de propriété OWASP A01
        if (!inscription.getUtilisateurId().equals(utilisateurId)) {
            throw new AccessDeniedException("Accès refusé à cette réservation");
        }
        // RG-14 : une soumission par réservation, sauf après un rejet
        if (inscription.getStatut() != StatutInscription.EN_ATTENTE_PAIEMENT
                && inscription.getStatut() != StatutInscription.REJETEE) {
            throw new IllegalStateException("Une référence a déjà été soumise pour cette réservation, ou elle n'est plus active");
        }

        String referenceOperateur = ReferencePaiementUtils.normaliser(referenceBrute);
        if (referenceOperateur == null || referenceOperateur.isBlank()) {
            throw new IllegalArgumentException("La référence de transaction mobile money est obligatoire");
        }
        if (referenceOperateur.length() > 50) {
            throw new IllegalArgumentException("La référence de transaction ne doit pas dépasser 50 caractères");
        }

        // RG-21 : référence unique sur la plateforme
        Optional<Paiement> existantRef = paiements.findByReferenceOperateur(referenceOperateur);
        if (existantRef.isPresent() && !existantRef.get().getInscriptionId().equals(inscriptionId)) {
            throw new IllegalArgumentException("Cette référence opérateur a déjà été utilisée sur une autre réservation");
        }

        String cheminFichier = null;
        String empreinteSha256 = null;

        // Capture facultative (RG-21, RG-13, Section 5.5)
        if (fichier != null && !fichier.isEmpty()) {
            if (fichier.getSize() > TAILLE_MAX) {
                throw new IllegalArgumentException("La taille du fichier dépasse la limite autorisée de 5 Mo");
            }
            byte[] contenu;
            try {
                contenu = fichier.getBytes();
            } catch (IOException e) {
                throw new IllegalArgumentException("Impossible de lire le fichier envoyé");
            }
            // Détection MIME par inspection du contenu (magic bytes)
            String typeDetecte = tika.detect(contenu);
            if (!TYPES_AUTORISES.contains(typeDetecte)) {
                throw new IllegalArgumentException("Format de fichier non supporté (JPG, PNG ou PDF attendu)");
            }
            empreinteSha256 = sha256(contenu);
            if (paiements.existsByEmpreintePreuve(empreinteSha256)) {
                throw new IllegalArgumentException("Cette capture a déjà été soumise pour une réservation (RG-13)");
            }
            cheminFichier = stockagePreuve.enregistrer(new ByteArrayInputStream(contenu), extensionPour(typeDetecte), typeDetecte);
        }

        // RG-17 : montant figé à la réservation (repli sur le prix courant pour les réservations antérieures à V4)
        EvenementResume evenement = serviceEvenement.consulter(inscription.getEvenementId());
        var montant = inscription.getMontant() != null ? inscription.getMontant() : evenement.prix();
        var devise = inscription.getDevise() != null ? inscription.getDevise() : evenement.devise();
        Paiement paiement = paiements.findByInscriptionId(inscriptionId)
                .orElseGet(() -> Paiement.initialiser(inscriptionId, montant, devise));

        paiement.soumettrePreuve(referenceOperateur, cheminFichier, empreinteSha256);
        paiements.save(paiement);

        inscription.transitionnerVers(StatutInscription.PREUVE_ENVOYEE, null);
        inscriptions.save(inscription);

        // Rapprochement immédiat si le relevé contient déjà la référence (EF-26)
        releves.findByReferenceOperateurAndRapprocheFalse(referenceOperateur)
                .ifPresent(releve -> rapprocher(paiement, inscription, releve));
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "VALIDATION_PAIEMENT", typeCible = "PAIEMENT")
    public void valider(Long paiementId, Long adminId) {
        Paiement p = charger(paiementId);
        exigerEnAttente(p);
        Inscription inscription = inscriptions.findById(p.getInscriptionId()).orElseThrow();

        // RG-15 : un administrateur ne valide pas sa propre preuve
        if (inscription.getUtilisateurId().equals(adminId)) {
            throw new AccessDeniedException("Un administrateur ne peut pas valider sa propre preuve");
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
        Paiement p = charger(paiementId);
        exigerEnAttente(p);
        Inscription inscription = inscriptions.findById(p.getInscriptionId()).orElseThrow();

        p.rejeter(adminId, motif);
        paiements.save(p);

        inscription.transitionnerVers(StatutInscription.REJETEE, motif);
        inscriptions.save(inscription);

        publieur.publishEvent(new PaiementRejeteEvent(inscription.getId(), motif));
    }

    /** RG-19 : l'administrateur a remboursé hors plateforme et le constate. */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "REMBOURSEMENT_PAIEMENT", typeCible = "PAIEMENT")
    public void marquerRembourse(Long paiementId, Long adminId) {
        Paiement p = charger(paiementId);
        if (p.getStatut() != StatutPaiement.A_REMBOURSER) {
            throw new IllegalStateException("Seul un paiement à rembourser peut être marqué remboursé");
        }
        p.marquerRembourse();
        paiements.save(p);
    }

    /** EF-26 : import du relevé et rapprochement automatique (référence + montant identiques). */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "IMPORT_RELEVE", typeCible = "RELEVE")
    public RapportRapprochementResponse importerReleveCsv(MultipartFile csvFile) {
        if (csvFile == null || csvFile.isEmpty()) {
            throw new IllegalArgumentException("Le fichier CSV du relevé est vide");
        }
        List<ReleveCsvWrapper.LigneReleve> lignes;
        try {
            lignes = releveCsv.parserCsv(csvFile.getInputStream());
        } catch (IOException e) {
            throw new IllegalArgumentException("Impossible de lire le fichier CSV");
        }

        int importees = 0;
        int confirmees = 0;
        for (var ligne : lignes) {
            String ref = ReferencePaiementUtils.normaliser(ligne.reference());
            if (ref.length() > 50) {
                throw new IllegalArgumentException("Relevé CSV invalide, ligne " + ligne.numeroLigne() + " : référence trop longue");
            }
            if (releves.existsByReferenceOperateur(ref)) {
                continue; // ligne déjà importée lors d'un précédent relevé
            }
            ReleveTransaction releve = releves.save(new ReleveTransaction(ref, ligne.montant(), ligne.date()));
            importees++;

            Optional<Paiement> optP = paiements.findByReferenceOperateur(ref);
            if (optP.isPresent() && optP.get().getStatut() == StatutPaiement.EN_ATTENTE) {
                Inscription insc = inscriptions.findById(optP.get().getInscriptionId()).orElseThrow();
                if (rapprocher(optP.get(), insc, releve)) {
                    confirmees++;
                }
            }
        }

        long aTraiter = paiements.countByStatutAndReferenceOperateurIsNotNull(StatutPaiement.EN_ATTENTE);
        return new RapportRapprochementResponse(importees, confirmees, (int) aTraiter);
    }

    /** EF-22 : file des paiements par statut, enrichie pour l'affichage. */
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Page<PaiementAdminResponse> listerPreuves(StatutPaiement statut, Pageable pageable) {
        Map<Long, EvenementResume> cacheEvenements = new HashMap<>();
        return paiements.findByStatut(statut, pageable).map(p -> {
            Inscription i = inscriptions.findById(p.getInscriptionId()).orElseThrow();
            EvenementResume evt = cacheEvenements.computeIfAbsent(i.getEvenementId(), serviceEvenement::consulter);
            var c = serviceIdentite.coordonnees(i.getUtilisateurId());
            return new PaiementAdminResponse(
                    p.getId(), p.getInscriptionId(), p.getReferenceOperateur(), p.getMontant(), p.getDevise(),
                    p.getCheminPreuve() != null, p.getStatut(), p.getValideLe(),
                    p.getStatut() == StatutPaiement.VALIDE && p.getValidePar() == null,
                    p.getMotifRejet(), evt.id(), evt.titre(),
                    c.utilisateurId(), c.nom(), c.prenom(), c.email());
        });
    }

    /** Capture servie uniquement via endpoint authentifié ADMIN (§5.2). */
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public FichierPreuve lirePreuve(Long paiementId) {
        Paiement p = charger(paiementId);
        if (p.getCheminPreuve() == null) {
            throw new RessourceIntrouvableException("Capture du paiement", paiementId);
        }
        String nom = p.getCheminPreuve();
        MediaType type = nom.endsWith(".pdf") ? MediaType.APPLICATION_PDF
                : nom.endsWith(".png") ? MediaType.IMAGE_PNG
                : nom.endsWith(".jpg") || nom.endsWith(".jpeg") ? MediaType.IMAGE_JPEG
                : MediaType.APPLICATION_OCTET_STREAM;
        return new FichierPreuve(stockagePreuve.lire(nom), type, nom);
    }

    @EventListener
    @Transactional
    public void surEvenementAnnule(EvenementAnnuleEvent evt) {
        // L'ordre des listeners n'est pas garanti : l'inscription peut être encore CONFIRMEE ou déjà
        // passée à ANNULEE par la feature reservation. Seuls les paiements VALIDE sont concernés.
        List<Inscription> inscriptionsEvt = inscriptions.findByEvenementIdAndStatutIn(
                evt.evenementId(),
                List.of(StatutInscription.CONFIRMEE, StatutInscription.ANNULEE)
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

    private boolean rapprocher(Paiement paiement, Inscription inscription, ReleveTransaction releve) {
        if (releve.getMontant().compareTo(paiement.getMontant()) != 0) {
            return false; // montant différent : traitement manuel
        }
        paiement.valider(null); // validé par le système
        paiements.save(paiement);
        releve.marquerRapproche();
        releves.save(releve);
        inscription.transitionnerVers(StatutInscription.CONFIRMEE, null);
        inscriptions.save(inscription);
        publieur.publishEvent(new PaiementConfirmeEvent(inscription.getId(), paiement.getId(), null));
        return true;
    }

    private Paiement charger(Long paiementId) {
        return paiements.findById(paiementId)
                .orElseThrow(() -> new RessourceIntrouvableException("Paiement", paiementId));
    }

    private static void exigerEnAttente(Paiement p) {
        if (p.getStatut() != StatutPaiement.EN_ATTENTE) {
            throw new IllegalStateException("Ce paiement a déjà été traité (statut " + p.getStatut() + ")");
        }
    }

    private static String sha256(byte[] contenu) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(contenu));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }

    private static String extensionPour(String typeMime) {
        return switch (typeMime) {
            case "image/png" -> "preuve.png";
            case "application/pdf" -> "preuve.pdf";
            default -> "preuve.jpg";
        };
    }
}
