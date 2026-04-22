package com.tonentreprise.backend.service;

import com.tonentreprise.backend.model.Entreprise;
import com.tonentreprise.backend.model.User;
import com.tonentreprise.backend.repository.EntrepriseRepository;
import com.tonentreprise.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private EmailService emailService;

  @Autowired
  private EntrepriseRepository entrepriseRepository;

  @Autowired
  private OtpService otpService;

  public List<User> getUsersByTenant(String tenantId) {
    return userRepository.findByTenantId(tenantId);
  }

  public List<User> getUsersByEntreprise(Long entrepriseId) {
    Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
      .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));

    String tenantId = entreprise.getTenantId();
    if (tenantId == null || tenantId.isBlank()) {
      throw new RuntimeException("Cette entreprise n'a pas de tenantId défini.");
    }

    return userRepository.findByTenantId(tenantId);
  }

  public List<String> getDepartementsByEntreprise(Long entrepriseId) {
    Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
      .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));

    List<User> users = userRepository.findByEntrepriseId(entrepriseId);

    return users.stream()
      .map(User::getDepartement)
      .filter(dep -> dep != null && !dep.isBlank())
      .distinct()
      .collect(Collectors.toList());
  }

  public User getUserById(Long id, String tenantId) {
    User user = userRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

    if (!tenantId.equals(user.getTenantId())) {
      throw new RuntimeException("Accès non autorisé");
    }

    return user;
  }

  @Transactional
  public User createUser(User user) {
    if (user.getEntrepriseId() == null) {
      throw new RuntimeException("EntrepriseId est obligatoire pour créer un utilisateur");
    }

    Entreprise entreprise = entrepriseRepository.findById(user.getEntrepriseId())
      .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));

    String tenantId = entreprise.getTenantId();

    if (userRepository.existsByEmailAndTenantId(user.getEmail(), tenantId)) {
      throw new RuntimeException("Cet email est déjà utilisé dans ce tenant");
    }

    String plainPassword = otpService.generateStrongPassword();
    user.setPassword(passwordEncoder.encode(plainPassword));
    user.setRole(User.Role.USER);
    user.setTenantId(tenantId);
    user.setEntrepriseId(entreprise.getId());

    User savedUser = userRepository.save(user);

    emailService.sendUserCreationEmail(
      savedUser.getEmail(),
      savedUser.getNom(),
      entreprise.getNom(),
      plainPassword
    );

    return savedUser;
  }

  @Transactional
  public User updateUser(Long id, User userDetails, String tenantId) {
    User user = userRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

    if (!tenantId.equals(user.getTenantId())) {
      throw new RuntimeException("Accès non autorisé");
    }

    String oldEmail = user.getEmail();
    user.setNom(userDetails.getNom());
    user.setEmail(userDetails.getEmail());
    user.setDepartement(userDetails.getDepartement());

    String newPlainPassword = null;
    if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
      newPlainPassword = userDetails.getPassword();
      user.setPassword(passwordEncoder.encode(newPlainPassword));
    }

    if (userDetails.getPermissions() != null) {
      user.setPermissions(userDetails.getPermissions());
    }

    User saved = userRepository.save(user);

    String entrepriseNom = null;
    if (saved.getEntrepriseId() != null) {
      Entreprise ent = entrepriseRepository.findById(saved.getEntrepriseId()).orElse(null);
      if (ent != null) {
        entrepriseNom = ent.getNom();
      }
    }

    emailService.sendUserUpdatedByAdminEmail(
      oldEmail,
      saved.getEmail(),
      saved.getNom(),
      newPlainPassword,
      entrepriseNom
    );

    return saved;
  }

  @Transactional
  public void deleteUser(Long id, String tenantId) {
    User user = userRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

    if (!tenantId.equals(user.getTenantId())) {
      throw new RuntimeException("Accès non autorisé");
    }

    userRepository.delete(user);
  }

  public List<User> getAllUsers() {
    return userRepository.findAll();
  }

  @Transactional
  public void modifierInfos(Long id, String nom) {
    User user = userRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

    if (nom != null && !nom.isBlank()) {
      user.setNom(nom);
    }
    userRepository.save(user);
  }

  @Transactional
  public void changerMotDePasse(Long id, String oldPassword, String newPassword) {
    User user = userRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

    if (user.getRole() == User.Role.ADMIN) {
      // SUPER_ADMIN : mot de passe stocké en clair dans la base
      if (!oldPassword.equals(user.getPassword())) {
        throw new RuntimeException("L'ancien mot de passe est incorrect.");
      }
      // On sauvegarde en clair (pas d'encodage) pour rester cohérent
      user.setPassword(newPassword);
      userRepository.save(user);
      emailService.sendPasswordChangedEmail(user.getEmail(), user.getNom());
      return;
    }

    if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
      throw new RuntimeException("L'ancien mot de passe est incorrect.");
    }

    user.setPassword(passwordEncoder.encode(newPassword));
    userRepository.save(user);

    emailService.sendPasswordChangedEmail(user.getEmail(), user.getNom());
  }

  @Transactional
  public void changerMotDePasseParEntrepriseAdmin(Long userId,
                                                  String newPlainPassword,
                                                  String entrepriseNomOuAdmin) {
    User user = userRepository.findById(userId)
      .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

    user.setPassword(passwordEncoder.encode(newPlainPassword));
    userRepository.save(user);

    emailService.sendAdminPasswordResetEmail(
      user.getEmail(),
      user.getNom(),
      newPlainPassword,
      entrepriseNomOuAdmin
    );
  }
}
