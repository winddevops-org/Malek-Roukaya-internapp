package com.tonentreprise.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "entreprises")
public class Entreprise {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String nom;

  @Column(name = "matricule_fiscale", nullable = false, unique = true)
  private String matriculeFiscale;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String password;

  @Column(nullable = false)
  private String telephone;

  @Column(nullable = false)
  private String gouvernorat;

  @Column(nullable = false)
  private String ville;

  @Column(name = "tenant_id", nullable = false, unique = true, updatable = false)
  private String tenantId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, columnDefinition = "VARCHAR(20)")
  private StatutEntreprise statut;

  @Column(name = "date_inscription", nullable = false)
  private LocalDateTime dateInscription;

  @Column(name = "date_validation")
  private LocalDateTime dateValidation;

  // 🚀 NOUVEAU : Les permissions autorisées pour cette entreprise globale
  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(
    name = "entreprise_permissions",
    joinColumns = @JoinColumn(name = "entreprise_id"),
    inverseJoinColumns = @JoinColumn(name = "permission_id")
  )
  private Set<Permission> permissions = new HashSet<>();

  public Entreprise() {
    this.statut = StatutEntreprise.EN_ATTENTE;
    this.dateInscription = LocalDateTime.now();
  }

  public Entreprise(String nom, String matriculeFiscale, String email, String password,
                    String telephone, String gouvernorat, String ville) {
    this();
    this.nom = nom;
    this.matriculeFiscale = matriculeFiscale;
    this.email = email;
    this.password = password;
    this.telephone = telephone;
    this.gouvernorat = gouvernorat;
    this.ville = ville;
  }

  @PrePersist
  protected void onCreate() {
    if (this.dateInscription == null) {
      this.dateInscription = LocalDateTime.now();
    }
    if (this.statut == null) {
      this.statut = StatutEntreprise.EN_ATTENTE;
    }
    if (this.tenantId == null || this.tenantId.isBlank()) {
      this.tenantId = UUID.randomUUID().toString();
    }
  }

  public enum StatutEntreprise {
    EN_ATTENTE, ACTIVE, REFUSE
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getNom() { return nom; }
  public void setNom(String nom) { this.nom = nom; }
  public String getMatriculeFiscale() { return matriculeFiscale; }
  public void setMatriculeFiscale(String matriculeFiscale) { this.matriculeFiscale = matriculeFiscale; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }
  public String getTelephone() { return telephone; }
  public void setTelephone(String telephone) { this.telephone = telephone; }
  public String getGouvernorat() { return gouvernorat; }
  public void setGouvernorat(String gouvernorat) { this.gouvernorat = gouvernorat; }
  public String getVille() { return ville; }
  public void setVille(String ville) { this.ville = ville; }
  public StatutEntreprise getStatut() { return statut; }
  public void setStatut(StatutEntreprise statut) { this.statut = statut; }
  public LocalDateTime getDateInscription() { return dateInscription; }
  public void setDateInscription(LocalDateTime dateInscription) { this.dateInscription = dateInscription; }
  public LocalDateTime getDateValidation() { return dateValidation; }
  public void setDateValidation(LocalDateTime dateValidation) { this.dateValidation = dateValidation; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }

  // 🚀 Getters/Setters pour les permissions
  public Set<Permission> getPermissions() { return permissions; }
  public void setPermissions(Set<Permission> permissions) { this.permissions = permissions; }
}
