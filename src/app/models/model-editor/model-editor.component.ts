import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragEnd, CdkDragMove, DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { ModelField } from '../../services/model.service';
import { PdfExportService } from '../../services/pdf-export.service';
import { TypeConfig, TypeField } from '../interfaces/config/type-config.interface';
import { TypeFieldsService } from '../../services/type-fields.service';
type ResizeCorner = 'tl' | 'tr' | 'bl' | 'br';

@Component({
  selector: 'app-model-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, HttpClientModule],
  templateUrl: './model-editor.component.html',
  styleUrls: ['./model-editor.component.css']
})
export class ModelEditorComponent implements OnInit {
  @Input() modelName: string = '';
  @Input() modelType: string = '';
  @Input() existingFields: ModelField[] = [];
  @Input() isEditMode: boolean = false;
  @Input() typeConfig: TypeConfig | null = null; 
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  @ViewChild('canvasRef', { static: false }) canvasRef!: ElementRef<HTMLElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  readonly A4_WIDTH = 794;
  readonly A4_HEIGHT = 1123;

  zoom = 0.65;
  readonly minZoom = 0.4;
  readonly maxZoom = 1.5;
  readonly zoomStep = 0.1;

  // Largeur du panneau de propriétés
  propertiesWidth = 280;
  readonly minPropertiesWidth = 220;
  readonly maxPropertiesWidth = 480;

  availableFields = [
    { type: 'text', label: 'Texte', icon: 'T' },
    { type: 'date', label: 'Date', icon: '📅' },
    { type: 'textarea', label: 'Texte long', icon: '¶' },
    { type: 'checkbox', label: 'Case à cocher', icon: '☑' },
    { type: 'image', label: 'Image', icon: '🖼️' },
    { type: 'table', label: 'Tableau', icon: '⊞' },
    { type: 'shape-rect', label: 'Rectangle', icon: '▭' }
  ];

  droppedFields: ModelField[] = [];
  selectedField: ModelField | null = null;
  private fieldIdCounter = 1;
  editingFieldId: string | null = null;

  private dragStartFieldPos = { x: 0, y: 0 };

