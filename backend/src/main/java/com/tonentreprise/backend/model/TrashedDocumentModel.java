package com.tonentreprise.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "trashed_document_models")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrashedDocumentModel {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "original_model_id", nullable = false)
  private Long originalModelId;

  @Column(nullable = false)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "type_id", nullable = false)
  private ModelType modelType;

  // ✅ NOUVEAU : tenant du modèle placé en corbeille
  @Column(name = "tenant_id", nullable = false)
  private String tenantId;

  // ✅ PAS de @Lob avec PostgreSQL ici
  @Column(name = "fields_json", columnDefinition = "TEXT")
  private String fieldsJson;

  @Column(name = "deleted_at", nullable = false)
  private LocalDateTime deletedAt;

  @Column(name = "delete_after", nullable = false)
  private LocalDateTime deleteAfter;
}
