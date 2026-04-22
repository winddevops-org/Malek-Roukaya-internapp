// src/main/java/com/tonentreprise/backend/repository/UserRepository.java
package com.tonentreprise.backend.repository;

import com.tonentreprise.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

  // Trouver un utilisateur par email
  Optional<User> findByEmail(String email);

  // Vérifier si un email existe
  boolean existsByEmail(String email);

  // Utilisateurs par tenant
  List<User> findByTenantId(String tenantId);

  // Vérifier email unique dans un tenant
  boolean existsByEmailAndTenantId(String email, String tenantId);

  // Trouver tous les utilisateurs par role
  List<User> findByRole(User.Role role);

  // Utilisateurs par entreprise (id direct si tu en as besoin ailleurs)
  List<User> findByEntrepriseId(Long entrepriseId);
}
