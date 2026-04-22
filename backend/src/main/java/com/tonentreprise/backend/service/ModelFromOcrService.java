package com.tonentreprise.backend.service;

import com.tonentreprise.backend.dto.ModelFromOcrResponseDto;
import com.tonentreprise.backend.dto.ModelFromOcrResponseDto.FieldSummary;
import com.tonentreprise.backend.dto.OcrResultDto;
import com.tonentreprise.backend.dto.OcrResultDto.OcrFieldDto;
import com.tonentreprise.backend.model.DocumentModel;
import com.tonentreprise.backend.model.ModelField;
import com.tonentreprise.backend.model.ModelType;
import com.tonentreprise.backend.repository.DocumentModelRepository;
import com.tonentreprise.backend.repository.ModelFieldRepository;
import com.tonentreprise.backend.repository.ModelTypeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Transforme le résultat OCR (Python) en DocumentModel + ModelField
 * persistés en base PostgreSQL.
 *
 * Utilise exactement vos entités existantes :
 *   - DocumentModel  (document_models)
 *   - ModelField     (model_fields)
 *   - ModelType      (model_types)
 *
 * Mapping types OCR → types ModelField (votre BDD) :
 * ┌──────────────────┬──────────────────────────────────────────┐
 * │  Type Python OCR │  ModelField.type stocké en BDD           │
 * ├──────────────────┼──────────────────────────────────────────┤
 * │  texte           │  text                                    │
 * │  texte_long      │  textarea                                │
 * │  date            │  date                                    │
 * │  case_a_cocher   │  checkbox                                │
 * └──────────────────┴──────────────────────────────────────────┘
 *
 * Mapping positions :
 *   OCR Python retourne des % (0–100) par rapport à la page PDF.
 *   On convertit en pixels absolus pour le canvas A4 de l'éditeur Angular.
 *   Canvas A4 = 794 × 1123 px (A4 à 96 dpi).
 *
 * Placez ce fichier dans :
 *   src/main/java/com/tonentreprise/backend/service/ModelFromOcrService.java
 */
@Service
public class ModelFromOcrService {

    private static final Logger log = LoggerFactory.getLogger(ModelFromOcrService.class);

    // ── Canvas A4 éditeur Angular (px à 96 dpi) ───────────────────────────
    private static final double CANVAS_WIDTH_PX  = 794.0;
    private static final double CANVAS_HEIGHT_PX = 1123.0;

    // ── Mapping type OCR Python → type ModelField ─────────────────────────
    private static final Map<String, String> TYPE_MAP = Map.of(
        "texte",         "text",
        "texte_long",    "textarea",
        "date",          "date",
        "case_a_cocher", "checkbox"
    );

    @Autowired
    private DocumentModelRepository documentModelRepository;

    @Autowired
    private ModelFieldRepository modelFieldRepository;

    @Autowired
    private ModelTypeRepository modelTypeRepository;

