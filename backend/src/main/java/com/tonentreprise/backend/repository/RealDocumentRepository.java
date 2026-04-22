package com.tonentreprise.backend.repository;

import com.tonentreprise.backend.model.RealDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RealDocumentRepository extends JpaRepository<RealDocument, Long> {

  // ✅ NOUVEAU : Recherche par type ET par tenant
  List<RealDocument> findByModelType_IdAndTenantId(Long typeId, String tenantId);

  // ✅ NOUVEAU : Récupération sécurisée d'un document par son id et son tenant
  Optional<RealDocument> findByIdAndTenantId(Long id, String tenantId);
}
