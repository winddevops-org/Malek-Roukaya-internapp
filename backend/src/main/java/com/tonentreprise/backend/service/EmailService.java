package com.tonentreprise.backend.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

  @Autowired
  private JavaMailSender mailSender;

  private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
      helper.setTo(toEmail);
      helper.setSubject(subject);
      helper.setText(htmlContent, true);
      mailSender.send(mimeMessage);
    } catch (Exception e) {
      System.err.println("Erreur lors de l'envoi de l'email HTML :");
      e.printStackTrace();
    }
  }

  public void sendValidationEmail(String toEmail, String entrepriseNom, String plainPassword) {
    String subject = "Validation de votre compte entreprise";

    String html = """
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:0; background-color:#f9fafb;">
        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; border:1px solid #e5e7eb; padding:24px;">
                <tr>
                  <td align="left" style="font-family:Arial, sans-serif; color:#111827;">
                    <h2 style="margin:0 0 16px 0; font-size:20px;">Votre compte entreprise a été validé</h2>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Bonjour <strong>%s</strong>,</p>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Votre compte entreprise a été validé sur notre plateforme.</p>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Vos informations de connexion :</p>
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px 0; font-size:14px; color:#111827; background:#f8fafc; padding:12px; border-radius:8px; width:100%%;">
                      <tr>
                        <td style="padding:4px 0; width:120px; color:#6b7280;">Email :</td>
                        <td style="padding:4px 0;"><strong>%s</strong></td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0; color:#6b7280;">Mot de passe :</td>
                        <td style="padding:4px 0;"><strong style="font-family:monospace; font-size:16px;">%s</strong></td>
                      </tr>
                    </table>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Veuillez vous connecter et modifier ce mot de passe immédiatement pour des raisons de sécurité.</p>
                    <p style="margin:24px 0 0 0; font-size:14px; color:#374151;">Cordialement,<br><strong>L’équipe d’administration</strong></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      """.formatted(entrepriseNom, toEmail, plainPassword);

    sendHtmlEmail(toEmail, subject, html);
    System.out.println("Email de validation (avec mot de passe) envoyé à : " + toEmail);
  }

  public void sendOTPEmail(String toEmail, String otpCode) {
    String subject = "Code de vérification – Réinitialisation de mot de passe";
    String html = """
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:0; background-color:#f9fafb;">
        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; border:1px solid #e5e7eb; padding:24px;">
                <tr>
                  <td align="left" style="font-family:Arial, sans-serif; color:#111827;">
                    <h2 style="margin:0 0 16px 0; font-size:20px;">Code de vérification</h2>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Votre code de vérification est :</p>
                    <p style="margin:8px 0 16px 0; font-size:24px; font-weight:bold; letter-spacing:4px; color:#111827; text-align:center;">%s</p>
                    <p style="margin:0 0 12px 0; font-size:13px; color:#6b7280;">Valable 10 minutes.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      """.formatted(otpCode);
    sendHtmlEmail(toEmail, subject, html);
  }

  public void sendUserCreationEmail(String toEmail, String userNom, String entrepriseNom, String plainPassword) {
    String subject = "Création de votre compte utilisateur";
    String html = """
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:0; background-color:#f9fafb;">
        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; border:1px solid #e5e7eb; padding:24px;">
                <tr>
                  <td align="left" style="font-family:Arial, sans-serif; color:#111827;">
                    <h2 style="margin:0 0 16px 0; font-size:20px;">Votre compte utilisateur a été créé</h2>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Bonjour <strong>%s</strong>,</p>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Un compte a été créé pour vous par <strong>%s</strong>.</p>
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px 0; font-size:14px; color:#111827;">
                      <tr><td style="padding:4px 0; width:160px; color:#6b7280;">Adresse e-mail :</td><td style="padding:4px 0;"><strong>%s</strong></td></tr>
                      <tr><td style="padding:4px 0; color:#6b7280;">Mot de passe temporaire :</td><td style="padding:4px 0;"><strong>%s</strong></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      """.formatted(userNom, entrepriseNom, toEmail, plainPassword);
    sendHtmlEmail(toEmail, subject, html);
  }

  public void sendPasswordChangedEmail(String toEmail, String nom) {
    String subject = "Votre mot de passe a été modifié";
    String html = """
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:0; background-color:#f9fafb;">
        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; border:1px solid #e5e7eb; padding:24px;">
                <tr>
                  <td align="left" style="font-family:Arial, sans-serif; color:#111827;">
                    <h2 style="margin:0 0 16px 0; font-size:20px;">Confirmation de changement de mot de passe</h2>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Bonjour <strong>%s</strong>,</p>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Le mot de passe associé à votre compte vient d’être modifié avec succès.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      """.formatted(nom != null ? nom : "");
    sendHtmlEmail(toEmail, subject, html);
  }

  public void sendAdminPasswordResetEmail(String toEmail, String userNom, String nouvelleValeurMdp, String adminNomOuEmail) {
    String subject = "Mot de passe réinitialisé par l'administrateur";
    String html = """
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:0; background-color:#f9fafb;">
        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; border:1px solid #e5e7eb; padding:24px;">
                <tr>
                  <td align="left" style="font-family:Arial, sans-serif; color:#111827;">
                    <h2 style="margin:0 0 16px 0; font-size:20px;">Réinitialisation de votre mot de passe</h2>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Bonjour <strong>%s</strong>,</p>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">L'administrateur (%s) a réinitialisé votre mot de passe.</p>
                    <p style="margin:8px 0 16px 0; font-size:18px; font-weight:bold; color:#111827; text-align:center;">%s</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      """.formatted(userNom != null ? userNom : "", adminNomOuEmail != null ? adminNomOuEmail : "un administrateur", nouvelleValeurMdp);
    sendHtmlEmail(toEmail, subject, html);
  }

  public void sendRefusEmail(String toEmail, String entrepriseNom) {
    String subject = "Demande d’inscription refusée";
    String html = """
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:0; background-color:#f9fafb;">
        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; border:1px solid #e5e7eb; padding:24px;">
                <tr>
                  <td align="left" style="font-family:Arial, sans-serif; color:#111827;">
                    <h2 style="margin:0 0 16px 0; font-size:20px;">Décision concernant votre demande</h2>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Bonjour <strong>%s</strong>,</p>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Votre demande d’inscription n’a pas été retenue.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      """.formatted(entrepriseNom);
    sendHtmlEmail(toEmail, subject, html);
  }

  public void sendEntrepriseDeletedEmail(String toEmail, String entrepriseNom) {
    String subject = "Suppression de votre compte entreprise";
    String html = """
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:0; background-color:#f9fafb;">
        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; border:1px solid #e5e7eb; padding:24px;">
                <tr>
                  <td align="left" style="font-family:Arial, sans-serif; color:#111827;">
                    <h2 style="margin:0 0 16px 0; font-size:20px;">Suppression de compte</h2>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Bonjour <strong>%s</strong>,</p>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Le compte entreprise associé à cette adresse a été supprimé de notre plateforme.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      """.formatted(entrepriseNom);
    sendHtmlEmail(toEmail, subject, html);
  }

  public void sendUserUpdatedByAdminEmail(String oldEmail, String newEmail, String userNom, String newPlainPasswordOrNull, String entrepriseNomOuAdmin) {
    String subject = "Mise à jour de votre compte utilisateur";
    boolean emailChanged = (oldEmail != null && !oldEmail.equalsIgnoreCase(newEmail));
    String passwordBlock = "";
    if (newPlainPasswordOrNull != null && !newPlainPasswordOrNull.isBlank()) {
      passwordBlock = "<tr><td style='padding:4px 0; color:#6b7280;'>Nouveau mot de passe :</td><td style='padding:4px 0;'><strong>" + newPlainPasswordOrNull + "</strong></td></tr>";
    }

    String html = """
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:0; background-color:#f9fafb;">
        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; border:1px solid #e5e7eb; padding:24px;">
                <tr>
                  <td align="left" style="font-family:Arial, sans-serif; color:#111827;">
                    <h2 style="margin:0 0 16px 0; font-size:20px;">Mise à jour de votre compte</h2>
                    <p style="margin:0 0 12px 0; font-size:14px; color:#374151;">Bonjour <strong>%s</strong>,</p>
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px 0; font-size:14px; color:#111827;">
                      %s
                      <tr><td style="padding:4px 0; width:160px; color:#6b7280;">Adresse e-mail :</td><td style="padding:4px 0;"><strong>%s</strong></td></tr>
                      %s
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      """.formatted(userNom != null ? userNom : "", emailChanged ? "<tr><td style='padding:4px 0; color:#6b7280;'>Ancienne adresse :</td><td style='padding:4px 0;'><strong>" + oldEmail + "</strong></td></tr>" : "", newEmail, passwordBlock);
    sendHtmlEmail(newEmail, subject, html);
  }
}
