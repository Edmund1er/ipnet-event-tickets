package tg.ipnetinstitute.technology.features.participant.application;

import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.exception.TypeProfilNonSupporteException;
import tg.ipnetinstitute.technology.features.participant.domaine.TypeProfil;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Fabrique de profils par injection de collection Spring (Factory Pattern).
 * OCP : Toute nouvelle implémentation de ProfilParticipant est enregistrée automatiquement.
 */
@Component
public class ProfilFactory {

    private final Map<TypeProfil, ProfilParticipant> profils;

    public ProfilFactory(List<ProfilParticipant> implementations) {
        this.profils = implementations.stream()
                .collect(Collectors.toUnmodifiableMap(ProfilParticipant::type, Function.identity()));
    }

    public ProfilParticipant pour(TypeProfil type) {
        return Optional.ofNullable(profils.get(type))
                .orElseThrow(() -> new TypeProfilNonSupporteException(type));
    }
}
