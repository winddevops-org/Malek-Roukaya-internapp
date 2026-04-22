import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ModelsListComponent } from '../models-list/models-list.component';
import { ModelCardComponent, ModelItem } from '../model-card/model-card.component';
import { ModelService, DocumentModel } from '../../services/model.service';
import { TrashModelsComponent } from '../trash-models/trash-models.component';

@Component({
  selector: 'app-models-container',
  standalone: true,
  imports: [CommonModule, ModelsListComponent, ModelCardComponent, TrashModelsComponent],
  templateUrl: './models-container.component.html',
  styleUrls: ['./models-container.component.css']
})
export class ModelsContainerComponent implements OnInit {
  @ViewChild(ModelsListComponent) modelsListComp?: ModelsListComponent;

  viewMode: 'home' | 'type' | 'trash' = 'home';
  activeType: { name: string; label: string } | null = null;

  recentModels: ModelItem[] = [];
  loadingRecent = false;

  private pendingAction:
    | { kind: 'view' | 'edit' | 'rename' | 'delete'; model: ModelItem }
    | null = null;

  private tenantId: string | null = null;

  constructor(
    private modelService: ModelService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // 🔥 CORRECTION ICI : Vérification de l'existence de window et localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const entrepriseStr = localStorage.getItem('entreprise');
      const userStr = localStorage.getItem('user');

      if (entrepriseStr) {
        const ent = JSON.parse(entrepriseStr);
        this.tenantId = ent.tenantId || ent.tenantID || null;
      } else if (userStr) {
        const usr = JSON.parse(userStr);
        this.tenantId = usr.tenantId || usr.tenantID || null;
      }
    }

    this.route.queryParams.subscribe(params => {
      if (params['view'] === 'trash') {
        this.openTrashView();
      } else if (params['type']) {
        this.setType(params['type']);
      } else {
        this.openHomeView();
      }
    });
  }

  openHomeView() {
    this.viewMode = 'home';
    this.activeType = null;
    this.loadRecentModels();
  }

  openTrashView() {
    this.viewMode = 'trash';
    this.activeType = null;
  }

  setType(type: string) {
    this.viewMode = 'type';
    this.activeType = { name: type, label: type };
    setTimeout(() => this.tryRunPendingAction(), 250);
  }

  private loadRecentModels(): void {
    if (!this.tenantId) {
      this.recentModels = [];
      return;
    }

    this.loadingRecent = true;

    this.modelService.getAllModelsByTenant(this.tenantId).subscribe({
      next: (models: DocumentModel[]) => {
        const sorted = [...(models || [])].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
          if (da === db) return (Number(b.id) || 0) - (Number(a.id) || 0);
          return db - da;
        });

        this.recentModels = sorted.slice(0, 3).map((doc) => ({
          id: Number(doc.id),
          name: doc.name,
          type: (doc.modelType as any)?.name || '',
          updatedAt: (doc.updatedAt as any) || new Date().toISOString(),
          fields: doc.fields || []
        }));

        this.loadingRecent = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement modèles récents:', err);
        this.recentModels = [];
        this.loadingRecent = false;
      }
    });
  }

  onRecentView(model: ModelItem) {
    this.pendingAction = { kind: 'view', model };
    this.setType(model.type);
  }

  onRecentEdit(model: ModelItem) {
    this.pendingAction = { kind: 'edit', model };
    this.setType(model.type);
  }

  onRecentRename(model: ModelItem) {
    this.pendingAction = { kind: 'rename', model };
    this.setType(model.type);
  }

  onRecentDelete(model: ModelItem) {
    this.pendingAction = { kind: 'delete', model };
    this.setType(model.type);
  }

  private tryRunPendingAction() {
    if (!this.pendingAction || !this.modelsListComp) return;

    const target = this.modelsListComp.models.find(m => m.id === this.pendingAction!.model.id);

    if (!target) {
      setTimeout(() => this.tryRunPendingAction(), 200);
      return;
    }

    switch (this.pendingAction.kind) {
      case 'view':   this.modelsListComp.onView(target);   break;
      case 'edit':   this.modelsListComp.onEdit(target);   break;
      case 'rename': this.modelsListComp.onRename(target); break;
      case 'delete': this.modelsListComp.onDelete(target); break;
    }

    this.pendingAction = null;
  }
}
