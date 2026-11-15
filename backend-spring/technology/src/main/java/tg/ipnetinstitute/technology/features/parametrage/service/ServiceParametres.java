package tg.ipnetinstitute.technology.features.parametrage.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.validation.telephone.NumeroAnalyse;
import tg.ipnetinstitute.technology.common.validation.telephone.UsageTelephone;
import tg.ipnetinstitute.technology.common.validation.telephone.ValidateurTelephone;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.features.parametrage.dto.ParametresDto.AnalyseNumero;
import tg.ipnetinstitute.technology.features.parametrage.dto.ParametresDto.CanalPaiement;
import tg.ipnetinstitute.technology.features.parametrage.dto.ParametresDto.ModificationCanalPaiement;
import tg.ipnetinstitute.technology.features.parametrage.dto.ParametresDto.ModificationCanauxPaiement;
import tg.ipnetinstitute.technology.features.parametrage.dto.ParametresDto.ModificationPaiement;
import tg.ipnetinstitute.technology.features.parametrage.dto.ParametresDto.ParametresPaiement;
import tg.ipnetinstitute.technology.features.parametrage.model.CleParametre;
import tg.ipnetinstitute.technology.features.parametrage.model.ParametrePlateforme;
import tg.ipnetinstitute.technology.features.parametrage.repository.ParametrePlateformeRepository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * Paramètres de la plateforme (EF-07 : numéro Mobile Money). Aucune valeur par défaut :
 * tant que l'administrateur n'a pas saisi un numéro réel, le paiement est indiqué « non configuré ».
 */
