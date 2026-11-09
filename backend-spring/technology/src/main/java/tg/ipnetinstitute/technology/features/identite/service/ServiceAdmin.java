package tg.ipnetinstitute.technology.features.identite.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.exception.EmailDejaUtiliseException;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.common.exception.TelephoneDejaUtiliseException;
import tg.ipnetinstitute.technology.common.validation.email.ValidateurEmail;
import tg.ipnetinstitute.technology.common.validation.telephone.UsageTelephone;
import tg.ipnetinstitute.technology.common.validation.telephone.ValidateurTelephone;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.config.JournalAuditRepository;
import tg.ipnetinstitute.technology.features.identite.dto.request.CreationAgentScanRequest;
import tg.ipnetinstitute.technology.features.identite.dto.response.AgentScanResponse;
import tg.ipnetinstitute.technology.features.identite.dto.response.JournalAuditResponse;
import tg.ipnetinstitute.technology.features.identite.dto.response.ParticipantResponse;
import tg.ipnetinstitute.technology.features.identite.model.Role;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service d'administration plateforme (EF-50, EF-51, EF-52). Ne renvoie que des DTO.
 */
@Service
public class ServiceAdmin {

    private final UtilisateurRepository utilisateurs;
    private final InscriptionRepository inscriptions;
    private final JournalAuditRepository journalAuditRepository;
    private final PasswordEncoder passwordEncoder;
    private final ServiceIdentite serviceIdentite;
    private final ValidateurEmail validateurEmail;
    private final ValidateurTelephone validateurTelephone;

    public ServiceAdmin(UtilisateurRepository utilisateurs,
                        InscriptionRepository inscriptions,
                        JournalAuditRepository journalAuditRepository,
                        PasswordEncoder passwordEncoder,
                        ServiceIdentite serviceIdentite,
                        ValidateurEmail validateurEmail,
                        ValidateurTelephone validateurTelephone) {
        this.utilisateurs = utilisateurs;
        this.inscriptions = inscriptions;
        this.journalAuditRepository = journalAuditRepository;
        this.passwordEncoder = passwordEncoder;
        this.serviceIdentite = serviceIdentite;
        this.validateurEmail = validateurEmail;
        this.validateurTelephone = validateurTelephone;
    }

    // EF-50 : Liste des participants par événement
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public List<ParticipantResponse> listerParticipantsEvenement(Long evenementId) {
        return inscriptions.findByEvenementIdOrderByCreeLeAsc(evenementId).stream()
                .map(i -> {
                    var c = serviceIdentite.coordonnees(i.getUtilisateurId());
                    return new ParticipantResponse(i.getId(), c.utilisateurId(), c.nom(), c.prenom(),
                            c.email(), c.telephone(), c.typeProfil(), i.getStatut(), i.getCreeLe());
                })
                .toList();
    }

    // EF-51 : Consultation du journal d'audit
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Page<JournalAuditResponse> consulterAudit(Pageable pageable) {
        Map<Long, String> cacheEmails = new HashMap<>();
        return journalAuditRepository.findAll(pageable).map(j -> new JournalAuditResponse(
                j.getId(),
                j.getActeurId(),
                j.getActeurId() == null ? null
                        : cacheEmails.computeIfAbsent(j.getActeurId(), id -> serviceIdentite.emailDe(id).orElse(null)),
                j.getAction(),
                j.getTypeCible(),
                j.getIdCible(),
                j.getDetails(),
                j.getHorodatage()
        ));
    }

    // EF-52 : Lister les agents de scan
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public List<AgentScanResponse> listerAgentsScan() {
        return utilisateurs.findByRoleOrderByCreeLeDesc(Role.SCANNER).stream()
                .map(ServiceAdmin::versAgent)
                .toList();
    }

    // EF-52 : Créer un compte agent de scan
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "CREATION_AGENT_SCAN", typeCible = "UTILISATEUR")
    public AgentScanResponse creerAgentScan(CreationAgentScanRequest demande) {
        String email = validateurEmail.normaliser(demande.email());
        String telephone = validateurTelephone.normaliser(demande.telephone(), UsageTelephone.COMPTE);
        if (utilisateurs.existsByEmail(email)) {
            throw new EmailDejaUtiliseException(email);
        }
        if (utilisateurs.existsByTelephone(telephone)) {
            throw new TelephoneDejaUtiliseException(telephone);
        }

        Utilisateur agent = Utilisateur.nouveau(
                email,
                telephone,
                passwordEncoder.encode(demande.motDePasse()),
                TypeProfil.AUCUN,
                Role.SCANNER
        );
        // L'agent confirme lui-même son adresse e-mail (code) à sa première connexion (RG-01)
        return versAgent(utilisateurs.save(agent));
    }

    // EF-52 : Désactiver un compte agent de scan
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "DESACTIVATION_AGENT_SCAN", typeCible = "UTILISATEUR")
    public void desactiverAgentScan(Long agentId) {
        Utilisateur agent = utilisateurs.findById(agentId)
                .filter(u -> u.getRole() == Role.SCANNER)
                .orElseThrow(() -> new RessourceIntrouvableException("Agent de scan", agentId));
        agent.desactiver();
        utilisateurs.save(agent);
    }

    private static AgentScanResponse versAgent(Utilisateur u) {
        return new AgentScanResponse(u.getId(), u.getEmail(), u.isEmailVerifie(), u.getTelephone(), u.isActif(), u.getCreeLe());
    }
}
