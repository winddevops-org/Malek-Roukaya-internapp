package com.tonentreprise.backend.controller;

import com.tonentreprise.backend.dto.RealDocumentDto;
import com.tonentreprise.backend.service.RealDocumentService;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:4200")
public class RealDocumentController {

  @Autowired
  private RealDocumentService service;

  // Créer un document (facture réelle) lié à un tenant
  @PostMapping
  public ResponseEntity<RealDocumentDto> createDocument(
    @RequestBody RealDocumentDto dto,
    @RequestParam("tenantId") String tenantId) throws JsonProcessingException {
    RealDocumentDto saved = service.create(dto, tenantId);
    return ResponseEntity.ok(saved);
  }

  // Récupérer tous les documents d'un type pour un tenant précis
  @GetMapping
  public ResponseEntity<List<RealDocumentDto>> getDocumentsByType(
    @RequestParam("typeId") Long typeId,
    @RequestParam("tenantId") String tenantId) {
    List<RealDocumentDto> docs = service.getByTypeIdAndTenantId(typeId, tenantId);
    return ResponseEntity.ok(docs);
  }

  // Supprimer un document réel de manière sécurisée (vérifie le tenant)
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteDocument(
    @PathVariable Long id,
    @RequestParam("tenantId") String tenantId) {
    service.delete(id, tenantId);
    return ResponseEntity.noContent().build();
  }
}
