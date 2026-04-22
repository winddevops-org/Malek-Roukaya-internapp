package com.tonentreprise.backend.service;

import com.tonentreprise.backend.dto.TrashModelDTO;
import com.tonentreprise.backend.model.DocumentModel;
import com.tonentreprise.backend.model.ModelField;
import com.tonentreprise.backend.model.ModelType;
import com.tonentreprise.backend.model.TrashedDocumentModel;
import com.tonentreprise.backend.repository.DocumentModelRepository;
import com.tonentreprise.backend.repository.ModelFieldRepository;
import com.tonentreprise.backend.repository.ModelTypeRepository;
import com.tonentreprise.backend.repository.TrashedDocumentModelRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DocumentModelService {

  @Autowired
  private DocumentModelRepository documentModelRepository;

  @Autowired
  private ModelTypeRepository modelTypeRepository;

  @Autowired
  private ModelFieldRepository modelFieldRepository;

  @Autowired
  private TrashedDocumentModelRepository trashedRepository;

  @Autowired
  private ObjectMapper objectMapper;

  // ✅ typeId + tenantId
  @Transactional
  public DocumentModel createModel(Long typeId, String tenantId, DocumentModel model) {
    ModelType type = modelTypeRepository.findById(typeId)
      .orElseThrow(() -> new RuntimeException("Type non trouvé"));

    if (tenantId == null || tenantId.isBlank()) {
      throw new RuntimeException("tenantId est obligatoire pour créer un modèle");
    }

    model.setModelType(type);
    model.setTenantId(tenantId);
    model.setCreatedAt(LocalDateTime.now());
    model.setUpdatedAt(LocalDateTime.now());

    DocumentModel savedModel = documentModelRepository.save(model);

    if (model.getFields() != null && !model.getFields().isEmpty()) {
      for (ModelField field : model.getFields()) {
        field.setDocumentModel(savedModel);
        field.setCreatedAt(LocalDateTime.now());
        modelFieldRepository.save(field);
      }
    }

    return savedModel;
  }

  @Transactional
  public DocumentModel updateModel(Long id, DocumentModel updatedModel, String tenantId) {
    try {
      DocumentModel existingModel = documentModelRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Modèle non trouvé"));

      // ✅ sécurité : on ne met à jour que dans le même tenant
      if (tenantId != null && !tenantId.isBlank() &&
        !tenantId.equals(existingModel.getTenantId())) {
        throw new RuntimeException("Accès non autorisé à ce modèle");
      }

      existingModel.setName(updatedModel.getName());
      existingModel.setUpdatedAt(LocalDateTime.now());

      if (existingModel.getFields() != null) {
        existingModel.getFields().clear();
      }

      if (updatedModel.getFields() != null && !updatedModel.getFields().isEmpty()) {
        for (ModelField field : updatedModel.getFields()) {
          field.setId(null);
          field.setDocumentModel(existingModel);
          field.setCreatedAt(LocalDateTime.now());
          existingModel.getFields().add(field);
          modelFieldRepository.save(field);
        }
      }

      return documentModelRepository.save(existingModel);
    } catch (Exception e) {
      e.printStackTrace();
      throw e;
    }
  }

  public DocumentModel getModelById(Long id) {
    return documentModelRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Modèle non trouvé"));
  }

  // ✅ tous les modèles d’un tenant
  public List<DocumentModel> getAllModelsByTenant(String tenantId) {
    if (tenantId == null || tenantId.isBlank()) {
      throw new RuntimeException("tenantId est obligatoire");
    }
    return documentModelRepository.findByTenantId(tenantId);
  }

  // ⚠️ méthode existante conservée pour usages internes éventuels
  public List<DocumentModel> getAllModels() {
    return documentModelRepository.findAll();
  }

  public List<ModelType> getAllTypes() {
    return modelTypeRepository.findAll();
  }

  // ✅ modèles par type + tenant
  public List<DocumentModel> getModelsByType(Long typeId, String tenantId) {
    if (tenantId == null || tenantId.isBlank()) {
      throw new RuntimeException("tenantId est obligatoire");
    }
    return documentModelRepository.findByModelTypeIdAndTenantId(typeId, tenantId);
  }

  // ====== CORBEILLE ======

  @Transactional
  public void deleteModel(Long id, String tenantId) {
    DocumentModel model = documentModelRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Modèle non trouvé"));

    if (tenantId != null && !tenantId.isBlank() &&
      !tenantId.equals(model.getTenantId())) {
      throw new RuntimeException("Accès non autorisé à ce modèle");
    }

    try {
      String fieldsJson = objectMapper.writeValueAsString(model.getFields());

      TrashedDocumentModel trashed = new TrashedDocumentModel();
      trashed.setOriginalModelId(model.getId());
      trashed.setName(model.getName());
      trashed.setModelType(model.getModelType());
      trashed.setFieldsJson(fieldsJson);
      trashed.setDeletedAt(LocalDateTime.now());
      trashed.setDeleteAfter(LocalDateTime.now().plusDays(5));
      trashed.setTenantId(model.getTenantId()); // ✅ on garde le tenant

      trashedRepository.save(trashed);

      documentModelRepository.delete(model);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Erreur sérialisation des champs", e);
    }
  }

  // ✅ corbeille pour un tenant
  public List<TrashModelDTO> getTrashedModels(String tenantId) {
    try {
      if (tenantId == null || tenantId.isBlank()) {
        throw new RuntimeException("tenantId est obligatoire");
      }

      List<TrashedDocumentModel> rows =
        trashedRepository.findAllByTenantIdOrderByDeletedAtDesc(tenantId);

      return rows.stream().map(t -> {
        Long typeId = null;
        String typeName = null;
        String typeLabel = null;

        if (t.getModelType() != null) {
          typeId = t.getModelType().getId();
          typeName = t.getModelType().getName();
          typeLabel = t.getModelType().getLabel();
        }

        return new TrashModelDTO(
          t.getId(),
          t.getName(),
          typeId,
          typeName,
          typeLabel,
          t.getDeletedAt(),
          t.getDeleteAfter()
        );
      }).toList();
    } catch (Exception e) {
      e.printStackTrace();
      throw new RuntimeException("Erreur getTrashedModels: " + e.getMessage(), e);
    }
  }

  @Transactional
  public void restoreModel(Long trashId, String tenantId) {
    TrashedDocumentModel trashed = trashedRepository.findById(trashId)
      .orElseThrow(() -> new RuntimeException("Élément corbeille non trouvé"));

    if (tenantId != null && !tenantId.isBlank() &&
      !tenantId.equals(trashed.getTenantId())) {
      throw new RuntimeException("Accès non autorisé à la corbeille");
    }

    DocumentModel restored = new DocumentModel();
    restored.setName(trashed.getName());
    restored.setModelType(trashed.getModelType());
    restored.setTenantId(trashed.getTenantId());
    restored.setCreatedAt(LocalDateTime.now());
    restored.setUpdatedAt(LocalDateTime.now());

    DocumentModel saved = documentModelRepository.save(restored);

    try {
      if (trashed.getFieldsJson() != null && !trashed.getFieldsJson().isBlank()) {
        ModelField[] fields = objectMapper.readValue(trashed.getFieldsJson(), ModelField[].class);
        for (ModelField f : fields) {
          f.setId(null);
          f.setDocumentModel(saved);
          f.setCreatedAt(LocalDateTime.now());
          modelFieldRepository.save(f);
        }
      }
    } catch (Exception e) {
      throw new RuntimeException("Erreur restauration des champs", e);
    }

    trashedRepository.deleteById(trashId);
  }

  @Transactional
  public void hardDeleteTrashedModel(Long trashId, String tenantId) {
    TrashedDocumentModel trashed = trashedRepository.findById(trashId)
      .orElseThrow(() -> new RuntimeException("Élément corbeille non trouvé"));

    if (tenantId != null && !tenantId.isBlank() &&
      !tenantId.equals(trashed.getTenantId())) {
      throw new RuntimeException("Accès non autorisé à la corbeille");
    }

    trashedRepository.delete(trashed);
  }

  public void purgeExpiredTrash() {
    List<TrashedDocumentModel> expired =
      trashedRepository.findByDeleteAfterBefore(LocalDateTime.now());
    trashedRepository.deleteAll(expired);
  }
}
