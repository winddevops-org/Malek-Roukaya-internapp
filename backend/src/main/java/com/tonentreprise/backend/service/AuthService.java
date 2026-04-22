package com.tonentreprise.backend.service;

import com.tonentreprise.backend.model.Entreprise;
import com.tonentreprise.backend.model.User;
import com.tonentreprise.backend.repository.EntrepriseRepository;
import com.tonentreprise.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

  @Autowired
  private EntrepriseRepository entrepriseRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private OtpService otpService;

  public Map<String, Object> login(String email, String password) {
    Map<String, Object> response = new HashMap<>();
    System.out.println("🔍 Tentative de connexion pour: " + email);

    Optional<User> userOpt = userRepository.findByEmail(email);
    if (userOpt.isPresent()) {
      User user = userOpt.get();
      boolean passwordValid = false;

      if (user.getRole() == User.Role.ADMIN) {
        passwordValid = password.equals(user.getPassword());
      } else {
        passwordValid = passwordEncoder.matches(password, user.getPassword());
      }

      if (!passwordValid) {
        throw new RuntimeException("Email ou mot de passe incorrect");
      }

      if (user.getRole() == User.Role.ADMIN) {
        response.put("type", "SUPER_ADMIN");
        response.put("id", user.getId());
        response.put("nom", user.getNom());
        response.put("email", user.getEmail());
        response.put("role", "ADMIN");
        return response;
      } else {
        response.put("type", "USER");
        response.put("id", user.getId());
        response.put("nom", user.getNom());
        response.put("email", user.getEmail());
        response.put("departement", user.getDepartement());
        response.put("entrepriseId", user.getEntrepriseId());
        response.put("permissions", user.getPermissions());
        response.put("role", "USER");
        response.put("tenantId", user.getTenantId());
        if (user.getEntrepriseId() != null) {
          entrepriseRepository.findById(user.getEntrepriseId()).ifPresent(ent -> {
            response.put("entrepriseNom", ent.getNom());
          });
        }
        return response;
      }
    }

    Optional<Entreprise> entrepriseOpt = entrepriseRepository.findByEmail(email);
    if (entrepriseOpt.isPresent()) {
      Entreprise entreprise = entrepriseOpt.get();

      if (!passwordEncoder.matches(password, entreprise.getPassword())) {
        throw new RuntimeException("Email ou mot de passe incorrect");
      }

      if (entreprise.getStatut() == Entreprise.StatutEntreprise.EN_ATTENTE) {
        throw new RuntimeException("Votre demande est en cours de traitement");
      }
      if (entreprise.getStatut() == Entreprise.StatutEntreprise.REFUSE) {
        throw new RuntimeException("Votre demande a été refusée");
      }

      response.put("type", "ENTREPRISE");
      response.put("id", entreprise.getId());
      response.put("nom", entreprise.getNom());
      response.put("email", entreprise.getEmail());
      response.put("matriculeFiscale", entreprise.getMatriculeFiscale());
      response.put("telephone", entreprise.getTelephone());
      response.put("gouvernorat", entreprise.getGouvernorat());
      response.put("ville", entreprise.getVille());
      response.put("tenantId", entreprise.getTenantId());

      // 🔥 NOUVEAU : On inclut les permissions de l'entreprise dans la réponse
      response.put("permissions", entreprise.getPermissions());

      return response;
    }

    throw new RuntimeException("Email ou mot de passe incorrect");
  }

  public void generateAndSendOTP(String email) {
    boolean exists = userRepository.findByEmail(email).isPresent() ||
      entrepriseRepository.findByEmail(email).isPresent();

    if (!exists) {
      throw new RuntimeException("Aucun compte trouvé avec cet email");
    }

    otpService.generateAndStoreOTP(email);
  }

  public boolean verifyOTP(String email, String otpCode) {
    return otpService.verifyOTP(email, otpCode);
  }

  public void resetPassword(String email, String otpCode, String newPassword) {
    if (!otpService.consumeOTP(email, otpCode)) {
      throw new RuntimeException("Code OTP invalide ou expiré");
    }

    Optional<User> userOpt = userRepository.findByEmail(email);
    if (userOpt.isPresent()) {
      User user = userOpt.get();
      user.setPassword(passwordEncoder.encode(newPassword));
      userRepository.save(user);
      return;
    }

    Optional<Entreprise> entrepriseOpt = entrepriseRepository.findByEmail(email);
    if (entrepriseOpt.isPresent()) {
      Entreprise entreprise = entrepriseOpt.get();
      entreprise.setPassword(passwordEncoder.encode(newPassword));
      entrepriseRepository.save(entreprise);
      return;
    }

    throw new RuntimeException("Erreur inattendue lors de la réinitialisation");
  }
}
