// src/app/admin/utilisateurs/utilisateurs.component.ts
import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user.service';
import { PermissionService, Permission } from '../../services/permission.service';
import { EntrepriseService } from '../../services/entreprise.service'; // 🚀 IMPORT AJOUTÉ

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './utilisateurs.component.html',
  styleUrl: './utilisateurs.component.css'
})
export class UtilisateursComponent implements OnInit {
  openPermissionMenu: number | null = null;
  editingIndex: number | null = null;

  showDeleteModal = false;
  userToDeleteIndex: number | null = null;

  showConfirmAddPermModal = false;
  pendingUserIndex: number | null = null;
  pendingPermCode: string | null = null;
  pendingPermLabel: string | null = null;
  pendingUserName: string | null = null;

  showValidationErrors: boolean = false;

  entrepriseId: number = 0;
  tenantId: string = '';

  editBuffer: User = {
    nom: '', email: '', password: '', departement: '', entrepriseId: 0, permissions: []
  };

  toastMessage = '';
  toastType: 'success' | 'error' | 'delete' = 'success';
  private toastTimeout: any;

  allPermissions: Permission[] = [];
  standardPermissionCodes: string[] = ['LIRE', 'MODIFIER', 'SUPPRIMER'];
  users: User[] = [];

  departements: string[] = [
    'Informatique', 'Ressources Humaines', 'Finance', 'Comptabilité',
    'Commercial', 'Marketing', 'Production', 'Logistique', 'Direction'
  ];

