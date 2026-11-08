package tg.ipnetinstitute.technology.features.controle.application;

import java.time.LocalDateTime;

public record PersonneEntree(
        String nom,
        String prenom,
        String adresse,
        LocalDateTime entreeLe
) {}
