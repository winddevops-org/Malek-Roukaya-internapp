package com.tonentreprise.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;

@Entity
@Table(name = "model_fields")
@Data
public class ModelField {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "field_id")
  private String fieldId;

  @Column(nullable = false)
  private String type;

  private String label;
  private String placeholder;

  @Column(name = "document_key")
  private String documentKey;

  @Column(columnDefinition = "TEXT")
  private String value;

  private Double x;
  private Double y;
  private Double width;
  private Double height;

  private Boolean bold;
  private Boolean italic;
  private Boolean underline;
  private Boolean boxed;
  private Double fontSize;

  // ===== NOUVEAU : style pour shape-rect (et potentiellement d'autres) =====
  @Column(name = "border_color")
  private String borderColor;      // ex: "#0f172a"

  @Column(name = "border_width")
  private Double borderWidth;      // ex: 1, 2, 3 (px)

  @Column(name = "border_style")
  private String borderStyle;      // "solid", "dashed", "dotted"

  @Column(name = "background_color")
  private String backgroundColor;  // ex: "#ffffff" ou "transparent"

  @Column(name = "border_radius")
  private Double borderRadius;     // px pour arrondir les coins

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(columnDefinition = "TEXT")
  private String tableConfig;

  @ManyToOne
  @JoinColumn(name = "document_model_id", nullable = false)
  @JsonBackReference(value = "model-fields")
  private DocumentModel documentModel;

  @PrePersist
  public void prePersist() {
    this.createdAt = LocalDateTime.now();
  }
}
