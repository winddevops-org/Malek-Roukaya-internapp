package com.tonentreprise.backend.service;

import com.tonentreprise.backend.model.FieldDimensions;
import com.tonentreprise.backend.repository.FieldDimensionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FieldDimensionsService {

  @Autowired
  private FieldDimensionsRepository repository;

  public FieldDimensions saveDimensions(String fieldName, String userId,
                                        Integer x, Integer y,
                                        Integer width, Integer height) {
    FieldDimensions dimensions = repository
      .findByFieldNameAndUserId(fieldName, userId)
      .orElse(new FieldDimensions());

    dimensions.setFieldName(fieldName);
    dimensions.setUserId(userId);
    dimensions.setPositionX(x);
    dimensions.setPositionY(y);
    dimensions.setWidth(width);
    dimensions.setHeight(height);

    return repository.save(dimensions);
  }

  public List<FieldDimensions> getAllDimensions(String userId) {
    return repository.findAllByUserId(userId);
  }

  public FieldDimensions getDimension(String fieldName, String userId) {
    return repository.findByFieldNameAndUserId(fieldName, userId)
      .orElseThrow(() -> new RuntimeException("Dimension non trouvée"));
  }

  public void deleteDimension(String fieldName, String userId) {
    repository.deleteByFieldNameAndUserId(fieldName, userId);
  }
}