  constructor(
    private userService: UserService,
    private permissionService: PermissionService,
    private entrepriseService: EntrepriseService, // 🚀 INJECTÉ ICI
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const entrepriseStr = localStorage.getItem('entreprise');
      if (entrepriseStr) {
        const entreprise = JSON.parse(entrepriseStr);
        this.entrepriseId = entreprise.id;
        this.tenantId = entreprise.tenantId || entreprise.tenantID || '';
        this.loadPermissions();
        this.loadUsers();
      }
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'delete'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = ''; }, 3000);
  }

  // 🚀 MODIFIÉ : On charge uniquement les permissions de l'entreprise courante !
  loadPermissions(): void {
    this.entrepriseService.getEntreprisePermissions(this.entrepriseId).subscribe({
      next: (data: Permission[]) => { this.allPermissions = data; },
      error: (error: any) => { console.error('Erreur chargement permissions entreprise:', error); }
    });
  }

  loadUsers(): void {
    this.userService.getUsersByEntreprise(this.entrepriseId).subscribe({
      next: (data: User[]) => { this.users = data; },
      error: (error: any) => { console.error('Erreur chargement utilisateurs:', error); }
    });
  }

  togglePermissionMenu(index: number): void {
    this.openPermissionMenu = this.openPermissionMenu === index ? null : index;
  }

  hasPermission(user: User, permissionCode: string): boolean {
    return user.permissions.some(p => p.code === permissionCode);
  }

  private findPermissionByCode(code: string): Permission | undefined {
    return this.allPermissions.find(p => p.code === code);
  }

  togglePermission(userIndex: number, permissionCode: string): void {
    const user = this.users[userIndex];
    const existing = user.permissions.find(p => p.code === permissionCode);

    if (existing) {
      user.permissions = user.permissions.filter(p => p.code !== permissionCode);
      this.savePermissionsToBackend(user, 'Permission retirée avec succès.', 'delete');
    } else {
      const perm = this.findPermissionByCode(permissionCode);
      if (perm) {
        this.pendingUserIndex = userIndex;
        this.pendingPermCode = permissionCode;
        this.pendingPermLabel = perm.label;
        this.pendingUserName = user.nom;
        this.showConfirmAddPermModal = true;
      }
    }
  }

  cancelAddPermission(): void {
    this.showConfirmAddPermModal = false;
    this.pendingUserIndex = null;
    this.pendingPermCode = null;
    this.pendingPermLabel = null;
    this.pendingUserName = null;
  }

  confirmAddPermission(): void {
    if (this.pendingUserIndex !== null && this.pendingPermCode !== null) {
      const user = this.users[this.pendingUserIndex];
      const perm = this.findPermissionByCode(this.pendingPermCode);
      if (perm) {
        user.permissions = [...user.permissions, perm];
        this.savePermissionsToBackend(user, 'Permission ajoutée avec succès.', 'success');
      }
    }
    this.cancelAddPermission();
  }

  private savePermissionsToBackend(user: User, toastMessage: string, toastType: 'success' | 'delete'): void {
    if (user.id) {
      const permissionIds = user.permissions.map(p => p.id);
      this.permissionService.assignPermissionsToUser(user.id, permissionIds).subscribe({
        next: () => { this.showToast(toastMessage, toastType); },
        error: (err: any) => { this.showToast(err.error?.message || 'Erreur lors de l\'assignation des permissions', 'error'); }
      });
    }
  }

  deleteUser(index: number): void {
    this.userToDeleteIndex = index;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.userToDeleteIndex !== null) {
      const user = this.users[this.userToDeleteIndex];
      if (user.id) {
        this.userService.deleteUser(user.id, this.tenantId).subscribe({
          next: () => {
            this.users.splice(this.userToDeleteIndex!, 1);
            if (this.editingIndex === this.userToDeleteIndex) this.editingIndex = null;
            this.showDeleteModal = false;
            this.userToDeleteIndex = null;
            this.showToast('Utilisateur supprimé avec succès.', 'delete');
          },
          error: (err: any) => { this.showToast(err.error?.message || 'Erreur lors de la suppression.', 'error'); }
        });
      } else {
        this.users.splice(this.userToDeleteIndex, 1);
        this.showDeleteModal = false;
        this.userToDeleteIndex = null;
        this.showToast('Utilisateur supprimé avec succès.', 'delete');
      }
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.userToDeleteIndex = null;
  }

  startEdit(index: number): void {
    this.editingIndex = index;
    this.openPermissionMenu = null;
    this.showValidationErrors = false;
    const user = this.users[index];
    this.editBuffer = {
      id: user.id,
      nom: user.nom,
      email: user.email,
      password: '',
      departement: user.departement,
      entrepriseId: this.entrepriseId,
      tenantId: this.tenantId,
      permissions: [...user.permissions]
    };
  }

  isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  isEditValid(user: User): boolean {
    if (!this.editBuffer.nom.trim() || !this.isValidEmail(this.editBuffer.email) || !this.editBuffer.departement.trim()) {
      return false;
    }
    return true;
  }

  saveEdit(index: number): void {
    const user = this.users[index];

    if (!this.isEditValid(user)) {
      this.showValidationErrors = true;
      return;
    }

    const updatedUser: User = {
      id: user.id,
      nom: this.editBuffer.nom,
      email: this.editBuffer.email,
      password: this.editBuffer.password || user.password,
      departement: this.editBuffer.departement,
      entrepriseId: this.entrepriseId,
      tenantId: this.tenantId,
      permissions: user.permissions
    };

    if (user.id) {
      this.userService.updateUser(user.id, updatedUser, this.tenantId).subscribe({
        next: (savedUser: User) => {
          this.users[index] = savedUser;
          this.editingIndex = null;
          this.showValidationErrors = false;
          this.showToast('Utilisateur modifié avec succès.', 'success');
        },
        error: (err: any) => { this.showToast(err.error?.message || 'Erreur lors de la mise à jour.', 'error'); }
      });
    } else {
      this.userService.createUser(updatedUser).subscribe({
        next: (savedUser: User) => {
          this.users[index] = savedUser;
          this.editingIndex = null;
          this.showValidationErrors = false;
          this.showToast('Utilisateur ajouté avec succès.', 'success');
        },
        error: (err: any) => { this.showToast(err.error?.message || 'Erreur lors de la création.', 'error'); }
      });
    }
  }

  cancelEdit(): void {
    if (this.editingIndex !== null) {
      const user = this.users[this.editingIndex];
      if (!user.id) {
        this.users.splice(this.editingIndex, 1);
      }
    }
    this.editingIndex = null;
    this.showValidationErrors = false;
  }

  addUser(): void {
    if (this.editingIndex !== null) return;

    this.users.push({
      nom: '', email: '', password: '', departement: '', entrepriseId: this.entrepriseId, tenantId: this.tenantId, permissions: []
    });
    this.startEdit(this.users.length - 1);
  }
}
