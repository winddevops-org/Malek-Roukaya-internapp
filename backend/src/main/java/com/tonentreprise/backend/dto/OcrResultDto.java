package com.tonentreprise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO reçu depuis le microservice Python FastAPI (/analyze-pdf).
 *
 * Le microservice retourne ce JSON :
 * {
 *   "fieldsCount": 8,
 *   "pageCount":   2,
 *   "fields": [
 *     {
 *       "label":      "Date",
 *       "type":       "date",
 *       "xPct":       10.5,
 *       "yPct":       8.2,
 *       "widthPct":   20.0,
 *       "heightPct":  3.5,
 *       "page":       1,
 *       "required":   true
 *     },
 *     ...
 *   ]
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OcrResultDto {

    private int fieldsCount;
    private int pageCount;
    private List<OcrFieldDto> fields;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OcrFieldDto {

        /** Label détecté dans le PDF (ex: "Date", "Nom client", "Total TTC") */
        private String label;

        /**
         * Type OCR retourné par Python :
         *   "texte"         → ModelField.type = "text"
         *   "texte_long"    → ModelField.type = "textarea"
         *   "date"          → ModelField.type = "date"
         *   "case_a_cocher" → ModelField.type = "checkbox"
         */
        private String type;

        /** Position X en % de la largeur de page (0–100) */
        private double xPct;

        /** Position Y en % de la hauteur de page (0–100) */
        private double yPct;

        /** Largeur en % */
        private double widthPct;

        /** Hauteur en % */
        private double heightPct;

        /** Numéro de page (1-based) */
        private int page;

        /** Champ obligatoire ? */
        private boolean required;
    }
}
