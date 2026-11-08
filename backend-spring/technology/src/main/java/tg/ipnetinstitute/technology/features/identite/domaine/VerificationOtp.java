package tg.ipnetinstitute.technology.features.identite.domaine;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_otp")
public class VerificationOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Column(name = "code_hash", nullable = false, length = 100)
    private String codeHash;

    @Column(name = "expire_le", nullable = false)
    private LocalDateTime expireLe;

    @Column(nullable = false)
    private short tentatives = 0;

    @Column(nullable = false)
    private boolean consomme = false;

    protected VerificationOtp() {}

    public static VerificationOtp creer(Long utilisateurId, String codeHash, int dureeMinutes) {
        VerificationOtp otp = new VerificationOtp();
        otp.utilisateurId = utilisateurId;
        otp.codeHash = codeHash;
        otp.expireLe = LocalDateTime.now().plusMinutes(dureeMinutes);
        otp.tentatives = 0;
        otp.consomme = false;
        return otp;
    }

    public boolean estExpirer(LocalDateTime now) {
        return now.isAfter(expireLe);
    }

    public void incrementerTentative() {
        this.tentatives++;
    }

    public void marquerConsomme() {
        this.consomme = true;
    }

    public Long getId() { return id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public String getCodeHash() { return codeHash; }
    public LocalDateTime getExpireLe() { return expireLe; }
    public short getTentatives() { return tentatives; }
    public boolean isConsomme() { return consomme; }
}
