package tg.ipnetinstitute.technology.features.evenement.service;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.features.evenement.dto.request.DemandeActivite;
import tg.ipnetinstitute.technology.features.evenement.dto.response.EvenementResume;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;
import tg.ipnetinstitute.technology.features.evenement.model.TypeEvenement;
import tg.ipnetinstitute.technology.features.evenement.repository.EvenementRepository;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;

import java.time.Clock;
import java.time.LocalDateTime;

/** Programme d'un événement-cadre : activités (payantes, gratuites, en accès libre) et pass. */
@Service
public class ServiceProgramme {

    private final EvenementRepository evenements;
    private final InscriptionRepository inscriptions;
    private final EvenementResumeMapper mapper;
    private final AccesEvenement acces;

    public ServiceProgramme(EvenementRepository evenements, InscriptionRepository inscriptions,
                            EvenementResumeMapper mapper, AccesEvenement acces) {
        this.evenements = evenements;
        this.inscriptions = inscriptions;
        this.mapper = mapper;
        this.acces = acces;
    }

    
    /** Activités et pass d'un cadre ; le public ne voit pas les brouillons. */
    @Transactional(readOnly = true)
    public java.util.List<EvenementResume> listerActivites(Long cadreId, boolean admin) {
        Evenement cadre = acces.charger(cadreId);
        if (!admin && cadre.getStatut() == StatutEvenement.BROUILLON) {
            throw new RessourceIntrouvableException("Événement", cadreId);
        }
        return evenements.findByParentIdOrderByDateDebutAsc(cadreId).stream()
                .filter(e -> admin || e.getStatut() != StatutEvenement.BROUILLON)
                .map(mapper::resume)
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "CREATION_ACTIVITE", typeCible = "EVENEMENT")
    public EvenementResume creerActivite(Long cadreId, DemandeActivite d, Long adminId) {
        Evenement cadre = acces.chargerPourModification(cadreId);
        if (cadre.getType() != TypeEvenement.CADRE) {
            throw new IllegalStateException("Seul un programme multi-jours peut recevoir des activités");
        }
        var champs = normaliser(cadre, d);
        Evenement e = Evenement.creer(d.titre(), d.description(), champs.debut(), d.lieu() != null ? d.lieu() : cadre.getLieu(),
                champs.prix(), cadre.getDevise(), champs.capacite(), champs.limite(), adminId);
        e.definirStructure(TypeEvenement.valueOf(d.type()), cadreId, champs.fin(), d.categorie(),
                champs.accesLibre(), champs.portee(), champs.jour());
        e.definirApparence(d.ambiance() != null ? d.ambiance() : cadre.getAmbiance(),
                d.couleurPrincipale() != null ? d.couleurPrincipale() : cadre.getCouleurPrincipale());
        if (cadre.getStatut() == StatutEvenement.PUBLIE && !e.finDeVente().isBefore(LocalDateTime.now())) {
            e.publier(Clock.systemDefaultZone());
        }
        return mapper.resume(evenements.save(e));
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "MODIFICATION_ACTIVITE", typeCible = "EVENEMENT")
    public EvenementResume modifierActivite(Long activiteId, DemandeActivite d, Long adminId) {
        Evenement e = acces.chargerPourModification(activiteId);
        if (e.getParentId() == null) {
            throw new IllegalStateException("Cet événement n'est pas une activité d'un programme");
        }
        if (inscriptions.countByEvenementIdAndStatut(activiteId, StatutInscription.CONFIRMEE) > 0) {
            throw new IllegalStateException("Cette activité a déjà des réservations confirmées : elle ne peut plus être modifiée");
        }
        Evenement cadre = acces.charger(e.getParentId());
        var champs = normaliser(cadre, d);
        e.modifier(d.titre(), d.description(), champs.debut(), d.lieu() != null ? d.lieu() : cadre.getLieu(),
                champs.prix(), cadre.getDevise(), Math.max(champs.capacite(), e.getPlacesReservees() == 0 ? 1 : e.getPlacesReservees()));
        e.definirStructure(e.getType(), e.getParentId(), champs.fin(), d.categorie(), champs.accesLibre(), champs.portee(), champs.jour());
        e.definirDateLimite(champs.limite());
        if (d.ambiance() != null || d.couleurPrincipale() != null) {
            e.definirApparence(d.ambiance(), d.couleurPrincipale());
        }
        return mapper.resume(evenements.save(e));
    }

