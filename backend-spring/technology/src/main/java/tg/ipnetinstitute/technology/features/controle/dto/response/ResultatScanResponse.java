package tg.ipnetinstitute.technology.features.controle.dto.response;

import tg.ipnetinstitute.technology.features.controle.model.ResultatScan;
import tg.ipnetinstitute.technology.features.controle.model.ResultatScanEnum;

import java.time.LocalDateTime;

/**
 * Résultat d'un scan avec discriminant explicite "resultat" (EF-41 à EF-43, RG-19),
 * pour que le front affiche un retour distinct pour chacun des cinq cas.
 * nom / prenom / detail / instant : renseignés pour ACCEPTE.
 * premierScan : renseigné pour DEJA_UTILISE.
 */
public record ResultatScanResponse(
        ResultatScanEnum resultat,
        String nom,
        String prenom,
        String detail,
        LocalDateTime instant,
        LocalDateTime premierScan
) {
    public static ResultatScanResponse de(ResultatScan r) {
        return switch (r) {
            case ResultatScan.Accepte a ->
                    new ResultatScanResponse(ResultatScanEnum.ACCEPTE, a.nom(), a.prenom(), a.detail(), a.instant(), null);
            case ResultatScan.DejaUtilise d ->
                    new ResultatScanResponse(ResultatScanEnum.DEJA_UTILISE, null, null, null, null, d.premierScan());
            case ResultatScan.Invalide i ->
                    new ResultatScanResponse(ResultatScanEnum.INVALIDE, null, null, null, null, null);
            case ResultatScan.MauvaisEvenement m ->
                    new ResultatScanResponse(ResultatScanEnum.MAUVAIS_EVENEMENT, null, null, null, null, null);
            case ResultatScan.EvenementAnnule e ->
                    new ResultatScanResponse(ResultatScanEnum.EVENEMENT_ANNULE, null, null, null, null, null);
        };
    }
}
