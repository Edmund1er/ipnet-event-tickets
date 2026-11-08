package tg.ipnetinstitute.technology.features.admin.application;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.audit.Auditable;
import tg.ipnetinstitute.technology.common.audit.JournalAudit;
import tg.ipnetinstitute.technology.common.audit.JournalAuditRepository;
import tg.ipnetinstitute.technology.common.domaine.Email;
import tg.ipnetinstitute.technology.common.domaine.Telephone;
import tg.ipnetinstitute.technology.features.identite.domaine.Role;
import tg.ipnetinstitute.technology.features.identite.domaine.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.infrastructure.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.participant.domaine.TypeProfil;
import tg.ipnetinstitute.technology.features.reservation.domaine.Inscription;
import tg.ipnetinstitute.technology.features.reservation.infrastructure.InscriptionRepository;

import java.util.List;

/**
 * Service d'administration plateforme (EF-50, EF-51, EF-52).
 */
@Service
public class ServiceAdmin {

    private final UtilisateurRepository utilisateurs;
    private final InscriptionRepository inscriptions;
    private final JournalAuditRepository journalAuditRepository;
    private final PasswordEncoder passwordEncoder;

    public ServiceAdmin(UtilisateurRepository utilisateurs,
                        InscriptionRepository inscriptions,
                        JournalAuditRepository journalAuditRepository,
                        PasswordEncoder passwordEncoder) {
        this.utilisateurs = utilisateurs;
        this.inscriptions = inscriptions;
        this.journalAuditRepository = journalAuditRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // EF-50 : Liste des participants par événement
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public List<Inscription> listerParticipantsEvenement(Long evenementId) {
        return inscriptions.findAll().stream()
                .filter(i -> i.getEvenementId().equals(evenementId))
                .toList();
    }

    // EF-51 : Consultation du journal d'audit
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Page<JournalAudit> consulterAudit(Pageable pageable) {
        return journalAuditRepository.findAll(pageable);
    }

    // EF-52 : Créer un compte agent de scan
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "CREATION_AGENT_SCAN", typeCible = "UTILISATEUR")
    public Utilisateur creerAgentScan(String email, String telephone, String motDePasse) {
        Email emailValide = new Email(email);
        Telephone telValide = new Telephone(telephone);

        Utilisateur agent = Utilisateur.nouveau(
                emailValide.valeur(),
                telValide.valeur(),
                passwordEncoder.encode(motDePasse),
                TypeProfil.AUCUN,
                Role.SCANNER
        );
        agent.validerTelephone(); // Agent vérifié par défaut
        return utilisateurs.save(agent);
    }

    // EF-52 : Désactiver un compte agent de scan
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "DESACTIVATION_AGENT_SCAN", typeCible = "UTILISATEUR")
    public void desactiverAgentScan(Long agentId) {
        Utilisateur agent = utilisateurs.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé : " + agentId));
        agent.desactiver();
        utilisateurs.save(agent);
    }
}
