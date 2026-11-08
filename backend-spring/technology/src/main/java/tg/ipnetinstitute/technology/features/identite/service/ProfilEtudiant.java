package tg.ipnetinstitute.technology.features.identite.service;
import tg.ipnetinstitute.technology.features.identite.dto.request.DemandeProfil;
import tg.ipnetinstitute.technology.features.identite.dto.response.ResumePersonne;

import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.exception.AnneeInvalideException;
import tg.ipnetinstitute.technology.common.exception.FiliereInvalideException;
import tg.ipnetinstitute.technology.features.identite.model.Etudiant;
import tg.ipnetinstitute.technology.features.identite.model.Filiere;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.identite.repository.EtudiantRepository;
import tg.ipnetinstitute.technology.features.identite.repository.FiliereRepository;

import java.time.Year;

@Component
public class ProfilEtudiant implements ProfilParticipant {

    private final FiliereRepository filieres;
    private final EtudiantRepository etudiants;

    public ProfilEtudiant(FiliereRepository filieres, EtudiantRepository etudiants) {
        this.filieres = filieres;
        this.etudiants = etudiants;
    }

    @Override
    public TypeProfil type() {
        return TypeProfil.ETUDIANT;
    }

    @Override
    public void valider(DemandeProfil demande) {
        if (!(demande instanceof DemandeProfil.DemandeEtudiant e)) {
            throw new IllegalArgumentException("Demande incompatible avec le profil étudiant");
        }
        filieres.findByIdAndActifTrue(e.filiereId())
                .orElseThrow(() -> new FiliereInvalideException(e.filiereId()));

        int anneeMax = Year.now().getValue();
        // RG-04 : <= année courante, pas de borne basse stricte
        if (e.anneeInscriptionL1() > anneeMax) {
            throw new AnneeInvalideException(e.anneeInscriptionL1());
        }
    }

    @Override
    public void enregistrer(Long utilisateurId, DemandeProfil demande) {
        DemandeProfil.DemandeEtudiant e = (DemandeProfil.DemandeEtudiant) demande;
        Filiere filiere = filieres.findByIdAndActifTrue(e.filiereId())
                .orElseThrow(() -> new FiliereInvalideException(e.filiereId()));
        int anneeCourante = Year.now().getValue();

        Etudiant etudiant = Etudiant.creer(
                utilisateurId,
                e.nom(),
                e.prenom(),
                e.adresse(),
                filiere,
                e.anneeInscriptionL1().shortValue(),
                anneeCourante
        );
        etudiants.save(etudiant);
    }

    @Override
    public ResumePersonne resumer(Long utilisateurId) {
        return etudiants.findById(utilisateurId)
                .map(e -> new ResumePersonne(e.getNom(), e.getPrenom(), e.getAdresse()))
                .orElse(new ResumePersonne("Inconnu", "Inconnu", "N/A"));
    }
}
