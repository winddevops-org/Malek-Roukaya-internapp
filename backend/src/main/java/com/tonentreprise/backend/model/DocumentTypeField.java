package com.tonentreprise.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "document_type_fields")
public class DocumentTypeField {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    @Column(name = "field_order")
    private Integer fieldOrder;

    // NOUVEAU : Le type du champ ("text", "date", "table")
    private String fieldType = "text";

    // NOUVEAU : Si c'est un tableau, on stocke les noms des colonnes en JSON (ex: "['Description', 'Quantité', 'Prix']")
    @Column(name = "table_columns", columnDefinition = "TEXT")
    private String tableColumns;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id", nullable = false)
    private DocumentTypeConfig config;
}
