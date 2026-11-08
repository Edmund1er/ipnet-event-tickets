package tg.ipnetinstitute.technology.features.participant.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tg.ipnetinstitute.technology.features.participant.domaine.CategorieVisiteur;
import tg.ipnetinstitute.technology.features.participant.domaine.Filiere;
import tg.ipnetinstitute.technology.features.participant.infrastructure.CategorieVisiteurRepository;
import tg.ipnetinstitute.technology.features.participant.infrastructure.FiliereRepository;

import java.util.List;

@RestController
@RequestMapping("/api/referentiels")
public class ReferentielController {

    private final FiliereRepository filiereRepository;
    private final CategorieVisiteurRepository categorieVisiteurRepository;

    public ReferentielController(FiliereRepository filiereRepository, CategorieVisiteurRepository categorieVisiteurRepository) {
        this.filiereRepository = filiereRepository;
        this.categorieVisiteurRepository = categorieVisiteurRepository;
    }

    @GetMapping("/filieres")
    public ResponseEntity<List<Filiere>> listerFilieres() {
        return ResponseEntity.ok(filiereRepository.findByActifTrue());
    }

    @GetMapping("/categories-visiteurs")
    public ResponseEntity<List<CategorieVisiteur>> listerCategories() {
        return ResponseEntity.ok(categorieVisiteurRepository.findByActifTrue());
    }
}
