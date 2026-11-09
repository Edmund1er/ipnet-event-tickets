package tg.ipnetinstitute.technology.features.identite.service;

/**
 * Publié à chaque génération de code OTP (EF-05, RG-02, RG-03).
 * La feature notification l'achemine par le canal configuré (e-mail en V1).
 */
public record OtpGenereEvent(Long utilisateurId, String email, String code) {}
