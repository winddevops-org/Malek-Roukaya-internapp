package com.tonentreprise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DimensionDTO {
    private String fieldName;
    private Integer positionX;
    private Integer positionY;
    private Integer width;
    private Integer height;
}
