package com.tonentreprise.backend.repository;

import com.tonentreprise.backend.model.ModelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModelTypeRepository extends JpaRepository<ModelType, Long> {
  // 🔥 Important : recherche unique sur les deux colonnes
  List<ModelType> findByTenantId(String tenantId);
  Optional<ModelType> findByNameAndTenantId(String name, String tenantId);
}
