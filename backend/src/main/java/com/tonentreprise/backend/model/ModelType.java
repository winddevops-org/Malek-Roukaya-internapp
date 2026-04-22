package com.tonentreprise.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
// 🔥 Ajout de la contrainte d'unicité name+tenantId
@Table(
  name = "model_types",
  uniqueConstraints = @UniqueConstraint(columnNames = {"name", "tenant_id"})
)
public class ModelType {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String label;

  // ✅ Spécifique à chaque entreprise
  @Column(name = "tenant_id", nullable = false)
  private String tenantId;

  @OneToMany(mappedBy = "modelType", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonIgnore
  private List<DocumentModel> documentModels = new ArrayList<>();

  @OneToMany(mappedBy = "modelType", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonIgnore
  private List<RealDocument> realDocuments = new ArrayList<>();

  @OneToMany(mappedBy = "modelType", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonIgnore
  private List<DocumentTypeConfig> configs = new ArrayList<>();

  @OneToMany(mappedBy = "modelType", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonIgnore
  private List<TrashedDocumentModel> trashedDocuments = new ArrayList<>();

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt = LocalDateTime.now();
}
