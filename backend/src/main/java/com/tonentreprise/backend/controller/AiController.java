package com.tonentreprise.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

  @Value("${openai.api.key}")
  private String groqApiKey;

  @Value("${tavily.api.key}")
  private String tavilyApiKey;

  @PostMapping("/verify")
  public ResponseEntity<?> verifyEntreprise(@RequestBody Map<String, String> request) {
    String nom = request.get("nom");
    String matricule = request.get("matriculeFiscale");
    String ville = request.get("ville");
    String gouvernorat = request.get("gouvernorat");

    System.out.println("🟢 [1] Lancement de la recherche Web (Tavily) pour : " + nom);

    RestTemplate restTemplate = new RestTemplate();
    String webContext = "";

    // ==========================================
    // ACTION 1 : RECHERCHE WEB AVEC TAVILY
    // ==========================================
    try {
      String query = nom + " entreprise " + gouvernorat + " Tunisie";

      HttpHeaders searchHeaders = new HttpHeaders();
      searchHeaders.setContentType(MediaType.APPLICATION_JSON);

      Map<String, Object> searchBody = new HashMap<>();
      searchBody.put("api_key", tavilyApiKey);
      searchBody.put("query", query);
      searchBody.put("max_results", 3); // On demande les 3 meilleurs résultats

      HttpEntity<Map<String, Object>> searchEntity = new HttpEntity<>(searchBody, searchHeaders);
      ResponseEntity<Map> searchResponse = restTemplate.postForEntity("https://api.tavily.com/search", searchEntity, Map.class);

      Map<String, Object> body = searchResponse.getBody();
      List<Map<String, Object>> results = (List<Map<String, Object>>) body.get("results");

      if (results != null && !results.isEmpty()) {
        for (Map<String, Object> res : results) {
          String title = (String) res.get("title");
          String content = (String) res.get("content"); // Tavily extrait directement le texte important !
          webContext += "📍 " + title + " : " + content + "\n";
        }
        System.out.println("🟢 [1] Preuves Web trouvées par Tavily !");
      } else {
        webContext = "⚠️ Aucun résultat probant trouvé sur internet pour cette entreprise.";
      }
    } catch (Exception e) {
      System.out.println("🟠 Erreur lors de la recherche Tavily : " + e.getMessage());
      webContext = "Recherche internet temporairement indisponible.";
    }

    // ==========================================
    // ACTION 2 : ANALYSE PAR L'IA (GROQ - LLAMA 3.3)
    // ==========================================
    System.out.println("🟢 [2] Envoi des preuves à l'IA Groq...");

    String prompt =
      "Tu es un assistant professionnel spécialisé en vérification d’entreprises tunisiennes. "
        + "Tu dois analyser UNIQUEMENT les résultats Internet ci-dessous (fournis par Tavily), "
        + "et produire un rapport clair, structuré et professionnel, sans rien inventer.<br><br>"

        + "<strong>🔎 Données recherchées :</strong><br>"
        + "- Nom : " + nom + "<br>"
        + "- Ville : " + ville + "<br>"
        + "- Gouvernorat : " + gouvernorat + "<br>"
        + "- Matricule fiscal fourni : " + matricule + "<br><br>"

        + "<strong>📘 Résultats Internet à analyser :</strong><br>"
        + webContext + "<br><br>"

        + "<strong>Règles strictes :</strong><br>"
        + "1️⃣ Ne retenir que les résultats mentionnant clairement le nom '" + nom + "'.<br>"
        + "2️⃣ La ville ou localisation doit correspondre à '" + ville + "' ou '" + gouvernorat + "'.<br>"
        + "3️⃣ Si les résultats ne correspondent pas → indique 'Aucune information officielle trouvée'.<br>"
        + "4️⃣ Ne jamais inventer de téléphone, adresse ou site web non présents dans les résultats Tavily.<br>"
        + "5️⃣ Le rapport doit être structuré et en HTML uniquement.<br><br>"

        + "<strong>Format final OBLIGATOIRE :</strong><br>"
        + "<strong>Résumé :</strong> 2 à 3 phrases expliquant si des correspondances ont été trouvées.<br>"
        + "<strong>Détails vérifiés (si trouvés) :</strong><br>"
        + "✔️ Nom de l'entreprise<br>"
        + "✔️ Adresse<br>"
        + "✔️ Téléphone<br>"
        + "✔️ E-mail<br>"
        + "✔️ Site web<br>"
        + "(Ne mentionne ces éléments que s’ils sont réellement trouvés dans les résultats Tavily.)<br><br>"

        + "<strong>Conclusion :</strong> 'Correspondance trouvée' ou 'Aucune correspondance trouvée'.<br>";

    try {
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      headers.setBearerAuth(groqApiKey);

      Map<String, Object> body = new HashMap<>();
      body.put("model", "llama-3.3-70b-versatile");

      List<Map<String, String>> messages = new ArrayList<>();
      Map<String, String> userMessage = new HashMap<>();
      userMessage.put("role", "user");
      userMessage.put("content", prompt);
      messages.add(userMessage);
      body.put("messages", messages);

      HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

      ResponseEntity<Map> response = restTemplate.postForEntity("https://api.groq.com/openai/v1/chat/completions", entity, Map.class);

      Map<String, Object> responseBody = response.getBody();
      List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
      String aiContent = (String) ((Map<String, Object>) choices.get(0).get("message")).get("content");

      boolean isSafe = !aiContent.toLowerCase().contains("suspect") && !webContext.contains("Aucun résultat");

      Map<String, Object> result = new HashMap<>();
      result.put("isSafe", isSafe);
      result.put("message", aiContent);

      return ResponseEntity.ok(result);

    } catch (Exception e) {
      System.out.println("🔴 Erreur IA : " + e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Collections.singletonMap("error", "Erreur lors de l'analyse automatique."));
    }
  }
}
