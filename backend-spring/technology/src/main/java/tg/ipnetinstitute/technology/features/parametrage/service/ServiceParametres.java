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
import tg.ipnetinstitute.technology.features.parametrage.dto.ParametresDto.ModificationPaiement;
import tg.ipnetinstitute.technology.features.parametrage.dto.ParametresDto.ParametresPaiement;
import tg.ipnetinstitute.technology.features.parametrage.model.CleParametre;
import tg.ipnetinstitute.technology.features.parametrage.model.ParametrePlateforme;
import tg.ipnetinstitute.technology.features.parametrage.repository.ParametrePlateformeRepository;

import java.util.Optional;

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
        Optional<ParametrePlateforme> numero = lire(CleParametre.PAIEMENT_NUMERO);
        if (numero.isEmpty()) return ParametresPaiement.nonConfigure();
        NumeroAnalyse a = validateurTelephone.valider(numero.get().getValeur(), UsageTelephone.MOBILE_MONEY);
        return new ParametresPaiement(true, a.e164(), a.international(),
                lire(CleParametre.PAIEMENT_OPERATEUR).map(ParametrePlateforme::getValeur).orElse(a.operateur()),
                lire(CleParametre.PAIEMENT_TITULAIRE).map(ParametrePlateforme::getValeur).orElse(null),
                numero.get().getModifieLe());
    }

    @Transactional(readOnly = true)
    public boolean paiementConfigure() {
        return lire(CleParametre.PAIEMENT_NUMERO).isPresent();
    }

    /** EF-07 : l'administrateur définit ou change le numéro (ligne mobile valide, opérateur déduit). */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "PARAMETRES_PAIEMENT", typeCible = "PARAMETRE")
    public ParametresPaiement modifierPaiement(ModificationPaiement demande, Long adminId) {
        enregistrerPaiement(demande, adminId);
        return paiement();
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
