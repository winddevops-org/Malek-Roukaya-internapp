package com.tonentreprise.backend.dto;
import lombok.Data;
import java.util.Map;

@Data
public class RealDocumentDto {
  private Long id;
  private Long typeId;
  private String typeName;
  private String name;

  // IMPORTANT : Object permet d'accepter à la fois du texte et des Tableaux !
  private Map<String, Object> data;

  // ✅ NOUVEAU
  private String tenantId;

  private String createdAt;
  private String updatedAt;
}