  history: ModelField[][] = [];
  historyIndex: number = -1;
  private keyboardMoved = false;
  // Affichage du panneau de propriétés
  showProperties = true;
    // Affichage de la palette de champs
  showPalette = true;
  // Variables pour la création de champ rapide
  showNewFieldForm = false;
  newFieldName = '';
  isSavingNewField = false;
  newFieldErrorMessage = '';
  private clipboardField: ModelField | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private pdfExportService: PdfExportService,
    private typeFieldsService: TypeFieldsService // 🔹 AJOUT ICI
  ) {}
  
  get availableDocumentFields(): TypeField[] {
    return this.typeConfig?.fields ?? [];
  }
  // ===== CRÉATION RAPIDE DE CHAMP RÉEL =====
  toggleNewFieldForm() {
    this.showNewFieldForm = !this.showNewFieldForm;
    this.newFieldName = '';
    this.newFieldErrorMessage = '';
  }

  createNewRealField() {
    if (!this.newFieldName.trim()) {
      this.newFieldErrorMessage = 'Veuillez saisir un nom.';
      return;
    }

    if (!this.typeConfig) return;

    const name = this.newFieldName.trim();

    // Vérifier si le nom existe déjà
    const exists = this.typeConfig.fields?.some(f => f.fieldName?.toLowerCase() === name.toLowerCase());
    if (exists) {
      this.newFieldErrorMessage = 'Ce champ existe déjà.';
      return;
    }

    this.isSavingNewField = true;
    this.newFieldErrorMessage = '';

    // L'astuce : On détecte le type du champ visuel pour créer le bon type SQL !
    let fieldType = 'text';
    if (this.selectedField?.type === 'date') fieldType = 'date';
    if (this.selectedField?.type === 'table') fieldType = 'table';

    const newField: TypeField = {
      fieldName: name,
      fieldType: fieldType,
      fieldOrder: (this.typeConfig.fields?.length || 0) + 1
    };

    // Si c'est un tableau, on lui donne des colonnes par défaut
    if (fieldType === 'table') {
      newField._columnsArray = ['Colonne 1', 'Colonne 2'];
      newField.tableColumns = JSON.stringify(newField._columnsArray);
    }

    if (!this.typeConfig.fields) this.typeConfig.fields = [];
    this.typeConfig.fields.push(newField);

    // Préparation pour l'envoi au backend
    const cleanedFields = this.typeConfig.fields.map(f => {
      const jsonCols = f.fieldType === 'table' ? JSON.stringify(f._columnsArray) : undefined;
      return { ...f, tableColumns: jsonCols };
    });

    const typeId = (this.typeConfig as any).typeId || (this.typeConfig as any).id;

    if (!typeId) {
      // Sécurité si l'ID n'est pas trouvé, on l'ajoute au moins visuellement
      this.finalizeNewFieldCreation(name);
      return;
    }

    // Sauvegarde en base de données sans fermer l'éditeur !
    this.typeFieldsService.saveConfig(typeId, cleanedFields).subscribe({
      next: () => {
        this.finalizeNewFieldCreation(name);
      },
      error: () => {
        this.newFieldErrorMessage = 'Erreur serveur lors de la sauvegarde.';
        this.isSavingNewField = false;
        this.typeConfig!.fields.pop(); // On annule l'ajout visuel
      }
    });
  }

  private finalizeNewFieldCreation(name: string) {
    this.isSavingNewField = false;
    this.showNewFieldForm = false;
    this.newFieldName = '';
    
    // On lie automatiquement le champ que l'utilisateur était en train de modifier !
    if (this.selectedField) {
      this.selectedField.documentKey = name;
      this.saveState();
    }
    this.cdr.detectChanges();
  }
  // Copie le champ sélectionné dans un clipboard interne
  copySelectedField() {
    if (!this.selectedField) return;

    // On clone profondément pour ne pas modifier l'original
    const clone = JSON.parse(JSON.stringify(this.selectedField)) as ModelField;

    this.clipboardField = clone;
    console.log('📋 Champ copié :', this.clipboardField);
  }

  // Colle une nouvelle copie du champ copié
  pasteField() {
    if (!this.clipboardField) return;

    // Nouveau clone pour chaque collage
    const newField = JSON.parse(JSON.stringify(this.clipboardField)) as ModelField;

    // Nouveau fieldId unique
    newField.fieldId = `field-${this.fieldIdCounter++}`;
    newField.id = undefined; // côté back, ce sera un nouvel enregistrement

    // Décaler légèrement pour voir que c'est une copie
    const offset = 10;
    newField.x = (newField.x ?? 0) + offset;
    newField.y = (newField.y ?? 0) + offset;

    // Normaliser + pousser
    const normalized = this.normalizeField(newField);

    this.droppedFields.push(normalized);
    this.selectedField = normalized;

    this.saveState();
    this.cdr.detectChanges();

    console.log('📎 Champ collé :', normalized);
  }

  ngOnInit() {
    if (this.existingFields?.length > 0) {
      this.droppedFields = this.existingFields.map(f => this.normalizeField({ ...f }));

      const maxId = Math.max(
        ...this.droppedFields.map(f => {
          const match = (f.fieldId || '').match(/field-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        }),
        0
      );
      this.fieldIdCounter = maxId + 1;
    }
    this.saveState();
  }

  // ===== ZOOM =====
  zoomIn() {
    this.zoom = Math.min(this.maxZoom, +(this.zoom + this.zoomStep).toFixed(2));
  }

  zoomOut() {
    this.zoom = Math.max(this.minZoom, +(this.zoom - this.zoomStep).toFixed(2));
  }

  resetZoom() {
    this.zoom = 0.65;
  }

  get zoomPercent(): number {
    return Math.round(this.zoom * 100);
  }

  onZoomChange(event: any) {
    let parsed = parseInt(event.target.value, 10);

    if (isNaN(parsed)) {
      event.target.value = this.zoomPercent;
      return;
    }

    const minP = Math.round(this.minZoom * 100);
    const maxP = Math.round(this.maxZoom * 100);
    parsed = Math.max(minP, Math.min(maxP, parsed));

    this.zoom = +(parsed / 100).toFixed(2);
    event.target.value = parsed;
  }

  // ===== DRAG & DROP PALETTE =====
  onDragStart(event: DragEvent, type: string) {
    event.dataTransfer!.setData('fieldType', type);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private pointerToCanvas(eventX: number, eventY: number): { x: number; y: number } {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (eventX - rect.left) / this.zoom;
    const y = (eventY - rect.top) / this.zoom;

    return { x, y };
  }

  onDrop(event: DragEvent) {
    event.preventDefault();

    const type = event.dataTransfer?.getData('fieldType');
    if (!type) return;

    const pos = this.pointerToCanvas(event.clientX, event.clientY);

    // 🔹 CORRECTION : Ajout de la configuration pour générer le tableau
    if (type === 'table') {
      const field: ModelField = this.normalizeField({
        fieldId: `field-${this.fieldIdCounter++}`,
        type: 'table',
        label: 'Nouveau tableau',
        x: pos.x,
        y: pos.y,
        width: 400,
        height: 105,
        tableConfig: {
          rows: 2,
          cols: 2,
          headers: ['Col 1', 'Col 2'],
          data: [
            ['', ''],
            ['', '']
          ]
        }
      } as any);

      this.droppedFields.push(field);
      this.selectedField = field;
      this.saveState();
      return;
    }

    // NOUVEAU : cas du rectangle (shape-rect)
    if (type === 'shape-rect') {
      const field: ModelField = this.normalizeField({
        fieldId: `field-${this.fieldIdCounter++}`,
        type: 'shape-rect',
        label: '',
        placeholder: '',
        value: '',
        x: pos.x,
        y: pos.y,
        width: 350,
        height: 120,
        borderColor: '#0f172a',
        borderWidth: 2,
        borderStyle: 'solid',
        backgroundColor: 'transparent',
        borderRadius: 0
      } as any);

      this.droppedFields.push(field);
      this.selectedField = field;
      this.saveState();
      return;
    }

    // Cas normaux (text, date, etc.)
    const defaultWidth = type === 'image' ? 150 : 300;
    const defaultHeight = type === 'image' ? 150 : 40;

    const field: ModelField = this.normalizeField({
      fieldId: `field-${this.fieldIdCounter++}`,
      type,
      label: '',
      placeholder: '',
      value: '',
      x: pos.x,
      y: pos.y,
      width: defaultWidth,
      height: defaultHeight
    });

    this.droppedFields.push(field);
    this.selectedField = field;

    this.saveState();
  }

  // ===== SELECTION =====
  selectField(field: ModelField, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedField = field;
    if (this.editingFieldId !== field.fieldId) {
      this.editingFieldId = null;
    }
  }

  deselectField() {
    this.selectedField = null;
    this.editingFieldId = null;
  }

  // ===== IMAGE UPLOAD =====
  triggerImageUpload(field: ModelField) {
    this.selectedField = field;
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file || !this.selectedField) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        this.selectedField!.value = compressedBase64;
        this.saveState();
        this.cdr.detectChanges();
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  }

  // ===== EDITION =====
  enableEditing(field: ModelField, event: MouseEvent) {
    event.stopPropagation();
    this.editingFieldId = field.fieldId ?? null;
    this.selectedField = field;

    if (field.type === 'image') {
      this.triggerImageUpload(field);
      return;
    }

    setTimeout(() => {
      const el = document.getElementById(field.fieldId!);
      if (el) {
        const input = el.querySelector('.canvas-input') as HTMLElement;
        if (input) input.focus();
      }
    });
  }

  disableEditing() {
    this.editingFieldId = null;
  }

  deleteField(field: ModelField) {
    this.droppedFields = this.droppedFields.filter(f => f.fieldId !== field.fieldId);
    if (this.selectedField?.fieldId === field.fieldId) this.selectedField = null;

    this.saveState();
  }

  // ===== DRAG DES CHAMPS =====
  onFieldDragStart(event: any, field: ModelField) {
    this.dragStartFieldPos = { x: field.x || 0, y: field.y || 0 };
  }

  onFieldDragMoved(field: ModelField, event: CdkDragMove) {
    const newX = this.dragStartFieldPos.x + (event.distance.x / this.zoom);
    const newY = this.dragStartFieldPos.y + (event.distance.y / this.zoom);

    field.x = Math.round(newX);
    field.y = Math.round(newY);

    const el = document.getElementById(field.fieldId!);
    if (el) {
      const out =
        field.x < 0 ||
        field.y < 0 ||
        field.x + (field.width ?? 0) > this.A4_WIDTH ||
        field.y + (field.height ?? 0) > this.A4_HEIGHT;
      if (out) el.classList.add('outside');
      else el.classList.remove('outside');
    }

    this.cdr.detectChanges();
  }

  onFieldDragEnd(event: CdkDragEnd) {
    const field = event.source.data as ModelField;
    this.normalizeField(field);
    event.source.element.nativeElement.style.transform = 'none';

    this.saveState();
    this.cdr.detectChanges();
  }

  // ===== RESIZE CHAMPS =====
  startResize(ev: MouseEvent, field: ModelField, corner: ResizeCorner) {
    ev.preventDefault();
    ev.stopPropagation();

    const startX = ev.clientX;
    const startY = ev.clientY;

    const initial = {
      x: field.x,
      y: field.y,
      w: field.width ?? 300,
      h: field.height ?? 40
    };

    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - startX) / this.zoom;
      const dy = (e.clientY - startY) / this.zoom;

      let newX = initial.x;
      let newY = initial.y;
      let newW = initial.w;
      let newH = initial.h;

      if (corner === 'br') {
        newW = initial.w + dx;
        newH = initial.h + dy;
      } else if (corner === 'bl') {
        newW = initial.w - dx;
        newH = initial.h + dy;
        newX = initial.x + dx;
      } else if (corner === 'tr') {
        newW = initial.w + dx;
        newH = initial.h - dy;
        newY = initial.y + dy;
      } else if (corner === 'tl') {
        newW = initial.w - dx;
        newH = initial.h - dy;
        newX = initial.x + dx;
        newY = initial.y + dy;
      }

      field.x = newX;
      field.y = newY;
      field.width = newW;
      field.height = newH;

      this.normalizeField(field);
      this.cdr.detectChanges();
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      this.normalizeField(field);

      this.saveState();
      this.cdr.detectChanges();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // ===== RESIZE PANNEAU PROPRIÉTÉS =====
  startResizeProperties(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();

    const startX = ev.clientX;
    const startWidth = this.propertiesWidth;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      let newWidth = startWidth - dx;

      newWidth = Math.max(this.minPropertiesWidth, Math.min(this.maxPropertiesWidth, newWidth));

      this.propertiesWidth = newWidth;
      this.cdr.detectChanges();
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  toggleProperties() {
    this.showProperties = !this.showProperties;
    this.cdr.detectChanges();
  }

  togglePalette() {
    this.showPalette = !this.showPalette;
    this.cdr.detectChanges();
  }

  // ===== SAUVEGARDE =====
  onSave() {
    // On normalise uniquement les tailles/positions,
    // sans toucher au type de tableConfig
    const normalizedFields = this.droppedFields.map((f) => {
      const copy: any = { ...f };

      const minW = 100;
      const minH = 30;

      const w = this.clamp(Number(copy.width ?? 300), minW, this.A4_WIDTH);
      const h = this.clamp(Number(copy.height ?? 40), minH, this.A4_HEIGHT);
      const x = this.clamp(Number(copy.x ?? 0), 0, this.A4_WIDTH - w);
      const y = this.clamp(Number(copy.y ?? 0), 0, this.A4_HEIGHT - h);

      copy.width = Math.round(w);
      copy.height = Math.round(h);
      copy.x = Math.round(x);
      copy.y = Math.round(y);

      if (copy.bold === undefined) copy.bold = false;
      if (copy.italic === undefined) copy.italic = false;
      if (copy.underline === undefined) copy.underline = false;
      if (copy.boxed === undefined) copy.boxed = false;
      if (copy.fontSize === undefined) copy.fontSize = 14;

      // ⚠️ NE PAS toucher à copy.tableConfig
      // si c'est une string, on la laisse string
      // si c'est un objet, on veut au contraire l'envoyer en string :
      if (copy.type === 'table') {
        if (typeof copy.tableConfig !== 'string') {
          try {
            copy.tableConfig = JSON.stringify(copy.tableConfig ?? {});
          } catch {
            copy.tableConfig = null;
          }
        }
      }

      return copy as ModelField;
    });

    this.save.emit({
      name: this.modelName,
      type: this.modelType,
      fields: normalizedFields
    });
  }

  onClose() {
    this.close.emit();
  }

  getFieldTypeLabel(type: string): string {
    const f = this.availableFields.find(x => x.type === type);
    return f ? f.label : type;
  }

  getFieldIcon(type: string): string {
    const f = this.availableFields.find(x => x.type === type);
    return f ? f.icon : '📄';
  }

  private normalizeField(field: ModelField): ModelField {
    const minW = 100;
    const minH = 30;

    const w = this.clamp(Number(field.width ?? 300), minW, this.A4_WIDTH);
    const h = this.clamp(Number(field.height ?? 40), minH, this.A4_HEIGHT);

    const x = this.clamp(Number(field.x ?? 0), 0, this.A4_WIDTH - w);
    const y = this.clamp(Number(field.y ?? 0), 0, this.A4_HEIGHT - h);

    field.width = Math.round(w);
    field.height = Math.round(h);
    field.x = Math.round(x);
    field.y = Math.round(y);

    if (field.bold === undefined) field.bold = false;
    if (field.italic === undefined) field.italic = false;
    if (field.underline === undefined) field.underline = false;
    if (field.boxed === undefined) field.boxed = false;
    if (field.fontSize === undefined) field.fontSize = 14;

    // 🔹 Normalisation spéciale pour tableConfig
    if (field.type === 'table') {
      if (typeof (field as any).tableConfig === 'string') {
        try {
          (field as any).tableConfig = JSON.parse((field as any).tableConfig);
        } catch {
          (field as any).tableConfig = null;
        }
      }
    }

    return field;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  // ===== CLAVIER (undo / redo / flèches) =====
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // ========= Undo / Redo =========
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      event.preventDefault();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      this.redo();
      event.preventDefault();
      return;
    }

    // ========= Copier / Coller =========
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      if (this.selectedField) {
        this.copySelectedField();
        event.preventDefault();
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      if (this.clipboardField) {
        this.pasteField();
        event.preventDefault();
      }
      return;
    }

    // ========= Déplacements au clavier =========
    if (!this.selectedField) return;

    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    const step = event.shiftKey ? 10 : 1;
    let moved = false;

    switch (event.key) {
      case 'ArrowUp':
        this.selectedField.y -= step;
        moved = true;
        break;
      case 'ArrowDown':
        this.selectedField.y += step;
        moved = true;
        break;
      case 'ArrowLeft':
        this.selectedField.x -= step;
        moved = true;
        break;
      case 'ArrowRight':
        this.selectedField.x += step;
        moved = true;
        break;
    }

    if (moved) {
      event.preventDefault();
      this.normalizeField(this.selectedField);
      this.keyboardMoved = true;
      this.cdr.detectChanges();
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'Right'].includes(event.key)) {
      if (this.keyboardMoved) {
        this.saveState();
        this.keyboardMoved = false;
      }
    }
  }

  saveState() {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(JSON.parse(JSON.stringify(this.droppedFields)));
    this.historyIndex++;
    if (this.history.length > 30) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  undo() {
    if (this.canUndo) {
      this.historyIndex--;
      this.droppedFields = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.restoreSelection();
    }
  }

  redo() {
    if (this.canRedo) {
      this.historyIndex++;
      this.droppedFields = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.restoreSelection();
    }
  }

  get canUndo(): boolean {
    return this.historyIndex > 0;
  }

  get canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  private restoreSelection() {
    if (this.selectedField) {
      this.selectedField =
        this.droppedFields.find(f => f.fieldId === this.selectedField?.fieldId) || null;
      if (!this.selectedField) this.editingFieldId = null;
    }
    this.cdr.detectChanges();
  }

  // Permet à Angular de ne pas recréer l'input à chaque frappe au clavier
  trackByIndex(index: number, obj: any): any {
    return index;
  }

  // Met à jour la taille du tableau en conservant les données existantes
  updateTableDimensions(field: ModelField, newRows: number, newCols: number) {
    if (!field.tableConfig) return;
    
    newRows = Math.max(1, Number(newRows) || 1);
    newCols = Math.max(1, Number(newCols) || 1);

    const config = field.tableConfig;
    
    // Hauteur/Largeur estimée à ajouter pour chaque nouvelle ligne/colonne
    const rowHeightPixels = 35; 
    const colWidthPixels = 100;

    // Mise à jour des colonnes
    if (newCols !== config.cols) {
      if (newCols > config.cols) {
        // Agrandir la boîte en largeur
        const diffCols = newCols - config.cols;
        field.width = (field.width || 300) + (diffCols * colWidthPixels);

        for (let i = config.cols; i < newCols; i++) {
          config.headers.push(`Col ${i + 1}`);
          config.data.forEach((row: any[]) => row.push(''));
        }
      } else {
        config.headers = config.headers.slice(0, newCols);
        config.data.forEach((row: any[]) => row.splice(newCols));
      }
      config.cols = newCols;
    }

    // Mise à jour des lignes
    if (newRows !== config.rows) {
      if (newRows > config.rows) {
        // Agrandir la boîte en hauteur automatiquement !
        const diffRows = newRows - config.rows;
        field.height = (field.height || 100) + (diffRows * rowHeightPixels);

        for (let i = config.rows; i < newRows; i++) {
          config.data.push(new Array(config.cols).fill(''));
        }
      } else {
        config.data = config.data.slice(0, newRows);
      }
      config.rows = newRows;
    }

    this.saveState();
    this.cdr.detectChanges();
  }
}

export { ModelField };