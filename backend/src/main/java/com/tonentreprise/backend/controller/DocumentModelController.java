package com.tonentreprise.backend.controller;

import com.tonentreprise.backend.dto.TrashModelDTO;
import com.tonentreprise.backend.model.DocumentModel;
import com.tonentreprise.backend.model.ModelType;
import com.tonentreprise.backend.service.DocumentModelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/models")
@CrossOrigin(origins = "http://localhost:4200")
public class DocumentModelController {

  @Autowired
  private DocumentModelService service;

  // ✅ Récupérer tous les modèles pour un tenant
  // GET /api/models?tenantId=...
  @GetMapping
  public ResponseEntity<List<DocumentModel>> getAllModels(
    @RequestParam("tenantId") String tenantId
  ) {
    return ResponseEntity.ok(service.getAllModelsByTenant(tenantId));
  }

  // ✅ Récupérer par type pour un tenant
  // GET /api/models/by-type?type=...&tenantId=...
  @GetMapping(path = "/by-type")
  public ResponseEntity<List<DocumentModel>> getModelsByType(
    @RequestParam("type") Long type,
    @RequestParam("tenantId") String tenantId
  ) {
    return ResponseEntity.ok(service.getModelsByType(type, tenantId));
  }

  @GetMapping("/{id}")
  public ResponseEntity<DocumentModel> getModelById(@PathVariable Long id) {
    return ResponseEntity.ok(service.getModelById(id));
  }

  // ✅ création : typeId + tenantId
  @PostMapping(consumes = "application/json", produces = "application/json")
  public ResponseEntity<DocumentModel> createModel(
    @RequestBody DocumentModel model,
    @RequestParam("typeId") Long typeId,
    @RequestParam("tenantId") String tenantId
  ) {
    return ResponseEntity.ok(service.createModel(typeId, tenantId, model));
  }

  // ✅ mise à jour : on passe tenantId pour contrôler l’accès
  @PutMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
  public ResponseEntity<DocumentModel> updateModel(
    @PathVariable Long id,
    @RequestBody DocumentModel model,
    @RequestParam("tenantId") String tenantId
  ) {
    return ResponseEntity.ok(service.updateModel(id, model, tenantId));
  }

  // soft delete => vers corbeille
  @DeleteMapping("/{id}")
  public ResponseEntity<String> deleteModel(
    @PathVariable Long id,
    @RequestParam("tenantId") String tenantId
  ) {
    service.deleteModel(id, tenantId);
    return ResponseEntity.ok("Modèle déplacé vers la corbeille");
  }

  // ===== CORBEILLE =====
  @GetMapping("/trash")
  public ResponseEntity<List<TrashModelDTO>> getTrash(
    @RequestParam("tenantId") String tenantId
  ) {
    return ResponseEntity.ok(service.getTrashedModels(tenantId));
  }

  @PostMapping("/trash/{trashId}/restore")
  public ResponseEntity<String> restore(
    @PathVariable Long trashId,
    @RequestParam("tenantId") String tenantId
  ) {
    service.restoreModel(trashId, tenantId);
    return ResponseEntity.ok("Modèle restauré avec succès");
  }

  @DeleteMapping("/trash/{trashId}/hard")
  public ResponseEntity<String> hardDelete(
    @PathVariable Long trashId,
    @RequestParam("tenantId") String tenantId
  ) {
    service.hardDeleteTrashedModel(trashId, tenantId);
    return ResponseEntity.ok("Suppression définitive effectuée");
  }

  @GetMapping("/types")
  public ResponseEntity<List<ModelType>> getTypes() {
    return ResponseEntity.ok(service.getAllTypes());
  }
}
