// src/app/models/models-list/models-list.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { ModelCardComponent, ModelItem } from '../model-card/model-card.component';
import { ModelEditorComponent } from '../model-editor/model-editor.component';
import { ModelViewerComponent, ModelData } from '../model-viewer/model-viewer.component';

import { ModelField, ModelService } from '../../services/model.service';
import { TypeFieldsService } from '../../services/type-fields.service';
import { TypeConfig } from '../interfaces/config/type-config.interface';
import { TypeFieldsDialogComponent } from '../TypeFieldsDialogComponent/type-fields-dialog.component';

import { DocumentFormDialogComponent } from '../DocumentFormDialog/document-form-dialog.component';
import { DocumentService } from '../../services/document.service';
import { DocumentData } from '../interfaces/document-data.interface';
import { DocumentEntity } from '../interfaces/document.interface';

@Component({
  selector: 'app-models-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ModelCardComponent,
    ModelEditorComponent,
    ModelViewerComponent,
    TypeFieldsDialogComponent,
    DocumentFormDialogComponent
  ],
  templateUrl: './models-list.component.html',
  styleUrls: ['./models-list.component.css'],
  providers: [ModelService]
})
export class ModelsListComponent implements OnInit, OnChanges {
  @Input() modelType: string = '';
  currentTypeId: number = 1;

  typeConfig: TypeConfig | null = null;

  models: ModelItem[] = [];
  filteredModels: ModelItem[] = [];
  deletedModel: ModelItem | null = null;
  undoTimeout: any;

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

  // --- Dialog configuration des champs ---
  showTypeFieldsDialog = false;

  // --- Dialog saisie d'un document ---
  showDocumentFormDialog = false;

  // --- Choisir une facture avant "Consulter" ---
  showDocumentChooser = false;
  documentsOfType: DocumentEntity[] = [];
  selectedDocumentId: number | null = null;
  previewingModel: ModelItem | null = null;
  previewDocumentData: DocumentData | null = null;

  // --- Liste des documents ---
  showDocumentsListDialog = false;

  // --- Choix de modèle pour ouvrir un document depuis la liste ---
  showChooseModelDialog = false;
  selectedDocumentForView: DocumentEntity | null = null;
  selectedModelIdForView: number | null = null;

  // --- Suppression Modèle ---
  showDeleteConfirmPopup = false;
  modelToDelete: ModelItem | null = null;

  private tenantId: string | null = null;

  // 🚀 RBAC
  userType: string = '';
  userPermissions: any[] = [];

  // ======================================================
  // OCR / Génération depuis PDF
  // ======================================================
  /** Contrôle l'affichage de la popup OCR */
  showOcrPopup = false;

  /**
   * Étapes du flow OCR :
   *   1 = Upload du PDF
   *   2 = Analyse en cours (loading)
   *   3 = Succès — modèle généré
   *   4 = Erreur
   */
  ocrStep: 1 | 2 | 3 | 4 = 1;

  /** Fichier PDF sélectionné */
  ocrFile: File | null = null;

  /** Nom souhaité pour le modèle à créer */
  ocrModelName = '';

  /** Message d'erreur OCR */
  ocrError = '';

  /** Drag-over state pour la zone de drop */
  ocrDragOver = false;

  /**
   * Étape de progression de l'animation loading :
   *   0 = extraction, 1 = identification, 2 = positionnement
   */
  ocrProgressStep: number = 0;

  /** Résultat renvoyé par l'API OCR */
  ocrResult: {
    fieldsCount: number;
    modelId: number;
    fields: Array<{ label: string; type: string; x: number; y: number; width: number; height: number }>;
  } | null = null;

  /** Référence au timer de simulation d'étapes */
  private ocrStepTimer: any = null;

  constructor(
    private modelService: ModelService,
    private typeFieldsService: TypeFieldsService,
    private documentService: DocumentService,
    public http: HttpClient
  ) {}

  // ===== Cycle de vie =====
  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const entrepriseStr = localStorage.getItem('entreprise');
      const userStr      = localStorage.getItem('user');
      const superAdminStr = localStorage.getItem('superAdmin');

      this.userType = localStorage.getItem('userType') || '';

