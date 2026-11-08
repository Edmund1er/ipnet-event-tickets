package tg.ipnetinstitute.technology.features.participant.application;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.audit.Auditable;
import tg.ipnetinstitute.technology.features.participant.domaine.Etudiant;
import tg.ipnetinstitute.technology.features.participant.domaine.Filiere;
import tg.ipnetinstitute.technology.features.participant.domaine.HistoriqueChangementFiliere;
import tg.ipnetinstitute.technology.features.participant.infrastructure.EtudiantRepository;
import tg.ipnetinstitute.technology.features.participant.infrastructure.FiliereRepository;
import tg.ipnetinstitute.technology.features.participant.infrastructure.HistoriqueChangementFiliereRepository;

import java.time.Year;

/**
 * Service pour la gestion du parcours étudiant (EF-09, RG-04).
 */
@Service
public class ServiceProfilEtudiant {

    private final EtudiantRepository etudiants;
    private final FiliereRepository filieres;
    private final HistoriqueChangementFiliereRepository historiqueRepository;

    public ServiceProfilEtudiant(EtudiantRepository etudiants,
                                 FiliereRepository filieres,
                                 HistoriqueChangementFiliereRepository historiqueRepository) {
        this.etudiants = etudiants;
        this.filieres = filieres;
        this.historiqueRepository = historiqueRepository;
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_PARTICIPANT')")
    @Auditable(action = "CHANGEMENT_FILIERE", typeCible = "ETUDIANT")
    public void changerFiliere(Long utilisateurId, Long nouvelleFiliereId) {
        Etudiant etudiant = etudiants.findById(utilisateurId)
                .orElseThrow(() -> new IllegalArgumentException("Profil étudiant introuvable : " + utilisateurId));

        Filiere nouvelleFiliere = filieres.findByIdAndActifTrue(nouvelleFiliereId)
                .orElseThrow(() -> new IllegalArgumentException("Filière inactive ou introuvable : " + nouvelleFiliereId));

        Long ancienneFiliereId = etudiant.getFiliere() != null ? etudiant.getFiliere().getId() : null;

        int anneeCourante = Year.now().getValue();
        // Vérification RG-04 portée par l'entité
        etudiant.changerFiliere(nouvelleFiliere, anneeCourante);
        etudiants.save(etudiant);

        // Traçabilité EF-09 & RG-16
        HistoriqueChangementFiliere hist = new HistoriqueChangementFiliere(
                utilisateurId,
                ancienneFiliereId,
                nouvelleFiliereId,
                utilisateurId
        );
        historiqueRepository.save(hist);
    }
}
