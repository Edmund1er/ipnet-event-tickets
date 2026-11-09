package tg.ipnetinstitute.technology.features.identite.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Entité Utilisateur (table utilisateur).
 * Identité de base : e-mail, téléphone, mot de passe hashé, rôles et sécurité d'accès.
 * Invariants respectés (pas de setters publics anarchiques).
 */
@Entity
@Table(name = "utilisateur")
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, unique = true, length = 20)
    private String telephone;

    @Column(name = "telephone_verifie", nullable = false)
    private boolean telephoneVerifie = false;

    /** RG-01 / RG-20 : adresse confirmée par un code envoyé par e-mail. */
    @Column(name = "email_verifie", nullable = false)
    private boolean emailVerifie = false;

    @Column(name = "mot_de_passe_hash", nullable = false, length = 100)
    private String motDePasseHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_profil", nullable = false, length = 20)
    private TypeProfil typeProfil;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    private boolean actif = true;

    @Column(name = "tentatives_echec", nullable = false)
    private short tentativesEchec = 0;

    @Column(name = "verrouille_jusqu_a")
    private LocalDateTime verrouilleJusquA;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private LocalDateTime creeLe;

    @Version
    @Column(nullable = false)
    private Long version;

    protected Utilisateur() {}

    public static Utilisateur nouveau(String email, String telephone, String motDePasseHash, TypeProfil typeProfil, Role role) {
        Utilisateur u = new Utilisateur();
        u.email = email;
        u.telephone = telephone;
        u.motDePasseHash = motDePasseHash;
        u.typeProfil = typeProfil;
        u.role = role;
        u.actif = true;
        u.telephoneVerifie = false;
        u.emailVerifie = false;
        u.tentativesEchec = 0;
        u.creeLe = LocalDateTime.now();
        return u;
    }

    /** Réservé à une future vérification par SMS (RG-02, canal payant non activé en V1). */
    public void validerTelephone() {
        this.telephoneVerifie = true;
    }

    /** L'utilisateur a saisi le code reçu sur son adresse actuelle. */
    public void validerEmail() {
        this.emailVerifie = true;
    }

    /** EF-08 : changement d'adresse confirmé par un code reçu sur la nouvelle adresse. */
    public void changerEmail(String nouvelEmailVerifie) {
        this.email = nouvelEmailVerifie;
        this.emailVerifie = true;
    }

    public void enregistrerEchecConnexion() {
        this.tentativesEchec++;
        if (this.tentativesEchec >= 5) {
            // Verrouillage temporaire de 15 minutes (Section 5.1 OWASP)
            this.verrouilleJusquA = LocalDateTime.now().plusMinutes(15);
        }
    }

    public void reinitialiserTentatives() {
        this.tentativesEchec = 0;
        this.verrouilleJusquA = null;
    }

    public boolean estVerrouille(LocalDateTime now) {
        if (verrouilleJusquA == null) return false;
        if (now.isBefore(verrouilleJusquA)) return true;
        this.verrouilleJusquA = null;
        this.tentativesEchec = 0;
        return false;
    }

    public void desactiver() {
        this.actif = false;
    }

    public void activer() {
        this.actif = true;
    }

    /** EF-08 : un nouveau numéro doit être revérifié par OTP. */
    public void changerTelephone(String telephoneE164) {
        if (!telephoneE164.equals(this.telephone)) {
            this.telephone = telephoneE164;
            this.telephoneVerifie = false;
        }
    }

    /** EF-06 : réinitialisation du mot de passe (le hash est fourni déjà calculé). */
    public void changerMotDePasse(String nouveauHash) {
        this.motDePasseHash = nouveauHash;
        reinitialiserTentatives();
    }

    /**
     * Suppression du compte (§5.2) : les données d'identification sont anonymisées et le compte désactivé.
     * La ligne est conservée pour l'intégrité des réservations, paiements et du journal d'audit.
     */
    public void anonymiser(String hashInutilisable) {
        this.email = "supprime-" + id + "@anonyme.invalid";
        this.telephone = "SUPPR-" + id;
        this.telephoneVerifie = false;
        this.emailVerifie = false;
        this.motDePasseHash = hashInutilisable;
        this.actif = false;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getTelephone() { return telephone; }
    public boolean isTelephoneVerifie() { return telephoneVerifie; }
    public boolean isEmailVerifie() { return emailVerifie; }
    public String getMotDePasseHash() { return motDePasseHash; }
    public TypeProfil getTypeProfil() { return typeProfil; }
    public Role getRole() { return role; }
    public boolean isActif() { return actif; }
    public short getTentativesEchec() { return tentativesEchec; }
    public LocalDateTime getVerrouilleJusquA() { return verrouilleJusquA; }
    public LocalDateTime getCreeLe() { return creeLe; }
    public Long getVersion() { return version; }
}
