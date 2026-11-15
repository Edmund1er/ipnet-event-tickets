package tg.ipnetinstitute.technology.features.parametrage.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** DTO de la feature paramétrage. */
public final class ParametresDto {

    private ParametresDto() {}

    /**
     * EF-07 : coordonnées de paiement affichées aux participants.
     * configure=false tant que l'administrateur n'a pas renseigné le numéro.
     */
    public record CanalPaiement(
            String code,
            String libelle,
            String numeroMobileMoney,
            String numeroAffiche,
            String titulaire,
            LocalDateTime modifieLe
    ) {}

    public record ParametresPaiement(
            boolean configure,
            String numeroMobileMoney,
            String numeroAffiche,
            String operateur,
            String titulaire,
            LocalDateTime modifieLe,
            List<CanalPaiement> canaux
    ) {
        public static ParametresPaiement nonConfigure() {
            return new ParametresPaiement(false, null, null, null, null, null, List.of());
        }
    }

    /** Coordonnées de réception distinctes par portefeuille personnel. */
    public record ModificationCanalPaiement(
            @NotBlank String code,
            String numero,
            @Size(max = 120) String titulaire
    ) {}

    public record ModificationCanauxPaiement(
            @NotNull @Size(min = 2, max = 2) List<@Valid ModificationCanalPaiement> canaux
    ) {}

    /** Saisie de l'ancien écran : conservée pour compatibilité avec les déploiements existants. */
    public record ModificationPaiement(
            @NotBlank(message = "Le numéro Mobile Money est obligatoire") String numero,
            @Size(max = 60) String operateur,
            @NotBlank(message = "Le nom du bénéficiaire est obligatoire") @Size(max = 120) String titulaire
    ) {}

    /** Analyse d'un numéro (aperçu en direct dans l'interface d'administration). */
    public record AnalyseNumero(
            String e164,
            String international,
            String pays,
            String type,
            String operateur
    ) {}

    public record EtatSmtp(boolean configure, String hote, Integer port, String expediteur) {}

    public record ParametresAdmin(ParametresPaiement paiement, EtatSmtp smtp) {}
}
