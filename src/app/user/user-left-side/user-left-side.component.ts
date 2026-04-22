import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarService } from '../../services/sidebar.service';
import { ModelService } from '../../services/model.service';
import { DocumentService } from '../../services/document.service';
import { Subscription } from 'rxjs';

interface ModelType {
  id?: number;
  name: string;
  label: string;
}

@Component({
  selector: 'app-user-left-side',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-left-side.component.html',
  styleUrl: './user-left-side.component.css'
})
export class UserLeftSideComponent implements OnInit, OnDestroy {
  isOpen = true;
  modelsExpanded = false;
  modelTypes: ModelType[] = [];
  activeTypeName: string | null = null;

  // RBAC permissions
  userType: string = '';
  userPermissions: any[] = [];

  // Popup ajout
  showAddTypePopup = false;
  newTypeName = '';
  showTypeError = false;
  @ViewChild('typeInput') typeInput!: ElementRef<HTMLInputElement>;

  // Popup modification
  showEditTypePopup = false;
  editingType: ModelType | null = null;
  editTypeName = '';
  showEditTypeError = false;
  @ViewChild('editTypeInput') editTypeInput!: ElementRef<HTMLInputElement>;

  // Popup suppression
  showDeleteTypePopup = false;
  typeToDelete: ModelType | null = null;

  private sidebarSub: Subscription | null = null;

  constructor(
    public router: Router,
    private sidebarService: SidebarService,
    private modelService: ModelService,
    private documentService: DocumentService
  ) {}