@Service
@Order(3)
public class ServiceParametres implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ServiceParametres.class);

    private final ParametrePlateformeRepository parametres;
    private final ValidateurTelephone validateurTelephone;
    private final String numeroInitial;
    private final String titulaireInitial;

    public ServiceParametres(ParametrePlateformeRepository parametres, ValidateurTelephone validateurTelephone,
                             @Value("${app.paiement.numero:}") String numeroInitial,
                             @Value("${app.paiement.titulaire:}") String titulaireInitial) {
        this.parametres = parametres;
        this.validateurTelephone = validateurTelephone;
        this.numeroInitial = numeroInitial;
        this.titulaireInitial = titulaireInitial;
    }

    /** Valeur initiale facultative fournie par la configuration (.env), uniquement si rien n'est enregistré. */
    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (numeroInitial.isBlank() || lire(CleParametre.PAIEMENT_NUMERO).isPresent()) return;
        try {
            enregistrerPaiement(new ModificationPaiement(numeroInitial, null,
                    titulaireInitial.isBlank() ? "IPNET Institute of Technology" : titulaireInitial), null);
            log.info("Numéro Mobile Money initialisé depuis la configuration.");
        } catch (RuntimeException e) {
            log.error("PAIEMENT_NUMERO ignoré : {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public ParametresPaiement paiement() {
        List<CanalPaiement> canaux = new ArrayList<>();
        ajouterCanal(canaux, "MOOV", "Moov Money", CleParametre.PAIEMENT_MOOV_NUMERO, CleParametre.PAIEMENT_MOOV_TITULAIRE);
        ajouterCanal(canaux, "MIXX", "Mixx by Yas", CleParametre.PAIEMENT_MIXX_NUMERO, CleParametre.PAIEMENT_MIXX_TITULAIRE);
        if (canaux.isEmpty()) ajouterCanalHistorique(canaux);
        if (canaux.isEmpty()) return ParametresPaiement.nonConfigure();
        CanalPaiement principal = canaux.getFirst();
        var modifieLe = canaux.stream().map(CanalPaiement::modifieLe).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(principal.modifieLe());
        return new ParametresPaiement(true, principal.numeroMobileMoney(), principal.numeroAffiche(), principal.libelle(),
                principal.titulaire(), modifieLe, List.copyOf(canaux));
    }

    private void ajouterCanal(List<CanalPaiement> canaux, String code, String libelle, CleParametre cleNumero, CleParametre cleTitulaire) {
        lire(cleNumero).ifPresent(p -> {
            NumeroAnalyse numero = validateurTelephone.valider(p.getValeur(), UsageTelephone.MOBILE_MONEY);
            String titulaire = lire(cleTitulaire).map(ParametrePlateforme::getValeur).orElse(null);
            canaux.add(new CanalPaiement(code, libelle, numero.e164(), numero.international(), titulaire, p.getModifieLe()));
        });
    }

    /** Les anciennes installations n'avaient qu'un portefeuille : on l'affiche sans bloquer le paiement. */
    private void ajouterCanalHistorique(List<CanalPaiement> canaux) {
        lire(CleParametre.PAIEMENT_NUMERO).ifPresent(p -> {
            NumeroAnalyse numero = validateurTelephone.valider(p.getValeur(), UsageTelephone.MOBILE_MONEY);
            String operateur = lire(CleParametre.PAIEMENT_OPERATEUR).map(ParametrePlateforme::getValeur).orElse(numero.operateur());
            String code = codeOperateur(operateur);
            canaux.add(new CanalPaiement(code, operateur == null || operateur.isBlank() ? "Autre Mobile Money" : operateur,
                    numero.e164(), numero.international(), lire(CleParametre.PAIEMENT_TITULAIRE).map(ParametrePlateforme::getValeur).orElse(null), p.getModifieLe()));
        });
    }

    private static String codeOperateur(String nom) {
        if (nom == null) return "AUTRE";
        String normalise = nom.toLowerCase().replaceAll("[^a-z]", "");
        if (normalise.contains("moov")) return "MOOV";
        if (normalise.contains("yas") || normalise.contains("mixx") || normalise.contains("togocel") || normalise.contains("tmoney")) return "MIXX";
        return "AUTRE";
    }

    @Transactional(readOnly = true)
    public boolean paiementConfigure() {
        return paiement().configure();
    }

    /** EF-07 : l'administrateur définit ou change le numéro (ligne mobile valide, opérateur déduit). */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "PARAMETRES_PAIEMENT", typeCible = "PARAMETRE")
    public ParametresPaiement modifierPaiement(ModificationPaiement demande, Long adminId) {
        enregistrerPaiement(demande, adminId);
        return paiement();
    }

    /** Enregistre les numéros personnels de réception, un par portefeuille opérateur. */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "PARAMETRES_PAIEMENT", typeCible = "PARAMETRE")
    public ParametresPaiement modifierCanaux(ModificationCanauxPaiement demande, Long adminId) {
        Set<String> recus = new HashSet<>();
        for (ModificationCanalPaiement canal : demande.canaux()) {
            String code = canal.code().trim().toUpperCase();
            if (!Set.of("MOOV", "MIXX").contains(code) || !recus.add(code)) {
                throw new IllegalArgumentException("Chaque opérateur doit apparaître une seule fois (MOOV, MIXX)");
            }
            CleParametre cleNumero = code.equals("MOOV") ? CleParametre.PAIEMENT_MOOV_NUMERO : CleParametre.PAIEMENT_MIXX_NUMERO;
            CleParametre cleTitulaire = code.equals("MOOV") ? CleParametre.PAIEMENT_MOOV_TITULAIRE : CleParametre.PAIEMENT_MIXX_TITULAIRE;
            if (canal.numero() == null || canal.numero().isBlank()) {
                if (canal.titulaire() != null && !canal.titulaire().isBlank()) throw new IllegalArgumentException("Un bénéficiaire sans numéro n'est pas accepté");
                supprimer(cleNumero);
                supprimer(cleTitulaire);
                continue;
            }
            if (canal.titulaire() == null || canal.titulaire().isBlank()) throw new IllegalArgumentException("Le bénéficiaire est obligatoire pour chaque numéro configuré");
            NumeroAnalyse numero = validateurTelephone.valider(canal.numero(), UsageTelephone.MOBILE_MONEY);
            ecrire(cleNumero, numero.e164(), adminId);
            ecrire(cleTitulaire, canal.titulaire().trim(), adminId);
        }
        if (!recus.equals(Set.of("MOOV", "MIXX"))) throw new IllegalArgumentException("Les deux canaux Moov et Mixx doivent être envoyés");
        supprimer(CleParametre.PAIEMENT_NUMERO);
        supprimer(CleParametre.PAIEMENT_OPERATEUR);
        supprimer(CleParametre.PAIEMENT_TITULAIRE);
        return paiement();
    }

    private void supprimer(CleParametre cle) {
        parametres.deleteById(cle.name());
    }

    /** Aperçu de l'analyse d'un numéro (validation, pays, type de ligne, opérateur). */
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public AnalyseNumero analyser(String numero) {
        NumeroAnalyse a = validateurTelephone.valider(numero, UsageTelephone.MOBILE_MONEY);
        return new AnalyseNumero(a.e164(), a.international(), a.pays(), a.type().name(), a.operateur());
    }

    private void enregistrerPaiement(ModificationPaiement demande, Long auteur) {
        NumeroAnalyse a = validateurTelephone.valider(demande.numero(), UsageTelephone.MOBILE_MONEY);
        String operateur = demande.operateur() != null && !demande.operateur().isBlank() ? demande.operateur().trim() : a.operateur();
        ecrire(CleParametre.PAIEMENT_NUMERO, a.e164(), auteur);
        ecrire(CleParametre.PAIEMENT_TITULAIRE, demande.titulaire().trim(), auteur);
        if (operateur == null || operateur.isBlank()) {
            parametres.deleteById(CleParametre.PAIEMENT_OPERATEUR.name());
        } else {
            ecrire(CleParametre.PAIEMENT_OPERATEUR, operateur, auteur);
        }
    }

    private Optional<ParametrePlateforme> lire(CleParametre cle) {
        return parametres.findById(cle.name());
    }

    private void ecrire(CleParametre cle, String valeur, Long auteur) {
        ParametrePlateforme p = parametres.findById(cle.name()).orElseGet(() -> ParametrePlateforme.de(cle, valeur, auteur));
        p.modifier(valeur, auteur);
        parametres.save(p);
    }

    /** Utilisé par les e-mails d'annulation (contact pour le remboursement). */
    @Transactional(readOnly = true)
    public Optional<String> contactPaiement() {
        ParametresPaiement p = paiement();
        return p.configure() ? Optional.of(p.numeroAffiche()) : Optional.empty();
    }
}
