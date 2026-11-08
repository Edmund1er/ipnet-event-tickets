package tg.ipnetinstitute.technology.features.billet.application;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import tg.ipnetinstitute.technology.features.billet.domaine.Billet;
import tg.ipnetinstitute.technology.features.billet.infrastructure.BilletRepository;
import tg.ipnetinstitute.technology.features.evenement.application.EvenementAnnuleEvent;
import tg.ipnetinstitute.technology.features.paiement.application.PaiementConfirmeEvent;
import tg.ipnetinstitute.technology.features.reservation.domaine.Inscription;
import tg.ipnetinstitute.technology.features.reservation.infrastructure.InscriptionRepository;

import java.util.List;
import java.util.UUID;

/**
 * Service de gestion des billets (Section 9.7, RG-10, RG-11).
 * Émission découplée via @TransactionalEventListener(phase = AFTER_COMMIT).
 */
@Service
public class ServiceBillet {

    private final BilletRepository billets;
    private final InscriptionRepository inscriptions;
    private final SignateurJeton signateur;
    private final GenerateurQrCode qr;
    private final ApplicationEventPublisher publieur;

    public ServiceBillet(BilletRepository billets,
                         InscriptionRepository inscriptions,
                         SignateurJeton signateur,
                         GenerateurQrCode qr,
                         ApplicationEventPublisher publieur) {
        this.billets = billets;
        this.inscriptions = inscriptions;
        this.signateur = signateur;
        this.qr = qr;
        this.publieur = publieur;
    }

    /**
     * Émission uniquement après commit du paiement (RG-10, Observer).
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void surPaiementConfirme(PaiementConfirmeEvent evt) {
        if (billets.findByInscriptionId(evt.inscriptionId()).isEmpty()) {
            var billet = billets.save(Billet.nouveau(evt.inscriptionId()));
            publieur.publishEvent(new BilletEmisEvent(billet.getId(), evt.inscriptionId()));
        }
    }

    @Transactional(readOnly = true)
    public byte[] imageQr(UUID billetId, Long utilisateurConnecteId) {
        var billet = billets.findById(billetId)
                .orElseThrow(() -> new IllegalArgumentException("Billet introuvable : " + billetId));

        Inscription inscription = inscriptions.findById(billet.getInscriptionId()).orElseThrow();

        // Contrôle de propriété OWASP A01
        if (utilisateurConnecteId != null && !inscription.getUtilisateurId().equals(utilisateurConnecteId)) {
            throw new AccessDeniedException("Accès refusé à ce billet");
        }

        String jeton = signateur.signer(billet.getId(), billet.getNonce(), inscription.getEvenementId());
        return qr.generer(jeton, 300);
    }

    @Transactional(readOnly = true)
    public List<Billet> mesBillets(Long utilisateurId) {
        var mesInscriptions = inscriptions.findByUtilisateurId(utilisateurId, org.springframework.data.domain.Pageable.unpaged()).getContent();
        return mesInscriptions.stream()
                .map(i -> billets.findByInscriptionId(i.getId()))
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .toList();
    }

    /**
     * Invalidation automatique des billets lors d'une annulation d'événement (RG-19).
     */
    @EventListener
    @Transactional
    public void surEvenementAnnule(EvenementAnnuleEvent evt) {
        var inscriptionsEvt = inscriptions.findByEvenementIdAndStatutIn(
                evt.evenementId(),
                List.of(tg.ipnetinstitute.technology.features.reservation.domaine.StatutInscription.values())
        );

        for (Inscription i : inscriptionsEvt) {
            billets.findByInscriptionId(i.getId()).ifPresent(b -> {
                b.invalider();
                billets.save(b);
            });
        }
    }
}
