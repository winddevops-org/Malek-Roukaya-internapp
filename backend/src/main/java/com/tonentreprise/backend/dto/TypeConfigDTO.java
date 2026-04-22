package com.tonentreprise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypeConfigDTO {

    private Long typeId;               // id de ModelType
    private List<TypeFieldDTO> fields; // liste des champs
}
