import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TypeFieldsService } from '../../services/type-fields.service';
import { TypeConfig, TypeField } from '../interfaces/config/type-config.interface';

@Component({
  selector: 'app-type-fields-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './type-fields-dialog.component.html',
  styleUrls: ['./type-fields-dialog.component.css']
})
export class TypeFieldsDialogComponent implements OnInit, OnChanges {
  @Input() typeId!: number;
  @Input() typeName: string = '';
  @Input() visible: boolean = false;
  @Output() closed = new EventEmitter<void>();

  fields: TypeField[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  constructor(private typeFieldsService: TypeFieldsService) {}

  ngOnInit(): void { if (this.visible && this.typeId) this.loadConfig(); }
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] && this.visible) || changes['typeId']) {
      if (this.visible && this.typeId) this.loadConfig();
    }
  }

  loadConfig(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.typeFieldsService.getConfig(this.typeId).subscribe({
      next: (config: TypeConfig) => {
        this.fields = config.fields && config.fields.length > 0
          ? config.fields.map(f => {
              let cols: string[] = ['Colonne 1', 'Colonne 2'];
              if (f.fieldType === 'table' && f.tableColumns) {
                try { cols = JSON.parse(f.tableColumns); } catch (e) {}
              }
              return { ...f, fieldType: f.fieldType || 'text', _columnsArray: cols };
            })
          : [{ fieldName: '', fieldType: 'text', _columnsArray: ['Colonne 1', 'Colonne 2'] }];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur config:', err);
        this.errorMessage = 'Erreur lors du chargement des champs.';
        this.isLoading = false;
      }
    });
  }

  addField(): void {
    this.fields.push({ fieldName: '', fieldType: 'text', _columnsArray: ['Colonne 1', 'Colonne 2'] });
  }

  removeField(index: number): void {
    this.fields.splice(index, 1);
    if (this.fields.length === 0) this.addField();
  }

  onTypeChange(field: TypeField): void {
    if (field.fieldType === 'table' && !field._columnsArray) field._columnsArray = ['Colonne 1', 'Colonne 2'];
  }

  addColumn(field: TypeField): void {
    if (!field._columnsArray) field._columnsArray = [];
    field._columnsArray.push(`Colonne ${field._columnsArray.length + 1}`);
  }

  removeColumn(field: TypeField, colIndex: number): void {
    if (field._columnsArray && field._columnsArray.length > 1) field._columnsArray.splice(colIndex, 1);
  }

  cancel(): void {
    this.visible = false;
    this.closed.emit();
  }

  save(): void {
    this.isSaving = true;
    this.errorMessage = '';

    const cleanedFields: TypeField[] = this.fields
      .map(f => ({ ...f, fieldName: (f.fieldName || '').trim() }))
      .filter(f => f.fieldName !== '')
      .map((f, idx) => {
        const jsonCols = f.fieldType === 'table' ? JSON.stringify(f._columnsArray) : undefined;
        return { ...f, fieldOrder: idx + 1, tableColumns: jsonCols };
      });

    if (cleanedFields.length === 0) {
      this.errorMessage = 'Veuillez définir au moins un champ.';
      this.isSaving = false;
      return;
    }

    this.typeFieldsService.saveConfig(this.typeId, cleanedFields).subscribe({
      next: () => {
        this.isSaving = false;
        this.visible = false;
        this.closed.emit();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la sauvegarde.';
        this.isSaving = false;
      }
    });
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('type-fields-overlay')) this.cancel();
  }

  trackByIndex(index: number): any { return index; }
}