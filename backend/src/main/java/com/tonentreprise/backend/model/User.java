package com.tonentreprise.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String nom;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String password;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, columnDefinition = "VARCHAR(20)")
  private Role role = Role.USER;

  @Column(name = "departement")
  private String departement;

  @Column(name = "entreprise_id")
  private Long entrepriseId;

  @Column(name = "tenant_id")
  private String tenantId;

  @ManyToMany
  @JoinTable(
    name = "user_permissions",
    joinColumns = @JoinColumn(name = "user_id"),
    inverseJoinColumns = @JoinColumn(name = "permission_id")
  )
  private Set<Permission> permissions = new HashSet<>();

  @Column(name = "date_creation", nullable = false)
  private LocalDateTime dateCreation;

  public User() {
    this.dateCreation = LocalDateTime.now();
    this.role = Role.USER;
  }

  @PrePersist
  protected void onCreate() {
    if (this.dateCreation == null) {
      this.dateCreation = LocalDateTime.now();
    }
    if (this.role == null) {
      this.role = Role.USER;
    }
  }

  public enum Role {
    USER,
    ADMIN
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getNom() { return nom; }
  public void setNom(String nom) { this.nom = nom; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }
  public Role getRole() { return role; }
  public void setRole(Role role) { this.role = role; }
  public String getDepartement() { return departement; }
  public void setDepartement(String departement) { this.departement = departement; }
  public Long getEntrepriseId() { return entrepriseId; }
  public void setEntrepriseId(Long entrepriseId) { this.entrepriseId = entrepriseId; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public Set<Permission> getPermissions() { return permissions; }
  public void setPermissions(Set<Permission> permissions) { this.permissions = permissions; }
  public LocalDateTime getDateCreation() { return dateCreation; }
  public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
