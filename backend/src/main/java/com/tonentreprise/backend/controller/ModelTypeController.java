package com.tonentreprise.backend.controller;

import com.tonentreprise.backend.model.ModelType;
import com.tonentreprise.backend.repository.ModelTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/types")
@CrossOrigin(origins = "http://localhost:4200")
public class ModelTypeController {

  @Autowired
  private ModelTypeRepository repository;

  // Exiger le tenantId pour toute lecture
  @GetMapping
  public ResponseEntity<List<ModelType>> getAllTypes(@RequestParam("tenantId") String tenantId) {
    if (tenantId == null || tenantId.isBlank()) {
      throw new RuntimeException("tenantId est obligatoire");
    }
    return ResponseEntity.ok(repository.findByTenantId(tenantId));
  }

  // Créer un type, nom unique dans ce tenant seulement !
  @PostMapping
  public ResponseEntity<ModelType> createType(
    @RequestBody ModelType type,
    @RequestParam("tenantId") String tenantId) {

    if (tenantId == null || tenantId.isBlank()) {
      throw new RuntimeException("tenantId est obligatoire");
    }

    // 🔥 NE PAS PERMETTRE 2 FOIS LE MEME TYPE POUR LE MEME TENANT :
    if (repository.findByNameAndTenantId(type.getName(), tenantId).isPresent()) {
      throw new RuntimeException("Un type avec ce nom existe déjà pour cette entreprise.");
    }

    type.setTenantId(tenantId);
    type.setCreatedAt(LocalDateTime.now());
    ModelType saved = repository.save(type);
    return ResponseEntity.ok(saved);
  }

  @PutMapping("/{id}")
  public ResponseEntity<ModelType> updateType(
    @PathVariable Long id,
    @RequestBody ModelType type,
    @RequestParam("tenantId") String tenantId) {

    ModelType existing = repository.findById(id)
      .orElseThrow(() -> new RuntimeException("Type non trouvé"));

    if (!existing.getTenantId().equals(tenantId)) {
      throw new RuntimeException("Accès non autorisé à ce type");
    }

    // 🔥 Vérifier collision sur le nouveau nom pour le même tenant (si le nom est changé)
    if (!existing.getName().equals(type.getName())) {
      if (repository.findByNameAndTenantId(type.getName(), tenantId).isPresent()) {
        throw new RuntimeException("Un type avec ce nom existe déjà pour cette entreprise.");
      }
    }

    existing.setName(type.getName());
    existing.setLabel(type.getLabel());
    return ResponseEntity.ok(repository.save(existing));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Map<String, String>> deleteType(
    @PathVariable Long id,
    @RequestParam("tenantId") String tenantId) {

    ModelType existing = repository.findById(id)
      .orElseThrow(() -> new RuntimeException("Type non trouvé"));

    if (!existing.getTenantId().equals(tenantId)) {
      throw new RuntimeException("Accès non autorisé à ce type");
    }

    repository.deleteById(id);
    return ResponseEntity.ok(Map.of("message", "Type supprimé définitivement"));
  }
}
