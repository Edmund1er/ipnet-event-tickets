package tg.ipnetinstitute.technology.features.evenement.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.features.evenement.dto.PageEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.PageEvenement.Creneau;
import tg.ipnetinstitute.technology.features.evenement.dto.PageEvenement.Intervenant;
import tg.ipnetinstitute.technology.features.evenement.dto.PageEvenement.Section;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;
import tg.ipnetinstitute.technology.features.evenement.repository.EvenementRepository;
import tg.ipnetinstitute.technology.features.evenement.service.ServiceEvenement.ImageEvenement;
import tg.ipnetinstitute.technology.features.evenement.wrapper.StockageImageWrapper;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Page publique d'un événement : sections facultatives et leurs images.
 * Tout ce qui est reçu est validé et recopié champ par champ : aucun contenu libre n'est conservé tel quel.
 */
@Service
public class ServicePageEvenement {

    private static final int MAX_SECTIONS = 12;
    private static final int MAX_INTERVENANTS = 40;
    private static final int MAX_CRENEAUX = 300;
    private static final Pattern NOM_IMAGE = Pattern.compile("[0-9a-fA-F-]{36}\\.(jpg|png|webp)");
    private static final Pattern ID_SECTION = Pattern.compile("[A-Za-z0-9_-]{1,40}");
    private static final Pattern JOUR = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");
    private static final Pattern HEURE = Pattern.compile("([01]\\d|2[0-3]):[0-5]\\d");

    private final EvenementRepository evenements;
    private final AccesEvenement acces;
    private final StockageImageWrapper stockage;
    private final ObjectMapper json = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public ServicePageEvenement(EvenementRepository evenements, AccesEvenement acces, StockageImageWrapper stockage) {
        this.evenements = evenements;
        this.acces = acces;
        this.stockage = stockage;
    }

    /** Page d'un événement visible (le public ne voit ni brouillon ni événement masqué). */
    @Transactional(readOnly = true)
    public PageEvenement lire(Long id, boolean admin) {
        Evenement e = acces.charger(id);
        if (!admin && (e.getStatut() == StatutEvenement.BROUILLON || e.isMasque())) {
            throw new RessourceIntrouvableException("Événement", id);
        }
        return analyser(e.getPage());
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "PAGE_EVENEMENT", typeCible = "EVENEMENT")
    public PageEvenement enregistrer(Long id, PageEvenement demande, Long adminId) {
        Evenement e = acces.chargerPourModification(id);
        PageEvenement propre = valider(demande);
        try {
            e.definirPage(json.writeValueAsString(propre));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Page non enregistrable", ex);
        }
        evenements.save(e);
        return propre;
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "IMAGE_PAGE_EVENEMENT", typeCible = "EVENEMENT")
    public String ajouterImage(Long id, byte[] contenu) {
        acces.charger(id);
        return stockage.enregistrer(contenu);
    }

    /** Image d'une section : servie seulement si la page de cet événement la référence. */
    @Transactional(readOnly = true)
    public ImageEvenement image(Long id, String nom, boolean admin) {
        PageEvenement page = lire(id, admin);
        if (nom == null || !NOM_IMAGE.matcher(nom).matches() || !images(page).contains(nom)) {
            throw new RessourceIntrouvableException("Image de la page", id);
        }
        return new ImageEvenement(stockage.lire(nom), stockage.typeMime(nom));
    }

    // ---------- validation ----------

    private PageEvenement analyser(String brut) {
        if (brut == null || brut.isBlank()) return PageEvenement.vide();
        try {
            return json.readValue(brut, PageEvenement.class);
        } catch (JsonProcessingException e) {
            return PageEvenement.vide();
        }
    }

    private PageEvenement valider(PageEvenement p) {
        if (p == null || p.sections() == null) return PageEvenement.vide();
        if (p.sections().size() > MAX_SECTIONS) {
            throw new IllegalArgumentException("Une page ne peut pas dépasser " + MAX_SECTIONS + " sections");
        }
        List<Section> propres = new ArrayList<>();
        for (Section s : p.sections()) {
            if (s == null || !PageEvenement.TYPES.contains(s.type())) {
                throw new IllegalArgumentException("Type de section inconnu");
            }
            String id = s.id() == null || s.id().isBlank() ? s.type().toLowerCase() + "-" + (propres.size() + 1) : s.id();
            if (!ID_SECTION.matcher(id).matches()) throw new IllegalArgumentException("Identifiant de section invalide");
            propres.add(new Section(id, s.type(), s.actif(),
                    texte(s.titre(), 150), texte(s.sousTitre(), 300), texte(s.texte(), 5000), image(s.image()),
                    texte(s.bouton(), 40), texte(s.adresse(), 300), texte(s.telephone(), 40), texte(s.email(), 120),
                    intervenants(s.intervenants()), creneaux(s.creneaux())));
        }
        return new PageEvenement(1, propres);
    }

    private List<Intervenant> intervenants(List<Intervenant> liste) {
        if (liste == null) return List.of();
        if (liste.size() > MAX_INTERVENANTS) throw new IllegalArgumentException("Trop d'intervenants (" + MAX_INTERVENANTS + " maximum)");
        List<Intervenant> res = new ArrayList<>();
        for (Intervenant i : liste) {
            if (i == null || i.nom() == null || i.nom().isBlank()) continue;
            res.add(new Intervenant(texte(i.nom(), 100), texte(i.role(), 100), image(i.photo())));
        }
        return res;
    }

    private List<Creneau> creneaux(List<Creneau> liste) {
        if (liste == null) return List.of();
        if (liste.size() > MAX_CRENEAUX) throw new IllegalArgumentException("Trop de créneaux (" + MAX_CRENEAUX + " maximum)");
        List<Creneau> res = new ArrayList<>();
        for (Creneau c : liste) {
            if (c == null || c.titre() == null || c.titre().isBlank()) continue;
            if (c.jour() == null || !JOUR.matcher(c.jour()).matches()) throw new IllegalArgumentException("Jour invalide (AAAA-MM-JJ attendu)");
            if (c.debut() == null || !HEURE.matcher(c.debut()).matches()) throw new IllegalArgumentException("Heure de début invalide (HH:mm attendu)");
            if (c.fin() != null && !c.fin().isBlank() && !HEURE.matcher(c.fin()).matches()) throw new IllegalArgumentException("Heure de fin invalide (HH:mm attendu)");
            res.add(new Creneau(c.jour(), c.debut(), c.fin() == null || c.fin().isBlank() ? null : c.fin(),
                    texte(c.titre(), 150), texte(c.description(), 500), texte(c.intervenant(), 100), texte(c.lieu(), 120)));
        }
        return res;
    }

    private static String texte(String valeur, int max) {
        if (valeur == null) return null;
        String v = valeur.strip();
        if (v.isEmpty()) return null;
        if (v.length() > max) throw new IllegalArgumentException("Texte trop long (" + max + " caractères maximum)");
        return v;
    }

    private static String image(String nom) {
        if (nom == null || nom.isBlank()) return null;
        if (!NOM_IMAGE.matcher(nom).matches()) throw new IllegalArgumentException("Image invalide");
        return nom;
    }

    private static List<String> images(PageEvenement page) {
        List<String> noms = new ArrayList<>();
        for (Section s : page.sections()) {
            if (s.image() != null) noms.add(s.image());
            if (s.intervenants() != null) s.intervenants().forEach(i -> { if (i.photo() != null) noms.add(i.photo()); });
        }
        return noms;
    }
}
