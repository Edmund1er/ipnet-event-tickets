package tg.ipnetinstitute.technology.features.billet.model;

import jakarta.persistence.*;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Entité Billet (Section 9.7, RG-10, RG-11, RG-19).
 * L'identifiant est un UUID aléatoire, associé à un nonce cryptographique.
 */
@Entity
@Table(name = "billet")
public class Billet {

    @Id
    private UUID id;

    @Column(name = "inscription_id", nullable = false, unique = true)
    private Long inscriptionId;

    @Column(name = "nonce", nullable = false, length = 32)
    private String nonce;

    @Column(name = "scanne_le")
    private LocalDateTime scanneLe;

    @Column(name = "scanne_par")
    private Long scannePar;

    @Column(nullable = false)
    private boolean invalide = false;

    @Version
    @Column(nullable = false)
    private Long version;

    private static final SecureRandom RANDOM = new SecureRandom();

    protected Billet() {}

    public static Billet nouveau(Long inscriptionId) {
        Billet b = new Billet();
        b.id = UUID.randomUUID();
        b.inscriptionId = inscriptionId;

        byte[] nonceBytes = new byte[16];
        RANDOM.nextBytes(nonceBytes);
        b.nonce = HexFormat.of().formatHex(nonceBytes);

        b.invalide = false;
        return b;
    }

    public void marquerScanne(Long agentId, LocalDateTime instant) {
        if (this.scanneLe != null) {
            throw new IllegalStateException("Billet déjà utilisé à " + this.scanneLe);
        }
        this.scanneLe = instant;
        this.scannePar = agentId;
    }

    public void invalider() {
        this.invalide = true;
    }

    public UUID getId() { return id; }
    public Long getInscriptionId() { return inscriptionId; }
    public String getNonce() { return nonce; }
    public LocalDateTime getScanneLe() { return scanneLe; }
    public Long getScannePar() { return scannePar; }
    public boolean isInvalide() { return invalide; }
    public Long getVersion() { return version; }
}