      if (entrepriseStr && this.userType === 'ENTREPRISE') {
        const ent = JSON.parse(entrepriseStr);
        this.tenantId = ent.tenantId || ent.tenantID || null;
        this.userPermissions = ent.permissions || [];
      } else if (userStr && this.userType === 'USER') {
        const usr = JSON.parse(userStr);
        this.tenantId = usr.tenantId || usr.tenantID || null;
        this.userPermissions = usr.permissions || [];
      } else if (superAdminStr && this.userType === 'SUPER_ADMIN') {
        // Super Admin — tous les droits accordés via hasPermission()
      }
    }

    this.fetchCurrentTypeIdAndLoadModels();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['modelType'] && !changes['modelType'].firstChange) {
      this.fetchCurrentTypeIdAndLoadModels();
    }
  }

  // ===== RBAC =====
  hasPermission(code: string): boolean {
    if (this.userType === 'SUPER_ADMIN') return true;
    if (!this.userPermissions || this.userPermissions.length === 0) return false;
    const search = code.toUpperCase().trim();
    return this.userPermissions.some((p: any) =>
      p.code && p.code.toUpperCase().trim() === search
    );
  }

  // ===== Chargement des modèles =====
  fetchCurrentTypeIdAndLoadModels() {
    if (!this.tenantId) return;

    this.modelService.getTypes(this.tenantId).subscribe({
      next: (types) => {
        const t = types.find(x => x.name === this.modelType);
        if (t && t.id) {
          this.currentTypeId = t.id;
          this.loadTypeConfig();

          this.modelService.getModelsByType(this.currentTypeId, this.tenantId!).subscribe(models => {
            this.models = models.map(m => ({
              id: m.id!,
              name: m.name,
              type: m.modelType?.name || this.modelType,
              updatedAt: m.updatedAt ? new Date(m.updatedAt as any).toISOString() : new Date().toISOString(),
              fields: m.fields || []
            }));
            this.filteredModels = [...this.models];
          });
        }
      },
      error: (err) => console.error('Erreur de récupération des types', err)
    });
  }

  loadTypeConfig() {
    if (!this.currentTypeId) return;
    this.typeFieldsService.getConfig(this.currentTypeId).subscribe(conf => {
      this.typeConfig = conf;
    });
  }

  // ===== Dialog "Définir / Modifier les champs" =====
  openTypeFieldsDialog()  { this.showTypeFieldsDialog = true; }
  onTypeFieldsDialogClosed() {
    this.showTypeFieldsDialog = false;
    this.loadTypeConfig();
  }

  // ===== Dialog "Remplir une facture" =====
  openDocumentFormDialog() { this.showDocumentFormDialog = true; }

  onDocumentFormSubmitted(payload: { name: string; data: DocumentData }) {
    if (!this.currentTypeId || !this.tenantId) return;

    const newDoc: DocumentEntity = {
      typeId: this.currentTypeId,
      typeName: this.modelType,
      name: payload.name,
      data: payload.data
    };

    this.documentService.createDocument(newDoc, this.tenantId).subscribe({
      next: () => {},
      error: (err) => console.error('Erreur lors de la création du document :', err)
    });
  }

  // ===== Voir toutes les factures/documents =====
  openDocumentsListDialog() {
    if (!this.currentTypeId || !this.tenantId) return;
    this.showDocumentsListDialog = true;
    this.documentsOfType = [];

    this.documentService.getDocumentsByType(this.currentTypeId, this.tenantId).subscribe({
      next: (docs) => { this.documentsOfType = docs; },
      error: (err) => console.error('Erreur chargement des documents :', err)
    });
  }

  closeDocumentsListDialog() { this.showDocumentsListDialog = false; }

  onOpenDocument(doc: DocumentEntity) {
    this.selectedDocumentForView = doc;
    this.selectedModelIdForView  = null;
    this.showChooseModelDialog   = true;
  }

  confirmChooseModelForDocument() {
    if (!this.selectedDocumentForView || !this.selectedModelIdForView) return;

    const selectedModel = this.models.find(m => m.id === this.selectedModelIdForView);
    if (!selectedModel) return;

    this.previewDocumentData  = this.selectedDocumentForView.data;
    this.viewingModel = {
      id:        selectedModel.id,
      name:      selectedModel.name,
      type:      selectedModel.type,
      updatedAt: selectedModel.updatedAt,
      fields:    selectedModel.fields || []
    };

    this.showChooseModelDialog   = false;
    this.showDocumentsListDialog = false;
    this.showViewer              = true;
  }

  cancelChooseModelForDocument() {
    this.showChooseModelDialog  = false;
    this.selectedDocumentForView = null;
    this.selectedModelIdForView  = null;
  }

  onDeleteDocument(doc: DocumentEntity) {
    if (!doc.id || !this.tenantId) return;
    this.documentService.deleteDocument(doc.id, this.tenantId).subscribe({
      next: () => {
        this.documentsOfType = this.documentsOfType.filter(d => d.id !== doc.id);
      },
      error: (err) => console.error('Erreur suppression document :', err)
    });
  }

  // ===== Document chooser (Consulter) =====
  confirmDocumentChoice() {
    if (!this.previewingModel || !this.selectedDocumentId) return;

    const doc = this.documentsOfType.find(d => d.id === this.selectedDocumentId);
    if (doc) {
      this.previewDocumentData = doc.data;
      this.viewingModel = {
        id:        this.previewingModel.id,
        name:      this.previewingModel.name,
        type:      this.previewingModel.type,
        updatedAt: this.previewingModel.updatedAt,
        fields:    this.previewingModel.fields || []
      };
      this.showDocumentChooser = false;
      this.showViewer          = true;
    }
  }

  cancelDocumentChoice() {
    this.showDocumentChooser = false;
    this.selectedDocumentId  = null;
    this.previewingModel     = null;
  }

  // ===== Modèles CRUD =====
  openCreatePopup() {
    this.showPopup    = true;
    this.newModelName = '';
    this.showError    = false;
  }

  closePopup() {
    this.showPopup = false;
    this.showError = false;
  }

  confirmCreate() {
    if (!this.newModelName.trim() || !this.tenantId) {
      this.showError = true;
      return;
    }

    this.modelService.createModel(this.newModelName.trim(), this.currentTypeId, this.tenantId).subscribe({
      next: (m) => {
        const newItem: ModelItem = {
          id:        m.id!,
          name:      m.name,
          type:      this.modelType,
          updatedAt: m.updatedAt ? new Date(m.updatedAt as any).toISOString() : new Date().toISOString(),
          fields:    []
        };
        this.models.push(newItem);
        this.filteredModels.push(newItem);
        this.closePopup();
      },
      error: (err) => console.error('Erreur de création de modèle', err)
    });
  }

  onView(model: ModelItem) {
    if (!this.tenantId) return;
    this.previewDocumentData = null;
    this.viewingModel = {
      id:        model.id,
      name:      model.name,
      type:      model.type,
      updatedAt: model.updatedAt,
      fields:    model.fields || []
    };
    this.showViewer = true;
  }

  onViewerClose() {
    this.showViewer          = false;
    this.viewingModel        = null;
    this.previewDocumentData = null;
  }

  onEdit(model: ModelItem) {
    this.editingModel       = model;
    this.editingModelName   = model.name;
    this.editingModelType   = model.type;
    this.editingModelFields = model.fields ? JSON.parse(JSON.stringify(model.fields)) : [];
    this.showEditor         = true;
  }

  onEditorClose() {
    this.showEditor    = false;
    this.editingModel  = null;
  }

  onEditorSave(event: { name: string; type: string; fields: ModelField[] }) {
    if (!this.editingModel || !this.tenantId) return;

    const updatedModel = { id: this.editingModel.id, name: event.name, fields: event.fields };

    this.modelService.updateModel(this.editingModel.id, updatedModel, this.tenantId).subscribe({
      next: (m) => {
        this.editingModel!.name      = m.name;
        this.editingModel!.updatedAt = m.updatedAt ? new Date(m.updatedAt as any).toISOString() : new Date().toISOString();
        this.editingModel!.fields    = m.fields || [];
        this.showEditor   = false;
        this.editingModel = null;
      },
      error: (err) => console.error('Erreur lors de la sauvegarde du modèle', err)
    });
  }

  onRename(model: ModelItem) {
    this.renamingModel     = model;
    this.renameModelName   = model.name;
    this.showRenamePopup   = true;
    this.showRenameError   = false;
  }

  closeRenamePopup() {
    this.showRenamePopup = false;
    this.renamingModel   = null;
    this.showRenameError = false;
  }

  confirmRename() {
    if (!this.renameModelName.trim() || !this.renamingModel || !this.tenantId) {
      this.showRenameError = true;
      return;
    }

    const updated = { id: this.renamingModel.id, name: this.renameModelName.trim() };

    this.modelService.updateModel(this.renamingModel.id, updated, this.tenantId).subscribe({
      next: (m) => {
        this.renamingModel!.name      = m.name;
        this.renamingModel!.updatedAt = m.updatedAt ? new Date(m.updatedAt as any).toISOString() : new Date().toISOString();
        this.closeRenamePopup();
      },
      error: (err) => console.error('Erreur de renommage', err)
    });
  }

  onDelete(model: ModelItem) {
    this.modelToDelete         = model;
    this.showDeleteConfirmPopup = true;
  }

  cancelDelete() {
    this.modelToDelete          = null;
    this.showDeleteConfirmPopup = false;
  }

  confirmDelete() {
    if (!this.modelToDelete || !this.tenantId) return;
    const modelId = this.modelToDelete.id;

    this.modelService.deleteModel(modelId, this.tenantId).subscribe({
      next: () => {
        this.deletedModel       = this.modelToDelete;
        this.models             = this.models.filter(m => m.id !== modelId);
        this.filteredModels     = this.filteredModels.filter(m => m.id !== modelId);
        this.showDeleteConfirmPopup = false;
        this.modelToDelete      = null;

        if (this.undoTimeout) clearTimeout(this.undoTimeout);
        this.undoTimeout = setTimeout(() => { this.deletedModel = null; }, 5000);
      },
      error: (err) => console.error('Erreur de suppression', err)
    });
  }

  undoDelete() {
    if (this.deletedModel && this.tenantId) {
      this.modelService.restoreModel(this.deletedModel.id, this.tenantId).subscribe({
        next: () => {
          this.fetchCurrentTypeIdAndLoadModels();
          this.deletedModel = null;
          if (this.undoTimeout) clearTimeout(this.undoTimeout);
        },
        error: (err) => console.error('Erreur de restauration', err)
      });
    }
  }

  // ===== Overlays =====
  closeOnOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
      this.closePopup();
      this.cancelDocumentChoice();
      this.closeDocumentsListDialog();
      this.cancelChooseModelForDocument();
      this.cancelDelete();
    }
  }

  closeOnOverlayRename(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
      this.closeRenamePopup();
    }
  }

  /** Ferme la popup OCR si clic sur l'overlay (uniquement étapes 1 et 3/4) */
  closeOnOverlayOcr(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
      // Ne pas fermer pendant le chargement (étape 2)
      if (this.ocrStep !== 2) {
        this.closeOcrPopup();
      }
    }
  }

  // ======================================================
  // OCR — Méthodes publiques
  // ======================================================

  /** Ouvre la popup OCR en réinitialisant l'état */
  openOcrPopup() {
    this.showOcrPopup    = true;
    this.ocrStep         = 1;
    this.ocrFile         = null;
    this.ocrModelName    = '';
    this.ocrError        = '';
    this.ocrDragOver     = false;
    this.ocrProgressStep = 0;
    this.ocrResult       = null;
  }

  /** Ferme et réinitialise complètement le flow OCR */
  closeOcrPopup() {
    this.showOcrPopup    = false;
    this.ocrStep         = 1;
    this.ocrFile         = null;
    this.ocrModelName    = '';
    this.ocrError        = '';
    this.ocrDragOver     = false;
    this.ocrProgressStep = 0;
    this.ocrResult       = null;
    if (this.ocrStepTimer) {
      clearTimeout(this.ocrStepTimer);
      this.ocrStepTimer = null;
    }
  }

  /** Réessayer après une erreur */
  retryOcr() {
    this.ocrStep      = 1;
    this.ocrError     = '';
    this.ocrFile      = null;
    this.ocrModelName = '';
  }

  // --- Gestion du fichier ---

  /** Sélection via <input type="file"> */
  onOcrFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this._setOcrFile(input.files[0]);
    }
  }

  /** Drag over */
  onOcrDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.ocrDragOver = true;
  }

  /** Drag leave */
  onOcrDragLeave() {
    this.ocrDragOver = false;
  }

  /** Drop */
  onOcrDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.ocrDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        this.ocrError = 'Seuls les fichiers PDF sont acceptés.';
        return;
      }
      this._setOcrFile(file);
    }
  }

  /** Retire le fichier sélectionné */
  removeOcrFile(event: Event) {
    event.stopPropagation();
    this.ocrFile  = null;
    this.ocrError = '';
  }

  /** Lance l'analyse OCR */
  submitOcr() {
    if (!this.ocrFile || !this.ocrModelName.trim()) return;
    if (!this.tenantId) {
      this.ocrError = 'Session expirée, veuillez vous reconnecter.';
      return;
    }

    // Passage à l'étape loading
    this.ocrStep         = 2;
    this.ocrProgressStep = 0;
    this.ocrError        = '';

    // Simulation d'avancement des étapes (feedback visuel)
    this._animateOcrSteps();

    const formData = new FormData();
    formData.append('pdf', this.ocrFile);
    formData.append('modelName', this.ocrModelName.trim());
    formData.append('typeId', String(this.currentTypeId));
    formData.append('tenantId', this.tenantId);

    this.http.post<any>('/api/models/pdf-ocr', formData).subscribe({
      next: (result) => {
        this._clearOcrStepTimer();
        this.ocrProgressStep = 3; // Toutes les étapes terminées
        this.ocrResult       = result;

        // Ajouter le modèle généré à la liste locale
        if (result && result.modelId) {
          const newItem: ModelItem = {
            id:        result.modelId,
            name:      this.ocrModelName.trim(),
            type:      this.modelType,
            updatedAt: new Date().toISOString(),
            fields:    result.fields || []
          };
          this.models.push(newItem);
          this.filteredModels.push(newItem);
        }

        // Légère pause avant affichage du succès
        setTimeout(() => { this.ocrStep = 3; }, 600);
      },
      error: (err) => {
        this._clearOcrStepTimer();
        console.error('Erreur OCR :', err);
        this.ocrError = err?.error?.message
          || 'L\'analyse a échoué. Vérifiez que le fichier est un PDF lisible et réessayez.';
        this.ocrStep = 4;
      }
    });
  }

  /** Ouvre le modèle généré dans l'éditeur */
  openGeneratedModelInEditor() {
    if (!this.ocrResult?.modelId) { this.closeOcrPopup(); return; }

    const generated = this.models.find(m => m.id === this.ocrResult!.modelId);
    if (generated) {
      this.closeOcrPopup();
      this.onEdit(generated);
    } else {
      this.closeOcrPopup();
    }
  }

  // ======================================================
  // OCR — Méthodes privées
  // ======================================================

  private _setOcrFile(file: File) {
    if (file.type !== 'application/pdf') {
      this.ocrError = 'Seuls les fichiers PDF sont acceptés.';
      return;
    }
    const maxSizeMB = 20;
    if (file.size > maxSizeMB * 1024 * 1024) {
      this.ocrError = `Le fichier dépasse la taille maximale de ${maxSizeMB} Mo.`;
      return;
    }
    this.ocrFile  = file;
    this.ocrError = '';
    // Pré-remplir le nom du modèle avec le nom du fichier (sans extension)
    if (!this.ocrModelName.trim()) {
      this.ocrModelName = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    }
  }

  /**
   * Anime les étapes de chargement avec des délais réalistes.
   * Ceci est purement visuel — le vrai résultat vient du serveur.
   */
  private _animateOcrSteps() {
    this.ocrProgressStep = 0;

    this.ocrStepTimer = setTimeout(() => {
      this.ocrProgressStep = 1;

      this.ocrStepTimer = setTimeout(() => {
        this.ocrProgressStep = 2;
      }, 2500);

    }, 1800);
  }

  private _clearOcrStepTimer() {
    if (this.ocrStepTimer) {
      clearTimeout(this.ocrStepTimer);
      this.ocrStepTimer = null;
    }
  }
}
