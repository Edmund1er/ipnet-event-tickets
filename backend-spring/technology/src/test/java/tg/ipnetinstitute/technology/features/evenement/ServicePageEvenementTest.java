package tg.ipnetinstitute.technology.features.evenement;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.features.evenement.dto.PageEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.PageEvenement.Apparence;
import tg.ipnetinstitute.technology.features.evenement.dto.PageEvenement.Creneau;
import tg.ipnetinstitute.technology.features.evenement.dto.PageEvenement.Intervenant;
import tg.ipnetinstitute.technology.features.evenement.dto.PageEvenement.Section;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.repository.EvenementRepository;
import tg.ipnetinstitute.technology.features.evenement.service.AccesEvenement;
import tg.ipnetinstitute.technology.features.evenement.service.ServicePageEvenement;
import tg.ipnetinstitute.technology.features.evenement.wrapper.StockageImageWrapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Validation de la page d'un événement : tout ce qui est reçu est contrôlé et recopié champ par champ. */
class ServicePageEvenementTest {

    private static final String IMAGE = "123e4567-e89b-12d3-a456-426614174000.png";

    private ServicePageEvenement service;
    private Evenement evenement;
    private StockageImageWrapper stockage;

    @BeforeEach
    void preparer() {
        evenement = Evenement.creer("Gala", "d", LocalDateTime.now().plusDays(5), "Lomé", BigDecimal.TEN, "XOF", 10, 1L);
        var acces = mock(AccesEvenement.class);
        when(acces.charger(anyLong())).thenReturn(evenement);
        when(acces.chargerPourModification(anyLong())).thenReturn(evenement);
        stockage = mock(StockageImageWrapper.class);
        service = new ServicePageEvenement(mock(EvenementRepository.class), acces, stockage);
    }

    private static Section section(String type, String titre, List<Intervenant> interv, List<Creneau> creneaux, String image) {
        return new Section("s1", type, true, titre, null, null, image, null, null, null, null, interv, creneaux);
    }

    @Test
    void pageSansSection_estValide_et_reste_vide() {
        var propre = service.enregistrer(1L, PageEvenement.vide(), 1L);
        assertThat(propre.sections()).isEmpty();
        assertThat(service.lire(1L, true).sections()).isEmpty();
    }

    @Test
    void sectionsEnregistrees_sontRelues_et_les_textes_nettoyes() {
        var page = new PageEvenement(1, List.of(
                section("A_PROPOS", "  Présentation  ", null, null, null),
                section("INTERVENANTS", "Artistes", List.of(new Intervenant("Ama", " Chanteuse ", null), new Intervenant("  ", "vide", null)), null, null),
                section("PROGRAMME", "Programme", null, List.of(new Creneau("2026-12-05", "18:00", "", "Ouverture", null, null, null)), null)));
        service.enregistrer(1L, page, 1L);

        var relue = service.lire(1L, true);
        assertThat(relue.sections()).hasSize(3);
        assertThat(relue.sections().get(0).titre()).isEqualTo("Présentation");
        assertThat(relue.sections().get(1).intervenants()).extracting(Intervenant::nom).containsExactly("Ama");
        assertThat(relue.sections().get(2).creneaux().get(0).fin()).isNull();
    }

