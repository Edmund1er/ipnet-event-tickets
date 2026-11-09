package tg.ipnetinstitute.technology.features.identite.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tg.ipnetinstitute.technology.features.identite.dto.response.CategorieVisiteurResponse;
import tg.ipnetinstitute.technology.features.identite.dto.response.FiliereResponse;
import tg.ipnetinstitute.technology.features.identite.repository.CategorieVisiteurRepository;
import tg.ipnetinstitute.technology.features.identite.repository.FiliereRepository;

import java.util.List;

/** Référentiels publics nécessaires au formulaire d'inscription (EF-03, EF-04). */
@RestController
@RequestMapping("/api/referentiels")
public class ReferentielController {

    private final FiliereRepository filiereRepository;
    private final CategorieVisiteurRepository categorieVisiteurRepository;
    private final tg.ipnetinstitute.technology.common.validation.telephone.ValidateurTelephone validateurTelephone;

    public ReferentielController(FiliereRepository filiereRepository, CategorieVisiteurRepository categorieVisiteurRepository,
                                 tg.ipnetinstitute.technology.common.validation.telephone.ValidateurTelephone validateurTelephone) {
        this.filiereRepository = filiereRepository;
        this.categorieVisiteurRepository = categorieVisiteurRepository;
        this.validateurTelephone = validateurTelephone;
    }

    /** Politique de numérotation appliquée par le serveur, reprise par le front (même métadonnées libphonenumber). */
    public record PolitiqueTelephone(String regionParDefaut, int indicatifParDefaut, List<String> regionsAutorisees) {}

    @GetMapping("/telephone")
    public ResponseEntity<PolitiqueTelephone> politiqueTelephone() {
        String region = validateurTelephone.regionParDefaut();
        return ResponseEntity.ok(new PolitiqueTelephone(region,
                com.google.i18n.phonenumbers.PhoneNumberUtil.getInstance().getCountryCodeForRegion(region),
                validateurTelephone.regionsAutorisees()));
    }

    @GetMapping("/filieres")
    public ResponseEntity<List<FiliereResponse>> listerFilieres() {
        return ResponseEntity.ok(filiereRepository.findByActifTrue().stream()
                .map(f -> new FiliereResponse(f.getId(), f.getLibelle()))
                .toList());
    }

    @GetMapping("/categories-visiteurs")
    public ResponseEntity<List<CategorieVisiteurResponse>> listerCategories() {
        return ResponseEntity.ok(categorieVisiteurRepository.findByActifTrue().stream()
                .map(c -> new CategorieVisiteurResponse(c.getId(), c.getCode(), c.getLibelle()))
                .toList());
    }
}
