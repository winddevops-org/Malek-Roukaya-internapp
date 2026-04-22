package com.tonentreprise.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "document_models")
@SuppressWarnings("JpaAttributeNameIsNotFound") // ✅ Ajoute ça ICI
public class DocumentModel {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "type_id", nullable = false)
  private ModelType modelType;

  @OneToMany(mappedBy = "documentModel", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private List<ModelField> fields = new ArrayList<>();

  // ✅ NOUVEAU : rattacher le modèle à un tenant
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
