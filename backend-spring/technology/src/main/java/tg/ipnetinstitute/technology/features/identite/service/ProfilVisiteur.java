package tg.ipnetinstitute.technology.features.identite.service;
import tg.ipnetinstitute.technology.features.identite.dto.request.DemandeProfil;
import tg.ipnetinstitute.technology.features.identite.dto.response.ResumePersonne;

import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.exception.CategorieInvalideException;
import tg.ipnetinstitute.technology.features.identite.model.CategorieVisiteur;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.identite.model.Visiteur;
import tg.ipnetinstitute.technology.features.identite.repository.CategorieVisiteurRepository;
import tg.ipnetinstitute.technology.features.identite.repository.VisiteurRepository;

@Component
public class ProfilVisiteur implements ProfilParticipant {

    private final CategorieVisiteurRepository categories;
    private final VisiteurRepository visiteurs;

    public ProfilVisiteur(CategorieVisiteurRepository categories, VisiteurRepository visiteurs) {
        this.categories = categories;
        this.visiteurs = visiteurs;
    }

    @Override
    public TypeProfil type() {
        return TypeProfil.VISITEUR;
    }

    @Override
    public void valider(DemandeProfil demande) {
        if (!(demande instanceof DemandeProfil.DemandeVisiteur v)) {
            throw new IllegalArgumentException("Demande incompatible avec le profil visiteur");
        }
        if (v.categorieId() == null) {
            throw new IllegalArgumentException("La catégorie est obligatoire pour un visiteur externe");
        }
        categories.findByIdAndActifTrue(v.categorieId())
                .orElseThrow(() -> new CategorieInvalideException(v.categorieId()));
    }

    @Override
    public void enregistrer(Long utilisateurId, DemandeProfil demande) {
        DemandeProfil.DemandeVisiteur v = (DemandeProfil.DemandeVisiteur) demande;
        CategorieVisiteur categorie = categories.findByIdAndActifTrue(v.categorieId())
                .orElseThrow(() -> new CategorieInvalideException(v.categorieId()));

        Visiteur visiteur = Visiteur.creer(
                utilisateurId,
                v.nom(),
                v.prenom(),
                categorie,
                v.organisation()
        );
        visiteurs.save(visiteur);
    }

    @Override
    public ResumePersonne resumer(Long utilisateurId) {
        return visiteurs.findById(utilisateurId)
                .map(v -> new ResumePersonne(v.getNom(), v.getPrenom(), detail(v)))
                .orElse(new ResumePersonne("Inconnu", "Inconnu", "—"));
    }

    private static String detail(Visiteur v) {
        String base = v.getCategorie().getLibelle();
        return v.getOrganisation() == null || v.getOrganisation().isBlank() ? base : base + " — " + v.getOrganisation();
    }
}
