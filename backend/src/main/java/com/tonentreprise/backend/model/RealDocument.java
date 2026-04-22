package com.tonentreprise.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "real_documents")
public class RealDocument {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // Type de document : facture, attestation, etc. (référence à ModelType)
  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "type_id", nullable = false)
  private ModelType modelType;

  @Column(nullable = false)
  private String name; // Nom de la facture : "Facture F-2026-001"

  // Données réelles sous forme de JSON (clé = nom du champ, valeur = donnée)
  @Column(name = "data_json", columnDefinition = "TEXT")
  private String dataJson;

  // ✅ NOUVEAU : isolation par tenant
  @Column(name = "tenant_id", nullable = false)
  private String tenantId;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt = LocalDateTime.now();

  @Column(name = "updated_at")
  private LocalDateTime updatedAt = LocalDateTime.now();

  @PreUpdate
  public void preUpdate() {
    this.updatedAt = LocalDateTime.now();
  }
}
