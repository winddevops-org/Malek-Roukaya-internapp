package com.tonentreprise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Réponse envoyée au front Angular après création du modèle en BDD.
 *
 * Le front Angular attend exactement ce format dans ocrResult :
 * {
 *   "modelId":     42,
 *   "modelName":   "Bon de commande standard",
 *   "fieldsCount": 8,
 *   "fields": [
 *     { "label": "Date",       "type": "date"  },
 *     { "label": "Nom client", "type": "texte" },
 *     ...
 *   ]
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModelFromOcrResponseDto {

    /** ID du DocumentModel créé en base — utilisé par openGeneratedModelInEditor() côté Angular */
    private Long modelId;

    /** Nom du modèle tel que saisi par l'utilisateur */
    private String modelName;

    /** Nombre de champs créés */
    private int fieldsCount;

    /** Résumé des champs — affiché dans le popup succès Angular */
    private List<FieldSummary> fields;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldSummary {
        private String label;
        private String type;
    }
}
