package tg.ipnetinstitute.technology.features.identite.service;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.features.billet.repository.BilletRepository;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;
import tg.ipnetinstitute.technology.features.evenement.service.ServiceEvenement;
import tg.ipnetinstitute.technology.features.identite.dto.response.TableauDeBordResponse;
import tg.ipnetinstitute.technology.features.notification.model.StatutOutbox;
import tg.ipnetinstitute.technology.features.notification.repository.OutboxNotificationRepository;
import tg.ipnetinstitute.technology.features.paiement.model.StatutPaiement;
import tg.ipnetinstitute.technology.features.paiement.repository.PaiementRepository;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;

/** Indicateurs agrégés pour l'accueil de l'administrateur. */
@Service
public class ServiceTableauDeBord {

    private final ServiceEvenement serviceEvenement;
    private final InscriptionRepository inscriptions;
    private final PaiementRepository paiements;
    private final BilletRepository billets;
    private final OutboxNotificationRepository outbox;
    private final tg.ipnetinstitute.technology.features.parametrage.service.ServiceParametres serviceParametres;
    private final tg.ipnetinstitute.technology.features.notification.service.ServiceDiagnosticSmtp diagnosticSmtp;

    public ServiceTableauDeBord(ServiceEvenement serviceEvenement, InscriptionRepository inscriptions,
                                PaiementRepository paiements, BilletRepository billets,
                                OutboxNotificationRepository outbox,
                                tg.ipnetinstitute.technology.features.parametrage.service.ServiceParametres serviceParametres,
                                tg.ipnetinstitute.technology.features.notification.service.ServiceDiagnosticSmtp diagnosticSmtp) {
        this.serviceEvenement = serviceEvenement;
        this.inscriptions = inscriptions;
        this.paiements = paiements;
        this.billets = billets;
        this.outbox = outbox;
        this.serviceParametres = serviceParametres;
        this.diagnosticSmtp = diagnosticSmtp;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public TableauDeBordResponse indicateurs() {
        return new TableauDeBordResponse(
                serviceEvenement.compterParStatut(StatutEvenement.PUBLIE),
                serviceEvenement.compterParStatut(StatutEvenement.BROUILLON),
                inscriptions.countByStatut(StatutInscription.EN_ATTENTE_PAIEMENT),
                inscriptions.countByStatut(StatutInscription.CONFIRMEE),
                paiements.countByStatutAndReferenceOperateurIsNotNull(StatutPaiement.EN_ATTENTE),
                paiements.countByStatut(StatutPaiement.A_REMBOURSER),
                billets.countByInvalideFalse(),
                billets.countByScanneLeIsNotNull(),
                outbox.countByStatut(StatutOutbox.ECHEC),
                serviceParametres.paiementConfigure(),
                diagnosticSmtp.configure()
        );
    }
}
