// src/main/java/com/tonentreprise/backend/controller/PermissionController.java
package com.tonentreprise.backend.controller;

import com.tonentreprise.backend.model.Permission;
import com.tonentreprise.backend.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200") // adapte si besoin
public class PermissionController {

  private final PermissionService permissionService;

  public PermissionController(PermissionService permissionService) {
    this.permissionService = permissionService;
  }

  // GET /api/permissions
  @GetMapping("/permissions")
  public ResponseEntity<List<Permission>> listPermissions() {
    List<Permission> list = permissionService.listAllPermissions();
    return ResponseEntity.ok(list);
  }

  // POST /api/permissions/custom
  // Body : { "code": "VALIDER_FACTURE", "label": "Valider une facture" }
  @PostMapping("/permissions/custom")
  public ResponseEntity<?> createCustomPermission(@RequestBody Map<String, String> body) {
    try {
      String code = body.getOrDefault("code", "");
      String label = body.getOrDefault("label", "");

      if (code.isBlank() || label.isBlank()) {
        return ResponseEntity
          .badRequest()
          .body(Map.of("message", "Les champs 'code' et 'label' sont obligatoires."));
      }

      Permission created = permissionService.createCustomPermission(code, label);
      return ResponseEntity.ok(created);
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
  }

  // PUT /api/users/{userId}/permissions
  // Body : { "permissionIds": [1,2,3] }
  @PutMapping("/users/{userId}/permissions")
  public ResponseEntity<?> assignPermissionsToUser(
    @PathVariable Long userId,
    @RequestBody Map<String, List<Long>> body
  ) {
    try {
      List<Long> ids = body.getOrDefault("permissionIds", Collections.emptyList());
      permissionService.assignPermissionsToUser(userId, new HashSet<>(ids));
      return ResponseEntity.ok(Map.of("message", "Permissions mises à jour avec succès."));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
  }

  // DELETE /api/permissions/{id}
  @DeleteMapping("/permissions/{id}")
  public ResponseEntity<?> deletePermission(@PathVariable Long id) {
    try {
      permissionService.deletePermission(id);
      return ResponseEntity.ok(Map.of("message", "Permission supprimée avec succès."));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
  }
}
