import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModelService } from '../../services/model.service';

interface TrashModel {
  id: number;
  name: string;
  typeId?: number;
  typeName?: string;
  typeLabel?: string;
  deletedAt?: string;
  deleteAfter?: string;
}

@Component({
  selector: 'app-trash-models',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trash-models.component.html',
  styleUrls: ['./trash-models.component.css']
})
export class TrashModelsComponent implements OnInit {
  trashedModels: TrashModel[] = [];
  loading = false;
  showDeleteConfirmPopup = false;
  modelToDelete: TrashModel | null = null;

  private tenantId: string | null = null;

  constructor(private modelService: ModelService) {}

  ngOnInit(): void {
    const entrepriseStr = localStorage.getItem('entreprise');
    const userStr = localStorage.getItem('user');

    if (entrepriseStr) {
      const ent = JSON.parse(entrepriseStr);
      this.tenantId = ent.tenantId || ent.tenantID || null;
    } else if (userStr) {
      const usr = JSON.parse(userStr);
      this.tenantId = usr.tenantId || usr.tenantID || null;
    }

    this.loadTrash();
  }

  loadTrash(): void {
    if (!this.tenantId) {
      console.error('❌ tenantId manquant pour charger la corbeille');
      return;
    }

    this.loading = true;
    this.modelService.getTrashedModels(this.tenantId).subscribe({
      next: (data: any[]) => {
        this.trashedModels = (data || []) as TrashModel[];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement corbeille:', err);
        this.loading = false;
      }
    });
  }

  restore(model: any): void {
    if (!this.tenantId) return;

    this.modelService.restoreModel(model.id, this.tenantId).subscribe({
      next: () => {
        this.loadTrash();
      },
      error: (err: any) => {
        console.error('❌ Erreur restauration:', err);
        this.loadTrash();
      }
    });
  }

  hardDelete(model: any): void {
    this.modelToDelete = model;
    this.showDeleteConfirmPopup = true;
  }

  cancelHardDelete(): void {
    this.showDeleteConfirmPopup = false;
    this.modelToDelete = null;
  }

  closeOnOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
      this.cancelHardDelete();
    }
  }

  confirmHardDelete(): void {
    if (!this.modelToDelete || !this.tenantId) return;

    const modelId = this.modelToDelete.id;
    this.showDeleteConfirmPopup = false;

    this.trashedModels = this.trashedModels.filter(m => m.id !== modelId);

    this.modelService.hardDeleteModel(modelId, this.tenantId).subscribe({
      next: () => {
        this.loadTrash();
      },
      error: (err: any) => {
        console.error('❌ Erreur suppression définitive:', err);
        this.loadTrash();
      }
    });

    this.modelToDelete = null;
  }

  getTypeLabel(model: TrashModel): string {
    return model.typeLabel || model.typeName || '—';
  }

  daysLeft(model: TrashModel): number {
    const base = model.deleteAfter || model.deletedAt;
    if (!base) return 0;

    if (model.deleteAfter) {
      const ms = new Date(model.deleteAfter).getTime() - Date.now();
      return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    }

    const deletedMs = new Date(model.deletedAt as string).getTime();
    const deadline = deletedMs + 5 * 24 * 60 * 60 * 1000;
    const ms = deadline - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }
}
