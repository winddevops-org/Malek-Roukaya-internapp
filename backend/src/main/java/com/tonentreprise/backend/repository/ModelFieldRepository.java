package com.tonentreprise.backend.repository;

import com.tonentreprise.backend.model.ModelField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ModelFieldRepository extends JpaRepository<ModelField, Long> {
    List<ModelField> findByDocumentModelId(Long documentModelId);
}
