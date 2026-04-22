package com.tonentreprise.backend.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.passay.CharacterRule;
import org.passay.EnglishCharacterData;
import org.passay.PasswordGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class OtpService {

  @Autowired
  private EmailService emailService;

  // CAFFEINE CACHE : Expire automatiquement après 10 minutes
  private final Cache<String, String> otpCache = Caffeine.newBuilder()
    .expireAfterWrite(10, TimeUnit.MINUTES)
    .build();

  public String generateAndStoreOTP(String email) {
    PasswordGenerator gen = new PasswordGenerator();
    CharacterRule digits = new CharacterRule(EnglishCharacterData.Digit);
    String otpCode = gen.generatePassword(6, digits);

    otpCache.put(email, otpCode);

    System.out.println("════════════════════════════════════════");
    System.out.println("📧 Envoi d'email à: " + email);
    System.out.println("🔐 CODE OTP (En cache Caffeine): " + otpCode);
    System.out.println("════════════════════════════════════════");

    emailService.sendOTPEmail(email, otpCode);
    return otpCode;
  }

  // ✅ NOUVEAU : Vérifie le code SANS le supprimer du cache
  public boolean isValidOTP(String email, String otpCode) {
    String cachedOtp = otpCache.getIfPresent(email);
    return cachedOtp != null && cachedOtp.equals(otpCode);
  }
  // ✅ NOUVEAU : Vérifie le code ET le supprime (consommation)
  public boolean consumeOTP(String email, String otpCode) {
    if (isValidOTP(email, otpCode)) {
      otpCache.invalidate(email);
      return true;
    }
    return false;
  }

  // Ancienne méthode conservée au cas où elle serait appelée ailleurs
  public boolean verifyOTP(String email, String otpCode) {
    return isValidOTP(email, otpCode);    // <-- CORRECT
  }

  // Génération d'un mot de passe fort pour la création de compte
  public String generateStrongPassword() {
    PasswordGenerator gen = new PasswordGenerator();
    CharacterRule lowerCase = new CharacterRule(EnglishCharacterData.LowerCase, 2);
    CharacterRule upperCase = new CharacterRule(EnglishCharacterData.UpperCase, 2);
    CharacterRule digits = new CharacterRule(EnglishCharacterData.Digit, 2);

    return gen.generatePassword(10, lowerCase, upperCase, digits);
  }
}
