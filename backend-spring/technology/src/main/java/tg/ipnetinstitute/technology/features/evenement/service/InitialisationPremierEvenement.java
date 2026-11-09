package tg.ipnetinstitute.technology.features.evenement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.features.evenement.dto.request.DemandeEvenement;
import tg.ipnetinstitute.technology.features.identite.service.ServiceIdentite;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Crée et publie le premier événement de la plateforme si la base n'en contient aucun.
 * Valeurs configurables (app.premier-evenement.*). Ensuite, seul l'administrateur
 * modifie l'événement (date, heure, lieu, prix, capacité…) depuis l'interface.
 */
@Component
@Order(2)
public class InitialisationPremierEvenement implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InitialisationPremierEvenement.class);

    private final ServiceEvenement serviceEvenement;
    private final ServiceIdentite serviceIdentite;
    private final boolean actif;
    private final String titre;
    private final String description;
    private final LocalDateTime dateDebut;
    private final String lieu;
    private final BigDecimal prix;
    private final String devise;
    private final int capacite;
    private final String image;

    public InitialisationPremierEvenement(
            ServiceEvenement serviceEvenement,
            ServiceIdentite serviceIdentite,
            @Value("${app.premier-evenement.actif:true}") boolean actif,
            @Value("${app.premier-evenement.titre}") String titre,
            @Value("${app.premier-evenement.description}") String description,
            @Value("${app.premier-evenement.date-debut}") String dateDebut,
            @Value("${app.premier-evenement.lieu}") String lieu,
            @Value("${app.premier-evenement.prix}") BigDecimal prix,
            @Value("${app.premier-evenement.devise:XOF}") String devise,
            @Value("${app.premier-evenement.capacite}") int capacite,
            @Value("${app.premier-evenement.image:seed/jpope-2026.jpg}") String image) {
        this.serviceEvenement = serviceEvenement;
        this.serviceIdentite = serviceIdentite;
        this.actif = actif;
        this.titre = titre;
        this.description = description;
        this.dateDebut = LocalDateTime.parse(dateDebut);
        this.lieu = lieu;
        this.prix = prix;
        this.devise = devise;
        this.capacite = capacite;
        this.image = image;
    }

    /** Installation via l'assistant : le premier administrateur vient d'être créé. */
    @org.springframework.transaction.event.TransactionalEventListener(fallbackExecution = true)
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void surAdministrateurCree(tg.ipnetinstitute.technology.features.identite.service.AdministrateurCreeEvent e) {
        run(null);
    }

    @Override
    public synchronized void run(ApplicationArguments args) {
        if (!actif || !serviceEvenement.aucunEvenement()) {
            return;
        }
        var adminId = serviceIdentite.premierAdministrateurActif();
        if (adminId.isEmpty()) {
            log.warn("Premier événement non créé : aucun administrateur actif (définir ADMIN_PASSWORD).");
            return;
        }
        if (!dateDebut.isAfter(LocalDateTime.now())) {
            log.warn("Premier événement non créé : la date configurée ({}) est déjà passée.", dateDebut);
            return;
        }
        var demande = new DemandeEvenement(titre, description, dateDebut, lieu, prix, devise, capacite);
        var cree = serviceEvenement.creerEtPublierInitial(demande, adminId.get(), lireImage());
        log.info("Premier événement créé et publié : « {} » le {}", cree.titre(), cree.dateDebut());
    }

    private byte[] lireImage() {
        if (image == null || image.isBlank()) return null;
        ClassPathResource ressource = new ClassPathResource(image);
        if (!ressource.exists()) return null;
        try (InputStream in = ressource.getInputStream()) {
            return in.readAllBytes();
        } catch (IOException e) {
            log.warn("Image du premier événement illisible : {}", e.getMessage());
            return null;
        }
    }
}
