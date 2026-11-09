package tg.ipnetinstitute.technology.features.controle.dto.response;

import java.time.LocalDateTime;

public record PersonneEntree(
        String nom,
        String prenom,
        String detail,
        LocalDateTime entreeLe
) {}
