package com.tonentreprise.backend.controller;

import com.tonentreprise.backend.model.FieldDimensions;
import com.tonentreprise.backend.dto.DimensionDTO;
import com.tonentreprise.backend.service.FieldDimensionsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/field-dimensions")
@CrossOrigin(origins = "http://localhost:4200")
public class FieldDimensionsController {

  @Autowired
  private FieldDimensionsService service;

  @PostMapping("/save")
  public ResponseEntity<?> saveDimensions(@RequestBody DimensionDTO dto,
                                          @RequestParam String userId) {
    FieldDimensions result = service.saveDimensions(
      dto.getFieldName(),
      userId,
      dto.getPositionX(),
      dto.getPositionY(),
      dto.getWidth(),
      dto.getHeight()
    );
    return ResponseEntity.ok(result);
  }

  @GetMapping("/get-all")
  public ResponseEntity<?> getAllDimensions(@RequestParam String userId) {
    List<FieldDimensions> dimensions = service.getAllDimensions(userId);
    return ResponseEntity.ok(dimensions);
  }

  @GetMapping("/{fieldName}")
  public ResponseEntity<?> getDimension(@PathVariable String fieldName,
                                        @RequestParam String userId) {
    FieldDimensions dimension = service.getDimension(fieldName, userId);
    return ResponseEntity.ok(dimension);
  }
}
