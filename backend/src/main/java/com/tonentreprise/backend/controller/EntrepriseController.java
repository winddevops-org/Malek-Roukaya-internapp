// src/main/java/com/tonentreprise/backend/controller/EntrepriseController.java
package com.tonentreprise.backend.controller;

import com.tonentreprise.backend.model.Entreprise;
import com.tonentreprise.backend.model.User;
import com.tonentreprise.backend.service.EntrepriseService;
import com.tonentreprise.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entreprises")
@CrossOrigin(origins = "http://localhost:4200")
public class EntrepriseController {

  @Autowired
  private EntrepriseService entrepriseService;

  @Autowired
  private UserService userService;

  @PostMapping("/inscription")
  public ResponseEntity<?> inscription(@RequestBody Entreprise entreprise) {
    try {
      Entreprise nouvelle = entrepriseService.inscrireEntreprise(entreprise);
      return ResponseEntity.status(HttpStatus.CREATED).body(nouvelle);
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
  }

  @GetMapping("/en-attente")
  public ResponseEntity<List<Entreprise>> getDemandesEnAttente() {
    return ResponseEntity.ok(entrepriseService.getDemandesEnAttente());
  }

  @GetMapping("/actives")
  public ResponseEntity<List<Entreprise>> getEntreprisesActives() {
    return ResponseEntity.ok(entrepriseService.getEntreprisesActives());
  }

  @PutMapping("/{id}/accepter")
  public ResponseEntity<?> accepter(@PathVariable("id") Long id) {
    try {
      Entreprise entreprise = entrepriseService.accepterEntreprise(id);
      return ResponseEntity.ok(entreprise);
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }
  }

  @PutMapping("/{id}/refuser")
  public ResponseEntity<?> refuser(@PathVariable("id") Long id) {
    try {
      Entreprise entreprise = entrepriseService.refuserEntreprise(id);
      return ResponseEntity.ok(entreprise);
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }
  }

  @GetMapping
  public ResponseEntity<List<Entreprise>> getAllEntreprises() {
    return ResponseEntity.ok(entrepriseService.getAllEntreprises());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> supprimerEntreprise(@PathVariable("id") Long id) {
    try {
      entrepriseService.supprimerEntreprise(id);
      return ResponseEntity.ok(Map.of("message", "Entreprise supprimée avec succès"));
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }
  }

  @PutMapping("/{id}/infos")
  public ResponseEntity<?> modifierInfosEntreprise(@PathVariable("id") Long id, @RequestBody Map<String, String> request) {
    try {
      String telephone  = request.get("telephone");
      String gouvernorat = request.get("gouvernorat");
      String ville      = request.get("ville");
      entrepriseService.modifierInfos(id, telephone, gouvernorat, ville);
      return ResponseEntity.ok(Map.of("message", "Informations mises à jour avec succès !"));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
  }

  @PutMapping("/{id}/password")
  public ResponseEntity<?> changerMotDePasseEntreprise(@PathVariable("id") Long id, @RequestBody Map<String, String> request) {
    try {
      String oldPassword = request.get("oldPassword");
      String newPassword = request.get("newPassword");
      entrepriseService.changerMotDePasse(id, oldPassword, newPassword);
      return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès !"));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
  }

  @PutMapping("/{id}/permissions")
  public ResponseEntity<?> assignPermissions(@PathVariable("id") Long id, @RequestBody List<Long> permissionIds) {
    try {
      Entreprise updated = entrepriseService.assignPermissionsToEntreprise(id, permissionIds);
      return ResponseEntity.ok(updated);
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
  }

  // 🚀 NOUVEAU : Obtenir uniquement les permissions accordées à cette entreprise
  @GetMapping("/{id}/permissions")
  public ResponseEntity<?> getEntreprisePermissions(@PathVariable("id") Long id) {
    try {
      return ResponseEntity.ok(entrepriseService.getEntreprisePermissions(id));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
  }

  @GetMapping("/{id}/users")
  public ResponseEntity<List<User>> getUsersByEntreprise(@PathVariable("id") Long entrepriseId) {
    List<User> users = userService.getUsersByEntreprise(entrepriseId);
    return ResponseEntity.ok(users);
  }

  @GetMapping("/{id}/departements")
  public ResponseEntity<List<String>> getDepartementsByEntreprise(@PathVariable("id") Long entrepriseId) {
    List<String> deps = userService.getDepartementsByEntreprise(entrepriseId);
    return ResponseEntity.ok(deps);
  }
}
