package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;
import tg.ipnetinstitute.technology.features.participant.domaine.TypeProfil;

public class TypeProfilNonSupporteException extends MetierException {
    public TypeProfilNonSupporteException(TypeProfil type) {
        super("Type de profil non pris en charge : " + type, HttpStatus.BAD_REQUEST, "RG-04");
    }
}
