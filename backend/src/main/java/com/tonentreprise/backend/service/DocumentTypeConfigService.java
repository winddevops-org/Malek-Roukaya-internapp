package com.tonentreprise.backend.service;

import com.tonentreprise.backend.dto.TypeConfigDTO;
import com.tonentreprise.backend.dto.TypeFieldDTO;
import com.tonentreprise.backend.model.DocumentTypeConfig;
import com.tonentreprise.backend.model.DocumentTypeField;
import com.tonentreprise.backend.model.ModelType;
import com.tonentreprise.backend.repository.DocumentTypeConfigRepository;
import com.tonentreprise.backend.repository.ModelTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DocumentTypeConfigService {

  @Autowired
  private DocumentTypeConfigRepository configRepository;

  @Autowired
  private ModelTypeRepository modelTypeRepository;

  @Transactional(readOnly = true)
  public TypeConfigDTO getConfigForType(Long typeId) {
    ModelType type = modelTypeRepository.findById(typeId)
      .orElseThrow(() -> new RuntimeException("Type non trouvé"));

    Optional<DocumentTypeConfig> optConfig = configRepository.findByModelType(type);

    if (optConfig.isEmpty()) {
      return new TypeConfigDTO(type.getId(), List.of());
    }

    DocumentTypeConfig config = optConfig.get();

    List<TypeFieldDTO> fields = config.getFields().stream()
      .sorted(Comparator.comparing(f -> f.getFieldOrder() != null ? f.getFieldOrder() : Integer.MAX_VALUE))
      .map(f -> new TypeFieldDTO(
        f.getId(),
        f.getFieldName(),
        f.getFieldOrder(),
        f.getFieldType(),
        f.getTableColumns()
      ))
      .collect(Collectors.toList());

    return new TypeConfigDTO(type.getId(), fields);
  }

  @Transactional
  public TypeConfigDTO saveConfigForType(Long typeId, TypeConfigDTO dto) {
    ModelType type = modelTypeRepository.findById(typeId)
      .orElseThrow(() -> new RuntimeException("Type non trouvé"));

    DocumentTypeConfig config = configRepository.findByModelType(type)
      .orElseGet(() -> {
        DocumentTypeConfig c = new DocumentTypeConfig();
        c.setModelType(type);
        return c;
      });

    config.getFields().clear();
    config = configRepository.save(config);

    int order = 1;
    for (TypeFieldDTO fieldDto : dto.getFields()) {
      if (fieldDto.getFieldName() == null || fieldDto.getFieldName().isBlank()) continue;

      DocumentTypeField field = new DocumentTypeField();
      field.setFieldName(fieldDto.getFieldName().trim());
      field.setFieldOrder(fieldDto.getFieldOrder() != null ? fieldDto.getFieldOrder() : order++);

      field.setFieldType(fieldDto.getFieldType() != null ? fieldDto.getFieldType() : "text");
      field.setTableColumns(fieldDto.getTableColumns());

      field.setConfig(config);
      config.getFields().add(field);
    }

    DocumentTypeConfig saved = configRepository.save(config);

    List<TypeFieldDTO> resultFields = saved.getFields().stream()
      .sorted(Comparator.comparing(f -> f.getFieldOrder() != null ? f.getFieldOrder() : Integer.MAX_VALUE))
      .map(f -> new TypeFieldDTO(
        f.getId(),
        f.getFieldName(),
        f.getFieldOrder(),
        f.getFieldType(),
        f.getTableColumns()
      ))
      .collect(Collectors.toList());

    return new TypeConfigDTO(type.getId(), resultFields);
  }
}
