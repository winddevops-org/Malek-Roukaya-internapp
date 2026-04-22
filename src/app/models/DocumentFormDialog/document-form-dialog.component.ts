// src/app/models/document-form-dialog/document-form-dialog.component.ts
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TypeFieldsService } from '../../services/type-fields.service';
import { TypeConfig, TypeField } from '../interfaces/config/type-config.interface';
import { DocumentData } from '../interfaces/document-data.interface';

@Component({
  selector: 'app-document-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-form-dialog.component.html',
  styleUrls: ['./document-form-dialog.component.css']
})
export class DocumentFormDialogComponent implements OnInit, OnChanges {

  @Input() typeId!: number;
  @Input() typeName: string = '';
  @Input() visible: boolean = false;

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<{ name: string; data: DocumentData }>();

  fields: TypeField[] = [];
  formData: DocumentData = {};
  documentName: string = '';

  isLoading = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(private typeFieldsService: TypeFieldsService) {}

  ngOnInit(): void {
    if (this.visible && this.typeId) {
      this.loadTypeConfig();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      if (this.typeId) {
        this.loadTypeConfig();
      }
      this.documentName = '';
      this.errorMessage = '';
      this.isSubmitting = false;
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('document-form-overlay')) {
      this.cancel();
    }
  }

  loadTypeConfig(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.typeFieldsService.getConfig(this.typeId).subscribe({
      next: (config: TypeConfig) => {
        this.fields = config.fields && config.fields.length > 0
          ? config.fields.map(f => {
              // Extraire les colonnes si c'est un tableau
              let cols = ['Colonne 1'];
              if (f.fieldType === 'table' && f.tableColumns) {
                try { cols = JSON.parse(f.tableColumns); } catch (e) {}
              }
              return { ...f, fieldType: f.fieldType || 'text', _columnsArray: cols };
            })
          : [];

        if (this.fields.length === 0) {
          this.errorMessage = 'Aucun champ défini pour ce type. Veuillez d’abord définir les champs.';
        } else {
          this.initFormDataFromFields(this.fields);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement config champs :', err);
        this.errorMessage = 'Erreur lors du chargement des champs.';
        this.fields = [];
        this.isLoading = false;
      }
    });
  }

  initFormDataFromFields(fields: TypeField[]): void {
    this.formData = {};
    fields.forEach(f => {
      if (f.fieldName) {
        if (f.fieldType === 'table') {
          // Initialiser une ligne vide pour le tableau
          const emptyRow: any = {};
          f._columnsArray?.forEach(col => emptyRow[col] = '');
          this.formData[f.fieldName] = [emptyRow];
        } else {
          this.formData[f.fieldName] = '';
        }
      }
    });
  }

  // Fonctions pour les tableaux interactifs
  addTableRow(fieldName: string, columns: string[]): void {
    const emptyRow: any = {};
    columns.forEach(col => emptyRow[col] = '');
    if (!this.formData[fieldName]) this.formData[fieldName] = [];
    this.formData[fieldName].push(emptyRow);
  }

  removeTableRow(fieldName: string, rowIndex: number): void {
    if (this.formData[fieldName] && this.formData[fieldName].length > 1) {
      this.formData[fieldName].splice(rowIndex, 1);
    }
  }

  // Permet d'éviter la perte de focus sur les inputs du tableau
  trackByIndex(index: number, obj: any): any {
    return index;
  }

  cancel(): void {
    this.visible = false;
    this.closed.emit();
  }

  submit(): void {
    if (!this.fields || this.fields.length === 0) {
      this.errorMessage = 'Aucun champ n’est disponible.';
      return;
    }

    if (!this.documentName.trim()) {
      this.errorMessage = 'Veuillez saisir un nom pour ce document.';
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    // Envoi des données au parent
    this.submitted.emit({
      name: this.documentName.trim(),
      data: this.formData
    });

    // 🔹 CORRECTION ICI : On réinitialise l'état et on ferme la modale juste après l'envoi
    setTimeout(() => {
      this.isSubmitting = false;
      this.cancel();
    }, 400); // Un léger délai pour laisser le temps à la base de données de s'actualiser avant la fermeture visuelle
  }
}