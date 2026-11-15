package tg.ipnetinstitute.technology.features.evenement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Activité ou pass d'un événement-cadre. */
public record DemandeActivite(
        @NotNull @Pattern(regexp = "^(ACTIVITE|PASS)$", message = "Type : ACTIVITE ou PASS") String type,
        @NotBlank @Size(max = 200) String titre,
        String description,
        @Size(max = 30) String categorie,
        @NotNull LocalDateTime dateDebut,
        @NotNull LocalDateTime dateFin,
        @Size(max = 255) String lieu,
        @NotNull @Min(0) BigDecimal prix,
        @Min(1) Integer capacite,
        boolean accesLibre,
        @Pattern(regexp = "^(GLOBAL|JOURNEE)$", message = "Portée : GLOBAL ou JOURNEE") String passPortee,
        LocalDate passJour,
        @Pattern(regexp = "^(SOBRE|ACADEMIQUE|CEREMONIE|SOIREE|SPORT|CULTURE|FESTIF|PLAGE|URBAIN|GOSPEL|ELECTRO|FESTIVAL)$", message = "Ambiance inconnue") String ambiance,
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Couleur au format #RRGGBB") String couleurPrincipale,
        LocalDateTime dateLimiteReservation,
        Boolean qrPourGratuit
) {
    public DemandeActivite(String type, String titre, String description, String categorie,
                           LocalDateTime dateDebut, LocalDateTime dateFin, String lieu,
                           BigDecimal prix, Integer capacite, boolean accesLibre, String passPortee,
                           LocalDate passJour, String ambiance, String couleurPrincipale,
                           LocalDateTime dateLimiteReservation) {
        this(type, titre, description, categorie, dateDebut, dateFin, lieu, prix, capacite, accesLibre,
                passPortee, passJour, ambiance, couleurPrincipale, dateLimiteReservation, null);
    }
}
