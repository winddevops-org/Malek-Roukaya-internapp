package com.tonentreprise.backend.service;

import com.tonentreprise.backend.model.Entreprise;
import com.tonentreprise.backend.model.Entreprise.StatutEntreprise;
import com.tonentreprise.backend.model.Permission;
import com.tonentreprise.backend.model.User;
import com.tonentreprise.backend.repository.EntrepriseRepository;
import com.tonentreprise.backend.repository.PermissionRepository;
import com.tonentreprise.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class EntrepriseService {

  @Autowired
  private EntrepriseRepository entrepriseRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private EmailService emailService;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private OtpService otpService;

  @Autowired
  private PermissionRepository permissionRepository;

  @Transactional
  public Entreprise inscrireEntreprise(Entreprise entreprise) {
    if (entrepriseRepository.existsByEmail(entreprise.getEmail())) {
      throw new RuntimeException("Cet email est déjà utilisé");
    }

    if (entrepriseRepository.existsByMatriculeFiscale(entreprise.getMatriculeFiscale())) {
      throw new RuntimeException("Ce matricule fiscal est déjà utilisé");
    }

    entreprise.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));

    if (entreprise.getStatut() == null) {
      entreprise.setStatut(StatutEntreprise.EN_ATTENTE);
    }
    if (entreprise.getDateInscription() == null) {
      entreprise.setDateInscription(LocalDateTime.now());
    }

    try {
      return entrepriseRepository.save(entreprise);
    } catch (Exception e) {
      throw new RuntimeException("Erreur lors de la sauvegarde: " + e.getMessage());
    }
  }

  public List<Entreprise> getDemandesEnAttente() {
    return entrepriseRepository.findByStatut(StatutEntreprise.EN_ATTENTE);
  }

  public List<Entreprise> getEntreprisesActives() {
    return entrepriseRepository.findByStatut(StatutEntreprise.ACTIVE);
  }

  @Transactional
  public Entreprise accepterEntreprise(Long id) {
    Entreprise entreprise = entrepriseRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));

    String rawPassword = otpService.generateStrongPassword();
    entreprise.setPassword(passwordEncoder.encode(rawPassword));

    entreprise.setStatut(StatutEntreprise.ACTIVE);
    entreprise.setDateValidation(LocalDateTime.now());
    Entreprise saved = entrepriseRepository.save(entreprise);

    emailService.sendValidationEmail(entreprise.getEmail(), entreprise.getNom(), rawPassword);

    return saved;
  }

  @Transactional
  public Entreprise refuserEntreprise(Long id) {
    Entreprise entreprise = entrepriseRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));

    entreprise.setStatut(StatutEntreprise.REFUSE);
    entreprise.setDateValidation(LocalDateTime.now());
    Entreprise saved = entrepriseRepository.save(entreprise);

    emailService.sendRefusEmail(entreprise.getEmail(), entreprise.getNom());

    return saved;
  }

  public List<Entreprise> getAllEntreprises() {
    return entrepriseRepository.findAll();
  }

  @Transactional
  public void supprimerEntreprise(Long id) {
    Entreprise entreprise = entrepriseRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));

    String tenantId = entreprise.getTenantId();
    String email = entreprise.getEmail();
    String nom = entreprise.getNom();

    if (tenantId == null || tenantId.isBlank()) {
      entrepriseRepository.delete(entreprise);
      emailService.sendEntrepriseDeletedEmail(email, nom);
      return;
    }

    List<User> users = userRepository.findByTenantId(tenantId);
    for (User u : users) {
      if (u.getPermissions() != null && !u.getPermissions().isEmpty()) {
        u.getPermissions().clear();
        userRepository.save(u);
      }
    }

    for (User u : users) {
      userRepository.delete(u);
    }

    entrepriseRepository.delete(entreprise);
    emailService.sendEntrepriseDeletedEmail(email, nom);
  }

  @Transactional
  public void modifierInfos(Long id, String telephone, String gouvernorat, String ville) {
    Entreprise entreprise = entrepriseRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));

    if (telephone != null && !telephone.isBlank())   entreprise.setTelephone(telephone);
    if (gouvernorat != null && !gouvernorat.isBlank()) entreprise.setGouvernorat(gouvernorat);
    if (ville != null && !ville.isBlank())           entreprise.setVille(ville);

    entrepriseRepository.save(entreprise);
  }

  @Transactional
  public void changerMotDePasse(Long id, String oldPassword, String newPassword) {
    Entreprise entreprise = entrepriseRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));

    if (!passwordEncoder.matches(oldPassword, entreprise.getPassword())) {
      throw new RuntimeException("L'ancien mot de passe est incorrect.");
    }

    entreprise.setPassword(passwordEncoder.encode(newPassword));
    entrepriseRepository.save(entreprise);

    emailService.sendPasswordChangedEmail(entreprise.getEmail(), entreprise.getNom());
  }

  @Transactional
  public Entreprise assignPermissionsToEntreprise(Long entrepriseId, List<Long> permissionIds) {
    Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
      .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));

    List<Permission> perms = permissionRepository.findAllById(permissionIds);
    Set<Permission> newPermissions = new HashSet<>(perms);

    entreprise.setPermissions(newPermissions);
    Entreprise savedEntreprise = entrepriseRepository.save(entreprise);

    // 🚀 NOUVEAU : Révoquer les permissions des utilisateurs qui ne font plus partie des permissions de l'entreprise
    if (entreprise.getTenantId() != null && !entreprise.getTenantId().isBlank()) {
      List<User> users = userRepository.findByTenantId(entreprise.getTenantId());

      for (User user : users) {
        Set<Permission> userPermissions = user.getPermissions();
        if (userPermissions != null && !userPermissions.isEmpty()) {
          // Ne garder que les permissions que l'entreprise possède encore
          userPermissions.retainAll(newPermissions);
          userRepository.save(user);
        }
      }
    }

    return savedEntreprise;
  }

  // 🚀 NOUVEAU : Récupérer les permissions d'une entreprise spécifique
  public java.util.Set<Permission> getEntreprisePermissions(Long id) {
    Entreprise entreprise = entrepriseRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));
    return entreprise.getPermissions();
  }
}
