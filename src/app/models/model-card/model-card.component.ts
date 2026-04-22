import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ModelItem {
  id: number;
  name: string;
  type: string;
  updatedAt: string;
  fields?: any[];
}

@Component({
  selector: 'app-model-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './model-card.component.html',
  styleUrls: ['./model-card.component.css']
})
export class ModelCardComponent implements OnInit {
  @Input() model!: ModelItem;
  @Output() view   = new EventEmitter<ModelItem>();
  @Output() edit   = new EventEmitter<ModelItem>();
  @Output() rename = new EventEmitter<ModelItem>();
  @Output() delete = new EventEmitter<ModelItem>();

  // 🚀 RBAC : chargées depuis localStorage (même logique que models-list)
  userType: string = '';
  userPermissions: any[] = [];

  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const entrepriseStr = localStorage.getItem('entreprise');
      const userStr       = localStorage.getItem('user');
      const superAdminStr = localStorage.getItem('superAdmin');

      this.userType = localStorage.getItem('userType') || '';

      if (entrepriseStr && this.userType === 'ENTREPRISE') {
        const ent = JSON.parse(entrepriseStr);
        this.userPermissions = ent.permissions || [];
      } else if (userStr && this.userType === 'USER') {
        const usr = JSON.parse(userStr);
        this.userPermissions = usr.permissions || [];
      } else if (superAdminStr && this.userType === 'SUPER_ADMIN') {
        // Super Admin → hasPermission() retourne true directement
      }
    }
  }

  // 🚀 RBAC : même implémentation que models-list
  hasPermission(code: string): boolean {
    if (this.userType === 'SUPER_ADMIN') {
      return true;
    }
    if (!this.userPermissions || this.userPermissions.length === 0) {
      return false;
    }
    const search = code.toUpperCase().trim();
    return this.userPermissions.some((p: any) =>
      p.code && p.code.toUpperCase().trim() === search
    );
  }

  get canView():   boolean { return this.hasPermission('VOIR_DES_MODELES'); }
  get canEdit():   boolean { return this.hasPermission('MODIFIER_DES_MODELES'); }
  get canDelete(): boolean { return this.hasPermission('SUPPRIMER_DES_MODELES'); }

  onView()   { if (this.canView)   this.view.emit(this.model); }
  onEdit()   { if (this.canEdit)   this.edit.emit(this.model); }
  onRename() { this.rename.emit(this.model); }
  onDelete() { if (this.canDelete) this.delete.emit(this.model); }

  getTypeLabel(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }
}
