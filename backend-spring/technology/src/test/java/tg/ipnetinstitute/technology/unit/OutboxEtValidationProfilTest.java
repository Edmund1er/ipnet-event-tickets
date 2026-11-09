package tg.ipnetinstitute.technology.unit;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tg.ipnetinstitute.technology.common.exception.AnneeInvalideException;
import tg.ipnetinstitute.technology.common.exception.CategorieInvalideException;
import tg.ipnetinstitute.technology.common.exception.FiliereInvalideException;
import tg.ipnetinstitute.technology.features.identite.dto.request.DemandeProfil;
import tg.ipnetinstitute.technology.features.identite.model.Role;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.identite.service.ProfilEtudiant;
import tg.ipnetinstitute.technology.features.identite.service.ProfilVisiteur;
import tg.ipnetinstitute.technology.features.notification.model.ModeCanal;
import tg.ipnetinstitute.technology.features.notification.model.ModeleNotification;
import tg.ipnetinstitute.technology.features.notification.model.OutboxNotification;
import tg.ipnetinstitute.technology.features.notification.model.StatutOutbox;
import tg.ipnetinstitute.technology.features.notification.repository.OutboxNotificationRepository;
import tg.ipnetinstitute.technology.features.notification.service.DispatcheurOutbox;

import java.time.Year;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

/** Fiabilité (§6, EF-31, RG-20) : rejeu de l'outbox puis alerte administrateur ; validation des profils (EF-03, EF-04, RG-04, RG-05). */
@SpringBootTest
class OutboxEtValidationProfilTest {

    @Autowired DispatcheurOutbox dispatcheur;
    @Autowired OutboxNotificationRepository outbox;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired ProfilEtudiant profilEtudiant;
    @Autowired ProfilVisiteur profilVisiteur;
    @MockitoBean JavaMailSender mailSender;

    @BeforeEach
    void smtp() {
        when(mailSender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
    }

    @Test
    void envoiEnEchecRejoueJusquAEpuisementPuisAlerteAdmin() {
        Utilisateur admin = Utilisateur.nouveau("admin.alerte@test.tg", "+22890009999", "h", TypeProfil.AUCUN, Role.ADMIN);
        admin.validerEmail();
        utilisateurs.save(admin);
        doThrow(new MailSendException("SMTP indisponible")).when(mailSender).send(any(MimeMessage.class));

        OutboxNotification n = outbox.save(OutboxNotification.creer(ModeCanal.EMAIL, "client@test.tg",
                ModeleNotification.OTP, "{\"code\":\"123456\"}"));
        for (int i = 0; i < OutboxNotification.TENTATIVES_MAX; i++) {
            dispatcheur.traiterEnAttente();
        }

        OutboxNotification apres = outbox.findById(n.getId()).orElseThrow();
        assertThat(apres.getStatut()).isEqualTo(StatutOutbox.ECHEC);
        assertThat(apres.getTentatives()).isEqualTo((short) OutboxNotification.TENTATIVES_MAX);
        assertThat(apres.getDerniereErreur()).contains("SMTP");
        assertThat(outbox.findAll()).anySatisfy(a -> {
            assertThat(a.getModele()).isEqualTo(ModeleNotification.ALERTE_ECHEC_ENVOI);
            assertThat(a.getDestinataire()).isEqualTo("admin.alerte@test.tg");
        });

        // Le serveur redevient disponible : relance manuelle puis envoi réussi
        org.mockito.Mockito.reset(mailSender);
        when(mailSender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
        apres.relancer();
        outbox.save(apres);
        dispatcheur.traiterEnAttente();
        assertThat(outbox.findById(n.getId()).orElseThrow().getStatut()).isEqualTo(StatutOutbox.ENVOYEE);
    }

    @Test
    void profilEtudiantInvalide() {
        assertThatThrownBy(() -> profilEtudiant.valider(new DemandeProfil.DemandeVisiteur("A", "B", 1L, null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> profilEtudiant.valider(new DemandeProfil.DemandeEtudiant("A", "B", null, 2024)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("EF-03");
        assertThatThrownBy(() -> profilEtudiant.valider(new DemandeProfil.DemandeEtudiant("A", "B", 1L, null)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("EF-03");
        assertThatThrownBy(() -> profilEtudiant.valider(new DemandeProfil.DemandeEtudiant("A", "B", 987654L, 2024)))
                .isInstanceOf(FiliereInvalideException.class);
        assertThat(profilEtudiant.type()).isEqualTo(TypeProfil.ETUDIANT);
        assertThat(Year.now().getValue()).isPositive();
        assertThat(AnneeInvalideException.class).isNotNull();
    }

    @Test
    void profilVisiteurInvalide() {
        assertThatThrownBy(() -> profilVisiteur.valider(new DemandeProfil.DemandeEtudiant("A", "B", 1L, 2024)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> profilVisiteur.valider(new DemandeProfil.DemandeVisiteur("A", "B", null, null)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("EF-04");
        assertThatThrownBy(() -> profilVisiteur.valider(new DemandeProfil.DemandeVisiteur("A", "B", 987654L, null)))
                .isInstanceOf(CategorieInvalideException.class);
        assertThat(profilVisiteur.type()).isEqualTo(TypeProfil.VISITEUR);
    }
}