    @Test
    void apparenceEstEnregistreeEtLesCouleursNonHexadecimalesSontRefusees() {
        var page = new PageEvenement(1, new Apparence("#7C3AED", "#c4b5fd", "#21133b", 66), List.of());
        service.enregistrer(1L, page, 1L);

        assertThat(service.lire(1L, true).apparence())
                .isEqualTo(new Apparence("#7c3aed", "#c4b5fd", "#21133b", 66));
        assertThatThrownBy(() -> service.enregistrer(1L,
                new PageEvenement(1, new Apparence("red;display:none", null, null, 50), List.of()), 1L))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.enregistrer(1L,
                new PageEvenement(1, new Apparence(null, null, null, 19), List.of()), 1L))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.enregistrer(1L,
                new PageEvenement(1, new Apparence(null, null, null, 91), List.of()), 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void sectionsGrilleEtCouleursParZone_sontConserveesEtValidees() {
        var apparence = new Apparence(null, null, null, null, "#102030", "#ffffff", "#f8fafc", "#111827", "#ffffff", "#172033", "#ffffff", "#2563eb");
        var carte = new PageEvenement.BlocElement("carte-1", "Accueil", "Un premier temps d'accueil", null);
        var section = new Section("grille-1", "CARTES", true, "Temps forts", null, null, null, null, null, null, null,
                null, null, List.of(carte), 3, "#ffffff", "#172033", "#2563eb", "#f8fafc", "#2563eb");
        var enregistree = service.enregistrer(1L, new PageEvenement(1, apparence, List.of(section)), 1L);

        assertThat(enregistree.apparence().couleurEntete()).isEqualTo("#102030");
        assertThat(enregistree.sections().get(0).elements()).containsExactly(carte);
        assertThat(enregistree.sections().get(0).couleurCarte()).isEqualTo("#f8fafc");
        var mauvaiseCarte = new PageEvenement.BlocElement("carte-1", "Titre", "x".repeat(1001), null);
        var mauvaiseSection = new Section("grille-1", "CARTES", true, "Grille", null, null, null, null, null, null, null,
                null, null, List.of(mauvaiseCarte), 5, "#ffffff", null, null, null, null);
        assertThatThrownBy(() -> service.enregistrer(1L, new PageEvenement(1, null, List.of(mauvaiseSection)), 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void typeInconnu_jourOuHeureInvalides_imageInvalide_sontRefuses() {
        assertThatThrownBy(() -> service.enregistrer(1L, new PageEvenement(1, List.of(section("SCRIPT", "x", null, null, null))), 1L))
                .isInstanceOf(IllegalArgumentException.class);
        var mauvaisJour = section("PROGRAMME", "p", null, List.of(new Creneau("5 décembre", "18:00", null, "x", null, null, null)), null);
        assertThatThrownBy(() -> service.enregistrer(1L, new PageEvenement(1, List.of(mauvaisJour)), 1L)).isInstanceOf(IllegalArgumentException.class);
        var mauvaiseHeure = section("PROGRAMME", "p", null, List.of(new Creneau("2026-12-05", "25:99", null, "x", null, null, null)), null);
        assertThatThrownBy(() -> service.enregistrer(1L, new PageEvenement(1, List.of(mauvaiseHeure)), 1L)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.enregistrer(1L, new PageEvenement(1, List.of(section("HERO", "t", null, null, "../../etc/passwd"))), 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void textesTropLongs_etTropDeSections_sontRefuses() {
        assertThatThrownBy(() -> service.enregistrer(1L, new PageEvenement(1, List.of(section("TEXTE", "x".repeat(151), null, null, null))), 1L))
                .isInstanceOf(IllegalArgumentException.class);
        var trop = java.util.stream.IntStream.range(0, 13).mapToObj(i -> section("TEXTE", "t" + i, null, null, null)).toList();
        assertThatThrownBy(() -> service.enregistrer(1L, new PageEvenement(1, trop), 1L)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void imageServie_seulementSiLaPageLaReference() {
        when(stockage.lire(IMAGE)).thenReturn(new ByteArrayResource(new byte[]{1}));
        when(stockage.typeMime(IMAGE)).thenReturn("image/png");
        assertThatThrownBy(() -> service.image(1L, IMAGE, true)).isInstanceOf(RessourceIntrouvableException.class);

        service.enregistrer(1L, new PageEvenement(1, List.of(section("HERO", "t", null, null, IMAGE))), 1L);
        assertThat(service.image(1L, IMAGE, true).typeMime()).isEqualTo("image/png");
        assertThatThrownBy(() -> service.image(1L, "autre.png", true)).isInstanceOf(RessourceIntrouvableException.class);
    }

    @Test
    void brouillon_invisibleAuPublic_visibleParLAdmin() {
        assertThatThrownBy(() -> service.lire(1L, false)).isInstanceOf(RessourceIntrouvableException.class);
        assertThat(service.lire(1L, true)).isNotNull();
    }
}
