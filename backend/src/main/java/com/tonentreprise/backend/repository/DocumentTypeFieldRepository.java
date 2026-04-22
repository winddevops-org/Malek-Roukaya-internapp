package com.tonentreprise.backend.repository;

import com.tonentreprise.backend.model.DocumentTypeField;
import com.tonentreprise.backend.model.DocumentTypeConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentTypeFieldRepository extends JpaRepository<DocumentTypeField, Long> {

    List<DocumentTypeField> findByConfig(DocumentTypeConfig config);
}
