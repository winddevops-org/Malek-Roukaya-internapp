package com.tonentreprise.backend.repository;

import com.tonentreprise.backend.model.DocumentModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentModelRepository extends JpaRepository<DocumentModel, Long> {

  List<DocumentModel> findByModelTypeId(Long typeId);

  List<DocumentModel> findByModelTypeName(String typeName);

  // ✅ NOUVEAU : par tenant
  List<DocumentModel> findByTenantId(String tenantId);

  List<DocumentModel> findByModelTypeIdAndTenantId(Long typeId, String tenantId);
}
