import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelCardComponent, ModelItem } from '../model-card/model-card.component';
import { ModelEditorComponent, ModelField } from '../model-editor/model-editor.component';
import { ModelViewerComponent, ModelData } from '../model-viewer/model-viewer.component';

@Component({
  selector: 'app-models-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModelCardComponent,
    ModelEditorComponent,
    ModelViewerComponent
  ],
  templateUrl: './models-list.component.html',
  styleUrls: ['./models-list.component.scss']
})
export class ModelsListComponent {
  @Input() modelType: string = '';

  models: ModelItem[] = [];
  filteredModels: ModelItem[] = [];

  // --- Création ---
  showPopup = false;
  newModelName = '';
  showError = false;

  // --- Renommage ---
  showRenamePopup = false;
  renamingModel: ModelItem | null = null;
  renameModelName = '';
  showRenameError = false;

  // --- Edition ---
  showEditor = false;
  editingModel: ModelItem | null = null;
  editingModelName = '';
  editingModelType = '';
  editingModelFields: ModelField[] = [];

  // --- Viewer ---
  showViewer = false;
  viewingModel: ModelData | null = null;

  private nextId = 1;

  ngOnChanges() {
    this.filteredModels = this.models.filter(m => m.type === this.modelType);
  }

  // ===== Création =====
  openCreatePopup() {
    this.showPopup = true;
    this.newModelName = '';
    this.showError = false;
  }

  closePopup() {
    this.showPopup = false;
    this.showError = false;
  }

  closeOnOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
      this.closePopup();
    }
  }

  confirmCreate() {
    if (!this.newModelName.trim()) {
      this.showError = true;
      return;
    }
    const today = new Date();
    const newModel: ModelItem = {
      id: this.nextId++,
      name: this.newModelName.trim(),
      type: this.modelType,
      updatedAt: today.toISOString()
    };
    this.models.push(newModel);
    this.filteredModels.push(newModel);
    this.closePopup();
  }

  // ===== Renommage =====
  onRename(model: ModelItem) {
    this.renamingModel = model;
    this.renameModelName = model.name;
    this.showRenamePopup = true;
    this.showRenameError = false;
  }

  closeRenamePopup() {
    this.showRenamePopup = false;
    this.showRenameError = false;
  }

  closeOnOverlayRename(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
      this.closeRenamePopup();
    }
  }

  confirmRename() {
    if (!this.renameModelName.trim()) {
      this.showRenameError = true;
      return;
    }
    if (this.renamingModel) {
      this.renamingModel.name = this.renameModelName.trim();
    }
    this.closeRenamePopup();
  }

  // ===== Edition =====
  onEdit(model: ModelItem) {
    this.editingModel = model;
    this.editingModelName = model.name;
    this.editingModelType = model.type;
    this.editingModelFields = [];
    this.showEditor = true;
  }

  onEditorClose() {
    this.showEditor = false;
    this.editingModel = null;
  }

  onEditorSave(updatedModel: { name: string; type: string; fields: ModelField[] }) {
    if (this.editingModel) {
      this.editingModel.name = updatedModel.name;
      this.editingModel.type = updatedModel.type;
      this.editingModelFields = [...updatedModel.fields];
    }
    this.showEditor = false;
  }

  // ===== Viewer =====
  onView(model: ModelItem) {
    this.viewingModel = {
      id: model.id,
      name: model.name,
      type: model.type,
      updatedAt: model.updatedAt,
      fields: []
    };
    this.showViewer = true;
  }

  onViewerClose() {
    this.showViewer = false;
    this.viewingModel = null;
  }

  // ===== Suppression =====
  onDelete(model: ModelItem) {
    this.models = this.models.filter(m => m.id !== model.id);
    this.filteredModels = this.filteredModels.filter(m => m.id !== model.id);
  }
}