    /** Suppression d'une activité : uniquement sans aucune réservation (sinon, l'annuler). */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "SUPPRESSION_ACTIVITE", typeCible = "EVENEMENT")
    public void supprimerActivite(Long activiteId, Long adminId) {
        Evenement e = acces.charger(activiteId);
        if (e.getParentId() == null) {
            throw new IllegalStateException("Cet événement n'est pas une activité d'un programme");
        }
        if (e.getPlacesReservees() > 0 || inscriptions.existsByEvenementId(activiteId)) {
            throw new IllegalStateException("Cette activité a des réservations : annulez-la plutôt que de la supprimer");
        }
        evenements.delete(e);
    }

    /** Recopie les activités d'un jour sur d'autres jours (mêmes horaires, mêmes réglages). Les pass ne sont pas copiés. */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "DUPLICATION_JOUR", typeCible = "EVENEMENT")
    public java.util.List<EvenementResume> dupliquerJour(Long cadreId, java.time.LocalDate source,
                                                         java.util.List<java.time.LocalDate> cibles, Long adminId) {
        Evenement cadre = acces.chargerPourModification(cadreId);
        var modeles = evenements.findByParentIdOrderByDateDebutAsc(cadreId).stream()
                .filter(a -> a.getType() == TypeEvenement.ACTIVITE
                        && a.getStatut() != StatutEvenement.ANNULE
                        && a.getDateDebut().toLocalDate().equals(source))
                .toList();
        if (modeles.isEmpty()) {
            throw new IllegalArgumentException("Aucune activité ce jour-là");
        }
        var crees = new java.util.ArrayList<EvenementResume>();
        for (java.time.LocalDate jour : cibles) {
            if (jour.equals(source)) continue;
            for (Evenement m : modeles) {
                long decalage = java.time.temporal.ChronoUnit.DAYS.between(source, jour);
                LocalDateTime debut = m.getDateDebut().plusDays(decalage);
                LocalDateTime fin = m.finEffective().plusDays(decalage);
                if (debut.isBefore(cadre.getDateDebut()) || fin.isAfter(cadre.getDateFin())) {
                    continue; // hors des dates du programme
                }
                Evenement copie = Evenement.creer(m.getTitre(), m.getDescription(), debut, m.getLieu(), m.getPrix(),
                        m.getDevise(), m.getCapacite(), null, adminId);
                copie.definirStructure(TypeEvenement.ACTIVITE, cadreId, fin, m.getCategorie(), m.isAccesLibre(), null, null);
                copie.definirApparence(m.getAmbiance(), m.getCouleurPrincipale());
                if (cadre.getStatut() == StatutEvenement.PUBLIE && !copie.finDeVente().isBefore(LocalDateTime.now())) {
                    copie.publier(Clock.systemDefaultZone());
                }
                crees.add(mapper.resume(evenements.save(copie)));
            }
        }
        return crees;
    }

    private record ChampsActivite(LocalDateTime debut, LocalDateTime fin, java.math.BigDecimal prix, int capacite,
                                  boolean accesLibre, String portee, java.time.LocalDate jour, LocalDateTime limite) {}

    /** Règles communes de validation d'une activité ou d'un pass par rapport à son programme. */
    private ChampsActivite normaliser(Evenement cadre, DemandeActivite d) {
        LocalDateTime debut = d.dateDebut();
        LocalDateTime fin = d.dateFin();
        boolean pass = "PASS".equals(d.type());
        String portee = null;
        java.time.LocalDate jour = null;
        if (pass) {
            portee = d.passPortee() == null ? "GLOBAL" : d.passPortee();
            if ("GLOBAL".equals(portee)) {
                debut = cadre.getDateDebut();
                fin = cadre.getDateFin();
            } else {
                jour = d.passJour();
                if (jour == null) {
                    throw new IllegalArgumentException("Un pass journée doit préciser le jour concerné");
                }
                debut = jour.atStartOfDay().isBefore(cadre.getDateDebut()) ? cadre.getDateDebut() : jour.atStartOfDay();
                fin = jour.atTime(23, 59);
                if (fin.isAfter(cadre.getDateFin())) fin = cadre.getDateFin();
            }
        }
        if (fin.isBefore(debut)) {
            throw new IllegalArgumentException("La fin doit être postérieure au début");
        }
        if (debut.isBefore(cadre.getDateDebut()) || fin.isAfter(cadre.getDateFin())) {
            throw new IllegalArgumentException("L'activité doit se dérouler pendant le programme (du "
                    + cadre.getDateDebut().toLocalDate() + " au " + cadre.getDateFin().toLocalDate() + ")");
        }
        boolean libre = !pass && d.accesLibre();
        java.math.BigDecimal prix = libre ? java.math.BigDecimal.ZERO : d.prix();
        int capacite = libre ? 1 : (d.capacite() == null ? 0 : d.capacite());
        if (!libre && capacite < 1) {
            throw new IllegalArgumentException("Le nombre de places est obligatoire (hors accès libre)");
        }
        LocalDateTime limite = d.dateLimiteReservation();
        if (limite != null && limite.isAfter(pass ? fin : debut)) {
            throw new IllegalArgumentException("La date limite de réservation ne peut pas dépasser la vente");
        }
        return new ChampsActivite(debut, fin, prix, capacite, libre, portee, jour, limite);
    }
}
