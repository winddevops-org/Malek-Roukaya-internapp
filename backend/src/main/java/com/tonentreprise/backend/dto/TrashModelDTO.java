package com.tonentreprise.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrashModelDTO {
    private Long id;
    private String name;
    private Long typeId;
    private String typeName;
    private String typeLabel;
    private LocalDateTime deletedAt;
    private LocalDateTime deleteAfter;
}
