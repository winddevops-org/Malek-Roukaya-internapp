package com.tonentreprise.backend.repository;

import com.tonentreprise.backend.model.FieldDimensions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface FieldDimensionsRepository extends JpaRepository<FieldDimensions, Long> {
    Optional<FieldDimensions> findByFieldNameAndUserId(String fieldName, String userId);
    List<FieldDimensions> findAllByUserId(String userId);
    void deleteByFieldNameAndUserId(String fieldName, String userId);
}
