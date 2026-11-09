package tg.ipnetinstitute.technology.features.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.features.billet.service.ServiceBillet;
import tg.ipnetinstitute.technology.features.identite.model.Role;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.notification.model.ModeCanal;
import tg.ipnetinstitute.technology.features.notification.model.ModeleNotification;
import tg.ipnetinstitute.technology.features.notification.model.OutboxNotification;
import tg.ipnetinstitute.technology.features.notification.model.StatutOutbox;
import tg.ipnetinstitute.technology.features.notification.repository.OutboxNotificationRepository;
import tg.ipnetinstitute.technology.features.notification.utils.GabaritsEmail;
import tg.ipnetinstitute.technology.features.notification.wrapper.CanalNotification;
import tg.ipnetinstitute.technology.features.notification.wrapper.CanalNotification.MessageSortant;
import tg.ipnetinstitute.technology.features.notification.wrapper.CanalNotification.PieceJointe;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Envoi périodique de l'outbox avec rejeu automatique (§6 Fiabilité, EF-31, RG-20).
 * Après épuisement des tentatives, les administrateurs sont alertés par e-mail.
 */
@Component
public class DispatcheurOutbox {

    private static final Logger log = LoggerFactory.getLogger(DispatcheurOutbox.class);

    private final OutboxNotificationRepository outbox;
    private final Map<ModeCanal, CanalNotification> canaux;
    private final ServiceBillet serviceBillet;
    private final UtilisateurRepository utilisateurs;
    private final ObjectMapper objectMapper;
    private final String urlFront;
    private final tg.ipnetinstitute.technology.features.parametrage.service.ServiceParametres serviceParametres;

    public DispatcheurOutbox(OutboxNotificationRepository outbox,
                             List<CanalNotification> canalList,
                             ServiceBillet serviceBillet,
                             UtilisateurRepository utilisateurs,
                             ObjectMapper objectMapper,
                             @Value("${app.front.url:http://localhost:5173}") String urlFront,
                             tg.ipnetinstitute.technology.features.parametrage.service.ServiceParametres serviceParametres) {
        this.outbox = outbox;
        this.canaux = canalList.stream().collect(Collectors.toMap(CanalNotification::canal, Function.identity()));
        this.serviceBillet = serviceBillet;
        this.utilisateurs = utilisateurs;
        this.objectMapper = objectMapper;
        this.urlFront = urlFront;
        this.serviceParametres = serviceParametres;
    }

    @Scheduled(fixedDelayString = "${app.notification.intervalle-ms:5000}")
    @Transactional
    public void traiterEnAttente() {
        List<OutboxNotification> enAttente = outbox.findTop20ByStatutOrderByCreeLeAsc(StatutOutbox.EN_ATTENTE);
        for (OutboxNotification notif : enAttente) {
            CanalNotification canal = canaux.get(notif.getCanal());
            try {
                if (canal == null) {
                    throw new IllegalStateException("Aucun canal configuré pour " + notif.getCanal());
                }
                canal.envoyer(construire(notif));
                notif.marquerSucces();
            } catch (Exception e) {
                String erreur = e.getClass().getSimpleName() + " : " + e.getMessage();
                log.warn("Échec d'envoi de la notification {} ({}), tentative {} : {}",
                        notif.getId(), notif.getModele(), notif.getTentatives() + 1, erreur);
                boolean epuisee = notif.marquerEchec(erreur);
                if (epuisee && notif.getModele() != ModeleNotification.ALERTE_ECHEC_ENVOI) {
                    alerterAdministrateurs(notif, erreur);
                }
            }
            outbox.save(notif);
        }
    }

    private MessageSortant construire(OutboxNotification n) throws Exception {
        JsonNode c = objectMapper.readTree(n.getCharge());
        return switch (n.getModele()) {
            case OTP -> new MessageSortant(n.getDestinataire(), "Votre code de vérification IPNET",
                    GabaritsEmail.otp(c.path("code").asText()), List.of());
            case BILLET_EMIS -> {
                var donnees = serviceBillet.pourEmail(UUID.fromString(c.path("billetId").asText()));
                var b = donnees.billet();
                yield new MessageSortant(n.getDestinataire(), "Votre billet – " + b.evenementTitre(),
                        GabaritsEmail.billet(b.evenementTitre(), b.evenementDate(), b.evenementLieu(),
                                b.porteurNom(), b.porteurPrenom(), urlFront),
                        List.of(new PieceJointe("billet-ipnet.png", donnees.qrPng(), "image/png", "qrcode")));
            }
            case PREUVE_REJETEE -> new MessageSortant(n.getDestinataire(), "Paiement non validé – " + c.path("evenementTitre").asText(),
                    GabaritsEmail.preuveRejetee(c.path("evenementTitre").asText(), c.path("motif").asText(), urlFront), List.of());
            case EVENEMENT_ANNULE -> new MessageSortant(n.getDestinataire(), "Annulation – " + c.path("evenementTitre").asText(),
                    GabaritsEmail.evenementAnnule(c.path("evenementTitre").asText(),
                            c.hasNonNull("dateDebut") ? LocalDateTime.parse(c.path("dateDebut").asText()) : null,
                            c.path("motif").asText(), c.path("aRembourser").asBoolean(),
                            serviceParametres.contactPaiement().orElse(null)), List.of());
            case RESET_MOT_DE_PASSE -> new MessageSortant(n.getDestinataire(), "Réinitialisation de votre mot de passe",
                    GabaritsEmail.reinitialisation(c.path("lien").asText()), List.of());
            case ALERTE_ECHEC_ENVOI -> new MessageSortant(n.getDestinataire(), "Alerte : notification non distribuée",
                    GabaritsEmail.alerteEchec(c.path("modele").asText(), c.path("destinataire").asText(),
                            c.path("erreur").asText(), urlFront), List.of());
        };
    }

    private void alerterAdministrateurs(OutboxNotification echouee, String erreur) {
        try {
            String charge = objectMapper.writeValueAsString(Map.of(
                    "notificationId", echouee.getId(),
                    "modele", echouee.getModele().name(),
                    "destinataire", echouee.getDestinataire(),
                    "erreur", erreur));
            utilisateurs.findByRoleOrderByCreeLeDesc(Role.ADMIN).stream()
                    .filter(a -> a.isActif())
                    .forEach(a -> outbox.save(OutboxNotification.creer(ModeCanal.EMAIL, a.getEmail(),
                            ModeleNotification.ALERTE_ECHEC_ENVOI, charge)));
        } catch (Exception e) {
            log.error("Impossible de créer l'alerte administrateur pour la notification {}", echouee.getId(), e);
        }
    }
}
