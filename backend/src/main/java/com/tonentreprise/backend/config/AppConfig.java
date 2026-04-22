package com.tonentreprise.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration Spring Boot.
 *
 * Déclare le bean RestTemplate utilisé par PdfOcrService
 * pour appeler le microservice Python FastAPI.
 *
 * Placez ce fichier dans :
 *   src/main/java/com/tonentreprise/backend/config/AppConfig.java
 */
@Configuration
public class AppConfig {

    /**
     * Timeout connexion vers le microservice Python (ms).
     * Configurable via application.properties : ocr.service.connect-timeout
     */
    @Value("${ocr.service.connect-timeout:5000}")
    private int connectTimeout;

    /**
     * Timeout lecture de la réponse OCR (ms).
     * 60 secondes pour les PDFs volumineux.
     * Configurable via application.properties : ocr.service.read-timeout
     */
    @Value("${ocr.service.read-timeout:60000}")
    private int readTimeout;

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        return new RestTemplate(factory);
    }
}