  // 🔥 Methode pour récupérer le tenantId depuis le local storage
  get tenantId(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      const entrepriseStr = localStorage.getItem('entreprise');
      if (userStr) {
        return JSON.parse(userStr).tenantId || '';
      } else if (entrepriseStr) {
        return JSON.parse(entrepriseStr).tenantId || '';
      }
    }
    return '';
  }

  ngOnInit(): void {
    // Récupère les permissions du user
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      const entrepriseStr = localStorage.getItem('entreprise');
      this.userType = localStorage.getItem('userType') || '';
      if (userStr && this.userType === 'USER') {
        const usr = JSON.parse(userStr);
        this.userPermissions = usr.permissions || [];
      } else if (entrepriseStr && this.userType === 'ENTREPRISE') {
        const ent = JSON.parse(entrepriseStr);
        this.userPermissions = ent.permissions || [];
      }
    }
    this.sidebarSub = this.sidebarService.isOpen$.subscribe(state => {
      this.isOpen = state;
    });
    this.loadModelTypes();
  }

  // RBAC
  hasPermission(code: string): boolean {
    if (this.userType === 'SUPER_ADMIN') return true;
    if (!this.userPermissions || this.userPermissions.length === 0) return false;
    const search = code.toUpperCase().trim();
    return this.userPermissions.some((p: any) => p.code && p.code.toUpperCase().trim() === search);
  }

  ngOnDestroy(): void {
    this.sidebarSub?.unsubscribe();
  }

  closeSidebar(): void {
    this.sidebarService.setIsOpen(false);
  }

  private loadModelTypes(): void {
    const currentTenantId = this.tenantId;
    if (!currentTenantId) return;

    // 🔥 Ajout de tenantId
    this.modelService.getTypes(currentTenantId).subscribe({
      next: (types: any[]) => {
        this.modelTypes = (types || []).map(t => ({
          id: t.id,
          name: t.name,
          label: t.label || t.name
        }));
      },
      error: () => {
        this.modelTypes = [];
      }
    });
  }

  // Navigation côté user vers /user/modeles
  goToModelsHome(): void {
    this.modelsExpanded = !this.modelsExpanded;
    this.activeTypeName = null;
    this.router.navigate(['/user', 'modeles']);
  }

  selectType(type: ModelType): void {
    this.activeTypeName = type.name;
    this.router.navigate(['/user', 'modeles'], { queryParams: { type: type.name } });
  }

  goToTrash(): void {
    this.activeTypeName = null;
    this.router.navigate(['/user', 'modeles'], { queryParams: { view: 'trash' } });
  }

  closeOnOverlay(event: MouseEvent, popup: 'add' | 'edit' | 'delete'): void {
    if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
      if (popup === 'add') this.closeAddTypePopup();
      if (popup === 'edit') this.closeEditTypePopup();
      if (popup === 'delete') this.closeDeleteTypePopup();
    }
  }

  // === AJOUT ===
  openAddTypePopup(): void {
    this.newTypeName = '';
    this.showTypeError = false;
    this.showAddTypePopup = true;
    setTimeout(() => this.typeInput?.nativeElement.focus(), 50);
  }

  closeAddTypePopup(): void {
    this.showAddTypePopup = false;
    this.newTypeName = '';
    this.showTypeError = false;
  }

  confirmAddType(): void {
    if (!this.newTypeName.trim()) {
      this.showTypeError = true;
      return;
    }
    const currentTenantId = this.tenantId;
    const payload: ModelType = {
      label: this.newTypeName.trim(),
      name: this.newTypeName.trim().toLowerCase().replace(/\s+/g, '-')
    };

    // 🔥 Ajout de tenantId
    this.documentService.saveType(payload, currentTenantId).subscribe({
      next: (saved: ModelType) => {
        this.modelTypes.push(saved);
        this.selectType(saved);
        this.closeAddTypePopup();
      },
      error: (err: any) => console.error('❌ Erreur ajout:', err)
    });
  }

  // === MODIFICATION ===
  openEditTypePopup(type: ModelType): void {
    this.editingType = type;
    this.editTypeName = type.label;
    this.showEditTypeError = false;
    this.showEditTypePopup = true;
    setTimeout(() => this.editTypeInput?.nativeElement.focus(), 50);
  }

  closeEditTypePopup(): void {
    this.showEditTypePopup = false;
    this.editingType = null;
    this.editTypeName = '';
    this.showEditTypeError = false;
  }

  confirmEditType(): void {
    if (!this.editTypeName.trim() || !this.editingType) {
      this.showEditTypeError = true;
      return;
    }
    const currentTenantId = this.tenantId;
    const updated: ModelType = {
      ...this.editingType,
      label: this.editTypeName.trim(),
      name: this.editTypeName.trim().toLowerCase().replace(/\s+/g, '-')
    };

    // 🔥 Ajout de tenantId
    this.documentService.updateType(updated, currentTenantId).subscribe({
      next: (res: ModelType) => {
        const i = this.modelTypes.findIndex(t => t.id === res.id);
        if (i !== -1) this.modelTypes[i] = res;
        this.closeEditTypePopup();
      },
      error: (err: any) => console.error('❌ Erreur modification:', err)
    });
  }

  // === SUPPRESSION ===
  openDeleteTypePopup(type: ModelType): void {
    this.typeToDelete = type;
    this.showDeleteTypePopup = true;
  }

  closeDeleteTypePopup(): void {
    this.showDeleteTypePopup = false;
    this.typeToDelete = null;
  }

  confirmDeleteType(): void {
    const type = this.typeToDelete;
    if (!type?.id) return;
    const currentTenantId = this.tenantId;

    const backup = [...this.modelTypes];
    this.modelTypes = this.modelTypes.filter(t => t.id !== type.id);
    this.showDeleteTypePopup = false;

    // 🔥 Ajout de tenantId
    this.documentService.deleteType(type.id, currentTenantId).subscribe({
      next: () => {
        if (this.activeTypeName === type.name) this.activeTypeName = null;
        this.typeToDelete = null;
      },
      error: (err: any) => {
        console.error('❌ Erreur suppression:', err);
        this.modelTypes = backup;
        alert(`Impossible de supprimer "${type.label}" car il est utilisé par des documents.`);
        this.typeToDelete = null;
      }
    });
  }
}
