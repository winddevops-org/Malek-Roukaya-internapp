package com.tonentreprise.backend.service;

import com.tonentreprise.backend.dto.OcrResultDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Envoie le fichier PDF au microservice Python FastAPI
 * et retourne les champs détectés avec leurs positions.
 *
 * Flux :
 *   Angular → PdfOcrController → PdfOcrService → Python :8000/analyze-pdf
 *
 * Placez ce fichier dans :
 *   src/main/java/com/tonentreprise/backend/service/PdfOcrService.java
 */
@Service
public class PdfOcrService {

    private static final Logger log = LoggerFactory.getLogger(PdfOcrService.class);

    /** URL du microservice Python — définie dans application.properties */
    @Value("${ocr.service.url:http://localhost:8000}")
    private String ocrServiceUrl;

    private final RestTemplate restTemplate;

    public PdfOcrService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Appelle POST /analyze-pdf sur le microservice Python.
     *
     * @param file fichier PDF reçu depuis Angular (via PdfOcrController)
     * @return OcrResultDto contenant les champs détectés et leurs positions en %
     * @throws OcrServiceException si le microservice est injoignable ou renvoie une erreur
     */
    public OcrResultDto analyzePdf(MultipartFile file) {
        String endpoint = ocrServiceUrl + "/analyze-pdf";

        try {
            // ── Préparer la requête multipart/form-data ───────────────────
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // ByteArrayResource : nécessaire pour que Spring envoie le nom du fichier
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    String name = file.getOriginalFilename();
                    return (name != null && !name.isBlank()) ? name : "upload.pdf";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> request =
                    new HttpEntity<>(body, headers);

            // ── Appel HTTP vers le microservice Python ────────────────────
            log.info("→ Appel OCR microservice : {}", endpoint);

            ResponseEntity<OcrResultDto> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    request,
                    OcrResultDto.class
            );

            OcrResultDto result = response.getBody();
            if (result == null) {
                throw new OcrServiceException("Le microservice OCR a retourné une réponse vide.");
            }

            log.info("← OCR terminé : {} champ(s) détecté(s) sur {} page(s)",
                    result.getFieldsCount(), result.getPageCount());

            return result;

        } catch (ResourceAccessException e) {
            // Microservice Python éteint ou port incorrect
            log.error("Microservice OCR injoignable ({}): {}", endpoint, e.getMessage());
            throw new OcrServiceException(
                "Le service d'analyse PDF est temporairement indisponible. " +
                "Vérifiez que le microservice Python tourne sur le port 8000.", e);

        } catch (HttpClientErrorException e) {
            log.error("Erreur HTTP {} du microservice OCR : {}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new OcrServiceException(
                "Erreur lors de l'analyse du PDF : " + e.getResponseBodyAsString(), e);

        } catch (IOException e) {
            log.error("Impossible de lire le fichier PDF : {}", e.getMessage());
            throw new OcrServiceException("Impossible de lire le fichier PDF.", e);
        }
    }

    // ── Exception métier ──────────────────────────────────────────────────

    public static class OcrServiceException extends RuntimeException {
        public OcrServiceException(String message) {
            super(message);
        }
        public OcrServiceException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
