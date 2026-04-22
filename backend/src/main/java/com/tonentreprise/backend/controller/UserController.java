// src/main/java/com/tonentreprise/backend/controller/UserController.java
package com.tonentreprise.backend.controller;

import com.tonentreprise.backend.model.User;
import com.tonentreprise.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

  @Autowired
  private UserService userService;

  // Récupérer tous les utilisateurs d'un tenant
  @GetMapping("/tenant/{tenantId}")
  public ResponseEntity<List<User>> getUsersByTenant(@PathVariable String tenantId) {
    return ResponseEntity.ok(userService.getUsersByTenant(tenantId));
  }

  // Récupérer un utilisateur spécifique dans un tenant
  @GetMapping("/{id}/tenant/{tenantId}")
  public ResponseEntity<?> getUserById(@PathVariable Long id, @PathVariable String tenantId) {
    try {
      User user = userService.getUserById(id, tenantId);
      return ResponseEntity.ok(user);
    } catch (RuntimeException e) {
      if ("Utilisateur non trouvé".equals(e.getMessage())) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(Collections.singletonMap("message", e.getMessage()));
      }
      if ("Accès non autorisé".equals(e.getMessage())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(Collections.singletonMap("message", e.getMessage()));
      }
      return ResponseEntity.badRequest()
        .body(Collections.singletonMap("message", e.getMessage()));
    }
  }

  // Créer un utilisateur (tenant déduit de entrepriseId dans le body)
  @PostMapping
  public ResponseEntity<?> createUser(@RequestBody User user) {
    try {
      User createdUser = userService.createUser(user);
      return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
    }
  }

  // Mettre à jour un utilisateur dans un tenant
  // 👉 C'est cette route qui est appelée par ton écran Angular "Utilisateurs"
  // et qui, via UserService.updateUser, va envoyer l'email si email/mdp changent.
  @PutMapping("/{id}/tenant/{tenantId}")
  public ResponseEntity<?> updateUser(@PathVariable Long id,
                                      @PathVariable String tenantId,
                                      @RequestBody User user) {
    try {
      User updatedUser = userService.updateUser(id, user, tenantId);
      return ResponseEntity.ok(updatedUser);
    } catch (RuntimeException e) {
      if ("Utilisateur non trouvé".equals(e.getMessage())) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(Collections.singletonMap("message", e.getMessage()));
      }
      if ("Accès non autorisé".equals(e.getMessage())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(Collections.singletonMap("message", e.getMessage()));
      }
      return ResponseEntity.badRequest()
        .body(Collections.singletonMap("message", e.getMessage()));
    }
  }

  // Supprimer un utilisateur dans un tenant
  @DeleteMapping("/{id}/tenant/{tenantId}")
  public ResponseEntity<?> deleteUser(@PathVariable Long id, @PathVariable String tenantId) {
    try {
      userService.deleteUser(id, tenantId);
      return ResponseEntity.noContent().build();
    } catch (RuntimeException e) {
      if ("Utilisateur non trouvé".equals(e.getMessage())) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(Collections.singletonMap("message", e.getMessage()));
      }
      if ("Accès non autorisé".equals(e.getMessage())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(Collections.singletonMap("message", e.getMessage()));
      }
      return ResponseEntity.badRequest()
        .body(Collections.singletonMap("message", e.getMessage()));
    }
  }

  // Modifier le nom d'un utilisateur (par lui-même depuis la navbar)
  @PutMapping("/{id}/infos")
  public ResponseEntity<?> modifierInfosUser(@PathVariable("id") Long id,
                                             @RequestBody Map<String, String> request) {
    try {
      String nom = request.get("nom");
      userService.modifierInfos(id, nom);
      return ResponseEntity.ok(Collections.singletonMap("message", "Informations mises à jour avec succès !"));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
    }
  }

  // Changer mot de passe user (par lui-même, ancien + nouveau)
  // Utilisé par la modale "Paramètres" dans ta Navbar pour USER/SUPER_ADMIN
  @PutMapping("/{id}/password")
  public ResponseEntity<?> changerMotDePasseUser(@PathVariable("id") Long id,
                                                 @RequestBody Map<String, String> request) {
    try {
      String oldPassword = request.get("oldPassword");
      String newPassword = request.get("newPassword");
      userService.changerMotDePasse(id, oldPassword, newPassword);
      return ResponseEntity.ok(Collections.singletonMap("message", "Mot de passe modifié avec succès !"));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
    }
  }
}
