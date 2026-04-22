package com.tonentreprise.backend.service;

import com.tonentreprise.backend.model.ModelField;
import com.tonentreprise.backend.repository.ModelFieldRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ModelFieldService {

    @Autowired
    private ModelFieldRepository repository;

    public List<ModelField> getFieldsByDocumentModelId(Long documentModelId) {
        return repository.findByDocumentModelId(documentModelId);
    }

    public ModelField getFieldById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Champ non trouvé"));
    }

    public ModelField createField(ModelField field) {
        return repository.save(field);
    }

    public ModelField updateField(Long id, ModelField field) {
        ModelField existing = getFieldById(id);

        existing.setFieldId(field.getFieldId());
        existing.setType(field.getType());
        existing.setLabel(field.getLabel());
        existing.setPlaceholder(field.getPlaceholder());
        existing.setDocumentKey(field.getDocumentKey());
        existing.setValue(field.getValue());

        existing.setX(field.getX());
        existing.setY(field.getY());
        existing.setWidth(field.getWidth());
        existing.setHeight(field.getHeight());

        existing.setBold(field.getBold());
        existing.setItalic(field.getItalic());
        existing.setUnderline(field.getUnderline());
        existing.setBoxed(field.getBoxed());
        existing.setFontSize(field.getFontSize());

        // ===== NOUVEAU : style shape-rect =====
        existing.setBorderColor(field.getBorderColor());
        existing.setBorderWidth(field.getBorderWidth());
        existing.setBorderStyle(field.getBorderStyle());
        existing.setBackgroundColor(field.getBackgroundColor());
        existing.setBorderRadius(field.getBorderRadius());

        // tableConfig reste tel quel si tu veux l’exposer ici aussi
        existing.setTableConfig(field.getTableConfig());

        return repository.save(existing);
    }

    public void deleteField(Long id) {
        repository.deleteById(id);
    }
}
