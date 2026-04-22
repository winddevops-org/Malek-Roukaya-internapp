package com.tonentreprise.backend.controller;

import com.tonentreprise.backend.dto.ModelFromOcrResponseDto;
import com.tonentreprise.backend.dto.OcrResultDto;
import com.tonentreprise.backend.service.ModelFromOcrService;
import com.tonentreprise.backend.service.PdfOcrService;
import com.tonentreprise.backend.service.PdfOcrService.OcrServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Endpoint utilisé par le bouton "Générer depuis PDF" du front Angular.
 *
 * URL    : POST /api/models/pdf-ocr
 * Type   : multipart/form-data
 * Parts  :
 *   - pdf        (fichier PDF)
 *   - modelName  (string)  — nom choisi par l'utilisateur
 *   - typeId     (long)    — ID du ModelType (facture, bon-commande…)
 *   - tenantId   (string)  — identifiant du tenant
 *
 * Flux complet :
 *   Angular
 *     → POST /api/models/pdf-ocr
 *     → PdfOcrController
 *     → PdfOcrService        → Python :8000/analyze-pdf  → OcrResultDto
 *     → ModelFromOcrService  → PostgreSQL                → DocumentModel + ModelField
 *     ← ModelFromOcrResponseDto
 *     ← Angular (ocrStep = 3, popup succès)
 *
 * Placez ce fichier dans :
 *   src/main/java/com/tonentreprise/backend/controller/PdfOcrController.java
 */
@RestController
@RequestMapping("/api/models")
@CrossOrigin(origins = "http://localhost:4200")
public class PdfOcrController {

    private static final Logger log = LoggerFactory.getLogger(PdfOcrController.class);

    @Autowired
    private PdfOcrService pdfOcrService;

    @Autowired
    private ModelFromOcrService modelFromOcrService;

    @PostMapping(value = "/pdf-ocr", consumes = "multipart/form-data")
    public ResponseEntity<?> generateModelFromPdf(
            @RequestPart("pdf")           MultipartFile file,
            @RequestParam("modelName")    String        modelName,
            @RequestParam("typeId")       Long          typeId,
            @RequestParam("tenantId")     String        tenantId
    ) {
        // ── Validations ───────────────────────────────────────────────────

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Fichier PDF manquant."));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Seuls les fichiers PDF sont acceptés."));
        }

        if (file.getSize() > 20L * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(Map.of("message", "Le fichier dépasse la limite de 20 Mo."));
        }

        if (modelName == null || modelName.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Le nom du modèle est obligatoire."));
        }

        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "tenantId est obligatoire."));
        }

        try {
            // ── Étape 1 : Analyse OCR via le microservice Python ──────────
            log.info("OCR demandé — file='{}' model='{}' typeId={} tenant='{}'",
                    file.getOriginalFilename(), modelName, typeId, tenantId);

            OcrResultDto ocrResult = pdfOcrService.analyzePdf(file);

            // ── Étape 2 : Persistance du DocumentModel + ModelField en BDD ─
            ModelFromOcrResponseDto response = modelFromOcrService.createModelFromOcr(
                    modelName, typeId, tenantId, ocrResult);

            return ResponseEntity.ok(response);

        } catch (OcrServiceException e) {
            // Microservice Python injoignable ou erreur d'analyse
            log.error("Erreur microservice OCR : {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", e.getMessage()));

        } catch (IllegalArgumentException e) {
            // typeId inexistant, etc.
            log.error("Paramètre invalide : {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));

        } catch (Exception e) {
            log.error("Erreur inattendue lors de la génération OCR : {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur interne lors de la génération du modèle."));
        }
    }
}