    /**
     * Crée le DocumentModel et ses ModelField en base à partir du résultat OCR.
     *
     * @param modelName  nom saisi par l'utilisateur dans le popup Angular
     * @param typeId     ID du ModelType (facture, bon-commande, …)
     * @param tenantId   identifiant du tenant (multi-tenant)
     * @param ocrResult  résultat brut retourné par le microservice Python
     * @return DTO renvoyé au front Angular
     */
    @Transactional
    public ModelFromOcrResponseDto createModelFromOcr(
            String       modelName,
            Long         typeId,
            String       tenantId,
            OcrResultDto ocrResult
    ) {
        // ── 1. Récupérer le ModelType ─────────────────────────────────────
        ModelType modelType = modelTypeRepository.findById(typeId)
            .orElseThrow(() -> new IllegalArgumentException(
                "ModelType introuvable : id=" + typeId));

        // ── 2. Créer le DocumentModel ─────────────────────────────────────
        // Même logique que DocumentModelService.createModel()
        DocumentModel model = new DocumentModel();
        model.setName(modelName.trim());
        model.setModelType(modelType);
        model.setTenantId(tenantId);
        model.setCreatedAt(LocalDateTime.now());
        model.setUpdatedAt(LocalDateTime.now());
        model.setFields(new ArrayList<>());

        DocumentModel savedModel = documentModelRepository.save(model);

        log.info("DocumentModel OCR créé : id={} name='{}' tenant='{}'",
                savedModel.getId(), savedModel.getName(), tenantId);

        // ── 3. Créer les ModelField à partir des champs OCR ───────────────
        List<FieldSummary> summaries = new ArrayList<>();

        if (ocrResult.getFields() != null) {
            for (OcrFieldDto ocrField : ocrResult.getFields()) {

                ModelField field = buildModelField(ocrField, savedModel);
                modelFieldRepository.save(field);
                savedModel.getFields().add(field);

                summaries.add(new FieldSummary(
                    ocrField.getLabel(),
                    mapType(ocrField.getType())
                ));
            }
        }

        log.info("{} ModelField(s) créé(s) pour DocumentModel id={}",
                summaries.size(), savedModel.getId());

        // ── 4. Retourner la réponse pour Angular ──────────────────────────
        return new ModelFromOcrResponseDto(
            savedModel.getId(),
            savedModel.getName(),
            summaries.size(),
            summaries
        );
    }

    // ── Helpers privés ────────────────────────────────────────────────────

    /**
     * Construit un ModelField depuis un OcrFieldDto.
     * Convertit les positions % → px canvas A4.
     */
    private ModelField buildModelField(OcrFieldDto ocr, DocumentModel model) {
        ModelField field = new ModelField();

        // ── Identifiant unique (même convention que l'éditeur Angular) ────
        field.setFieldId(UUID.randomUUID().toString().substring(0, 8));

        // ── Label, type, clé ──────────────────────────────────────────────
        field.setLabel(ocr.getLabel());
        field.setType(mapType(ocr.getType()));
        field.setPlaceholder(ocr.getLabel());
        field.setDocumentKey(slugify(ocr.getLabel()));
        field.setValue("");

        // ── Position : % → px canvas A4 ──────────────────────────────────
        field.setX(round(ocr.getXPct()       / 100.0 * CANVAS_WIDTH_PX));
        field.setY(round(ocr.getYPct()       / 100.0 * CANVAS_HEIGHT_PX));
        field.setWidth(round(ocr.getWidthPct()  / 100.0 * CANVAS_WIDTH_PX));
        field.setHeight(round(ocr.getHeightPct() / 100.0 * CANVAS_HEIGHT_PX));

        // ── Style par défaut (cohérent avec l'éditeur Angular) ───────────
        field.setBold(false);
        field.setItalic(false);
        field.setUnderline(false);
        field.setBoxed(false);
        field.setFontSize(13.0);
        field.setBorderColor("#e2e8f0");
        field.setBorderWidth(1.0);
        field.setBorderStyle("solid");
        field.setBackgroundColor("transparent");
        field.setBorderRadius(4.0);

        field.setDocumentModel(model);
        return field;
    }

    /**
     * Convertit le type OCR Python en type ModelField BDD.
     * Fallback sur "text" si type inconnu.
     */
    private String mapType(String ocrType) {
        if (ocrType == null) return "text";
        return TYPE_MAP.getOrDefault(ocrType.toLowerCase().trim(), "text");
    }

    /**
     * Génère une clé documentKey en snake_case depuis un label.
     * Ex: "Nom du Client" → "nom_du_client"
     */
    private String slugify(String label) {
        if (label == null) return "field";
        return label.toLowerCase()
                    .trim()
                    .replaceAll("[éèêë]", "e")
                    .replaceAll("[àâä]",  "a")
                    .replaceAll("[ùûü]",  "u")
                    .replaceAll("[ôö]",   "o")
                    .replaceAll("[îï]",   "i")
                    .replaceAll("[ç]",    "c")
                    .replaceAll("[^a-z0-9]+", "_")
                    .replaceAll("^_+|_+$", "");
    }

    private double round(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}
