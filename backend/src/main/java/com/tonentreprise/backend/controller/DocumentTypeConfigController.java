package com.tonentreprise.backend.controller;

import com.tonentreprise.backend.dto.TypeConfigDTO;
import com.tonentreprise.backend.service.DocumentTypeConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/document-types")
@CrossOrigin(origins = "http://localhost:4200")
public class DocumentTypeConfigController {

    @Autowired
    private DocumentTypeConfigService configService;

    // Récupérer la configuration de champs pour un type (facture, attestation, ...)
    @GetMapping("/config")
    public ResponseEntity<TypeConfigDTO> getConfig(@RequestParam Long typeId) {
        TypeConfigDTO dto = configService.getConfigForType(typeId);
        return ResponseEntity.ok(dto);
    }

    // Enregistrer / remplacer la configuration de champs pour un type
    @PostMapping("/config")
    public ResponseEntity<TypeConfigDTO> saveConfig(@RequestParam Long typeId,
                                                    @RequestBody TypeConfigDTO dto) {
        // On ignore dto.typeId côté body, on fait confiance au paramètre typeId
        TypeConfigDTO saved = configService.saveConfigForType(typeId, dto);
        return ResponseEntity.ok(saved);
    }
}
