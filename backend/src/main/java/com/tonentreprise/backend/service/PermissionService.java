// src/main/java/com/tonentreprise/backend/service/PermissionService.java
package com.tonentreprise.backend.service;

import com.tonentreprise.backend.model.Permission;
import com.tonentreprise.backend.model.User;
import com.tonentreprise.backend.repository.PermissionRepository;
import com.tonentreprise.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class PermissionService {

  private final PermissionRepository permissionRepository;
  private final UserRepository userRepository;

  public PermissionService(PermissionRepository permissionRepository,
                           UserRepository userRepository) {
    this.permissionRepository = permissionRepository;
    this.userRepository = userRepository;
  }

  // ===== LISTE / CRUD GLOBAL =====

  // Liste de toutes les permissions globales
  public List<Permission> listAllPermissions() {
    return permissionRepository.findAll();
  }

  // Créer une permission globale
  @Transactional
  public Permission createCustomPermission(String code, String label) {
    String normalizedCode = code.toUpperCase().trim();

    permissionRepository.findByCode(normalizedCode)
      .ifPresent(p -> {
        throw new RuntimeException("Une permission avec ce code existe déjà.");
      });

    Permission p = new Permission();
    p.setCode(normalizedCode);
    p.setLabel(label.trim());

    return permissionRepository.save(p);
  }

  // Supprimer une permission globale
  @Transactional
  public void deletePermission(Long permissionId) {
    Permission p = permissionRepository.findById(permissionId)
      .orElseThrow(() -> new RuntimeException("Permission introuvable"));

    // Détacher cette permission de tous les utilisateurs avant suppression
    for (User u : new HashSet<>(p.getUsers())) {
      u.getPermissions().remove(p);
      userRepository.save(u);
    }

    permissionRepository.delete(p);
  }

  // ===== AFFECTATION AUX UTILISATEURS =====

  /**
   * Affecter une liste de permissions (par id) à un utilisateur.
   * Les permissions sont globales.
   */
  @Transactional
  public void assignPermissionsToUser(Long userId, Set<Long> permissionIds) {
    User user = userRepository.findById(userId)
      .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

    List<Permission> permissions = permissionRepository.findAllById(permissionIds);

    user.setPermissions(new HashSet<>(permissions));
    userRepository.save(user);
  }
}
