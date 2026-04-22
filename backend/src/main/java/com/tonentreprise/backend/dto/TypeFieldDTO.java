package com.tonentreprise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypeFieldDTO {
    private Long id;
    private String fieldName;
    private Integer fieldOrder;
    private String fieldType;    // IMPORTANT : Permet de savoir si c'est un tableau
    private String tableColumns; // IMPORTANT : Contient les colonnes du tableau
}
