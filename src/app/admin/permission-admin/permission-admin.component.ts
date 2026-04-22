// src/app/admin/permission-admin/permission-admin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permission, PermissionService } from '../../services/permission.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-permissions-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permission-admin.component.html',
  styleUrl: './permission-admin.component.css'
})
export class PermissionsAdminComponent implements OnInit {
  permissions: Permission[] = [];
  newPermissionLabel = '';
  isLoading = false;
  isCreating = false;

  // --- NOUVEAU : Variables pour la modale de suppression ---
  showDeleteModal = false;
  permissionToDelete: Permission | null = null;

  // Variables pour le Toast
  toastMessage = '';
  toastType: 'success' | 'error' | 'delete' = 'success';
  private toastTimeout: any;

  constructor(
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  // --- Gestion du Toast ---
  showToast(message: string, type: 'success' | 'error' | 'delete'): void {
    this.toastMessage = message;
    this.toastType = type;

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.toastMessage = '';
    }, 3000);
  }

  loadPermissions(): void {
    this.isLoading = true;
    this.permissionService.listPermissions()
      .subscribe({
        next: (perms: Permission[]) => {
          this.permissions = perms;
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error(err);
          this.showToast('Impossible de charger les permissions.', 'error');
          this.isLoading = false;
        }
      });
  }

  createPermission(): void {
    const label = this.newPermissionLabel.trim();
    if (!label) {
      this.showToast('Le nom de la permission est obligatoire.', 'error');
      return;
    }

    this.isCreating = true;
    const code = label.toUpperCase().replace(/\s+/g, '_');

    this.permissionService.createCustomPermission(code, label)
      .subscribe({
        next: (perm: Permission) => {
          this.permissions.unshift(perm);
          this.newPermissionLabel = '';
          this.isCreating = false;
          this.showToast('Permission créée avec succès.', 'success');
        },
        error: (err: any) => {
          console.error(err);
          this.isCreating = false;
          this.showToast((err.error && err.error.message) || 'Erreur lors de la création de la permission.', 'error');
        }
      });
  }

  // --- NOUVEAU : Logique de la modale de suppression ---
  openDeleteModal(permission: Permission): void {
    this.permissionToDelete = permission;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.permissionToDelete = null;
  }

  confirmDelete(): void {
    if (!this.permissionToDelete) return;

    this.permissionService.deletePermission(this.permissionToDelete.id)
      .subscribe({
        next: () => {
          this.permissions = this.permissions.filter(p => p.id !== this.permissionToDelete!.id);
          this.showToast('Permission supprimée avec succès.', 'delete');
          this.showDeleteModal = false;
          this.permissionToDelete = null;
        },
        error: (err: any) => {
          console.error(err);
          this.showToast((err.error && err.error.message) || 'Erreur lors de la suppression.', 'error');
          this.showDeleteModal = false;
          this.permissionToDelete = null;
        }
      });
  }
}
