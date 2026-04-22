package com.tonentreprise.backend.service;

import com.tonentreprise.backend.dto.RealDocumentDto;
import com.tonentreprise.backend.model.ModelType;
import com.tonentreprise.backend.model.RealDocument;
import com.tonentreprise.backend.repository.ModelTypeRepository;
import com.tonentreprise.backend.repository.RealDocumentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class RealDocumentService {

  private final RealDocumentRepository documentRepository;
  private final ModelTypeRepository modelTypeRepository;
  private final ObjectMapper objectMapper;

  public RealDocumentService(RealDocumentRepository documentRepository,
                             ModelTypeRepository modelTypeRepository,
                             ObjectMapper objectMapper) {
    this.documentRepository = documentRepository;
    this.modelTypeRepository = modelTypeRepository;
    this.objectMapper = objectMapper;
  }

  public RealDocumentDto create(RealDocumentDto dto, String tenantId) throws JsonProcessingException {
    if (tenantId == null || tenantId.isBlank()) {
      throw new RuntimeException("tenantId est obligatoire pour créer un document réel");
    }

    ModelType type = modelTypeRepository.findById(dto.getTypeId())
      .orElseThrow(() -> new RuntimeException("Type introuvable"));

    RealDocument entity = new RealDocument();
    entity.setModelType(type);
    entity.setName(dto.getName());
    entity.setTenantId(tenantId); // ✅ Affectation du tenantId
    entity.setCreatedAt(LocalDateTime.now());
    entity.setUpdatedAt(LocalDateTime.now());

    Map<String, Object> data = dto.getData() != null ? dto.getData() : new HashMap<>();
    entity.setDataJson(objectMapper.writeValueAsString(data));

    RealDocument saved = documentRepository.save(entity);
    return toDto(saved);
  }

  // ✅ NOUVEAU : Récupération isolée
  public List<RealDocumentDto> getByTypeIdAndTenantId(Long typeId, String tenantId) {
    if (tenantId == null || tenantId.isBlank()) {
      throw new RuntimeException("tenantId est obligatoire");
    }
    return documentRepository.findByModelType_IdAndTenantId(typeId, tenantId)
      .stream()
      .map(this::toDto)
      .toList();
  }

  // ✅ NOUVEAU : Suppression sécurisée
  public void delete(Long id, String tenantId) {
    RealDocument document = documentRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new RuntimeException("Document introuvable ou accès non autorisé"));
    documentRepository.delete(document);
  }

  private RealDocumentDto toDto(RealDocument entity) {
    RealDocumentDto dto = new RealDocumentDto();
    dto.setId(entity.getId());
    dto.setTypeId(entity.getModelType() != null ? entity.getModelType().getId() : null);
    dto.setTypeName(entity.getModelType() != null ? entity.getModelType().getName() : null);
    dto.setName(entity.getName());
    dto.setTenantId(entity.getTenantId()); // ✅ Ajout du tenantId dans le DTO
    dto.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
    dto.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null);

    try {
      Map<String, Object> data = entity.getDataJson() != null
        ? objectMapper.readValue(entity.getDataJson(), new TypeReference<Map<String, Object>>() {})
        : new HashMap<>();
      dto.setData(data);
    } catch (JsonProcessingException e) {
      dto.setData(new HashMap<>());
    }
    return dto;
  }
}
