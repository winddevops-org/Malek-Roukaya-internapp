package com.tonentreprise.backend.repository;

import com.tonentreprise.backend.model.TrashedDocumentModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TrashedDocumentModelRepository extends JpaRepository<TrashedDocumentModel, Long> {

  List<TrashedDocumentModel> findAllByOrderByDeletedAtDesc();

  List<TrashedDocumentModel> findByDeleteAfterBefore(LocalDateTime now);

  // ✅ NOUVEAU : corbeille par tenant
  List<TrashedDocumentModel> findAllByTenantIdOrderByDeletedAtDesc(String tenantId);

  List<TrashedDocumentModel> findByTenantIdAndDeleteAfterBefore(String tenantId, LocalDateTime now);
}
