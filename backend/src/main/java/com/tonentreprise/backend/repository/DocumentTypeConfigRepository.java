package com.tonentreprise.backend.repository;

import com.tonentreprise.backend.model.DocumentTypeConfig;
import com.tonentreprise.backend.model.ModelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentTypeConfigRepository extends JpaRepository<DocumentTypeConfig, Long> {

    // Une config par type (au moins pour l'instant)
    Optional<DocumentTypeConfig> findByModelType(ModelType modelType);
}
