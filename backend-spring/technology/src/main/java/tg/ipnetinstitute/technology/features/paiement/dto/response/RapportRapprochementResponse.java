package tg.ipnetinstitute.technology.features.paiement.dto.response;

public record RapportRapprochementResponse(
        int lignesImportees,
        int confirmeesAutomatiquement,
        int aTraiterManuellement
) {}
