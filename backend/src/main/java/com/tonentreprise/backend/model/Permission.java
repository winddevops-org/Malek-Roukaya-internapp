// src/main/java/com/tonentreprise/backend/model/Permission.java
package com.tonentreprise.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
  name = "permissions",
  uniqueConstraints = {
    @UniqueConstraint(columnNames = {"code"})
  }
)
public class Permission {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // ex: "LIRE", "MODIFIER", "SUPPRIMER", "VALIDER_FACTURE"
  @Column(nullable = false, length = 100, unique = true)
  private String code;

  // ex: "Lire", "Modifier", "Supprimer", "Valider une facture"
  @Column(nullable = false, length = 150)
  private String label;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt = LocalDateTime.now();

  @JsonIgnore
  @ManyToMany(mappedBy = "permissions")
  private Set<User> users = new HashSet<>();

  // Getters / setters

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }

  public String getLabel() { return label; }
  public void setLabel(String label) { this.label = label; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public Set<User> getUsers() { return users; }
  public void setUsers(Set<User> users) { this.users = users; }
}
