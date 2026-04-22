package com.tonentreprise.backend.controller;

import com.tonentreprise.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/password-reset")
@CrossOrigin(origins = "http://localhost:4200")
public class PasswordResetController {

  @Autowired
  private AuthService authService; // ⬅️ Changé ici

  @PostMapping("/request-otp")
  public ResponseEntity<?> requestOTP(@RequestBody Map<String, String> request) {
    try {
      String email = request.get("email");
      authService.generateAndSendOTP(email); // ⬅️ Changé ici
      return ResponseEntity.ok(Map.of("message", "Code OTP envoyé à votre email"));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
  }

  @PostMapping("/verify-otp")
  public ResponseEntity<?> verifyOTP(@RequestBody Map<String, String> request) {
    try {
      String email = request.get("email");
      String otpCode = request.get("otpCode");

      boolean isValid = authService.verifyOTP(email, otpCode); // ⬅️ Changé ici

      if (isValid) {
        return ResponseEntity.ok(Map.of("message", "Code OTP valide"));
      } else {
        return ResponseEntity.badRequest().body(Map.of("message", "Code OTP invalide ou expiré"));
      }
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
  }

  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
    try {
      String email = request.get("email");
      String otpCode = request.get("otpCode");
      String newPassword = request.get("newPassword");

      authService.resetPassword(email, otpCode, newPassword); // ⬅️ Changé ici
      return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès"));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
  }
}
