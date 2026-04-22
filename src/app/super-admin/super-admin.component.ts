// src/app/super-admin/super-admin.component.ts
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { EntrepriseService, Entreprise } from '../services/entreprise.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { PermissionsAdminComponent } from '../admin/permission-admin/permission-admin.component';
import { PermissionService, Permission } from '../services/permission.service';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, NavbarComponent, PermissionsAdminComponent],
  templateUrl: './super-admin.component.html',
  styleUrls: ['./super-admin.component.css']
})
export class SuperAdminComponent implements OnInit {

  activeTab: 'demandes' | 'entreprises' | 'permissions' = 'demandes';

  demandes: Entreprise[] = [];
  entreprisesActives: Entreprise[] = [];

  selectedEntreprise: Entreprise | null = null;
  entrepriseToDelete: Entreprise | null = null;

  loading = false;
  error = '';
  showSuccessOverlay = false;
  successMessage = '';

  // IA
  showAIModal = false;
  entrepriseToVerify: Entreprise | null = null;
  loadingAI = false;
  aiResult = '';
  aiError = '';
  aiIsSafe = true;

  // 🚀 PERMISSIONS ENTREPRISE
  allPermissions: Permission[] = [];
  showPermModal = false;
  selectedEntrepriseForPerms: Entreprise | null = null;
  selectedPermIds: number[] = [];

  constructor(
    private entrepriseService: EntrepriseService,
    private permissionService: PermissionService, // 🚀 Injecté
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDemandes();
      this.loadEntreprisesActives();
      this.loadPermissions(); // 🚀
    }
  }

  // 🚀 Charger toutes les permissions disponibles
  loadPermissions(): void {
    this.permissionService.listPermissions().subscribe({
      next: (data) => this.allPermissions = data,
      error: (err) => console.error('Erreur chargement permissions', err)
    });
  }

  switchTab(tab: 'demandes' | 'entreprises' | 'permissions'): void {
    this.activeTab = tab;
  }

  loadDemandes(): void {
    this.loading = true;
    this.error = '';
    this.entrepriseService.getDemandesEnAttente().subscribe({
      next: (data: Entreprise[]) => {
        this.demandes = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Erreur getDemandesEnAttente:', err);
        this.error = 'Erreur lors du chargement des demandes.';
        this.loading = false;
      }
    });
  }

  loadEntreprisesActives(): void {
    this.entrepriseService.getEntreprisesActives().subscribe({
      next: (data: Entreprise[]) => {
        this.entreprisesActives = data;
      },
      error: (err: any) => {
        console.error('❌ Erreur getEntreprisesActives:', err);
      }
    });
  }

  openDetails(entreprise: Entreprise): void {
    this.selectedEntreprise = entreprise;
  }

  closeModal(): void {
    this.selectedEntreprise = null;
  }

  accepter(id: number): void {
    if (id == null) return;
    this.loading = true;
    this.entrepriseService.accepterEntreprise(id).subscribe({
      next: () => {
        this.successMessage = 'Entreprise acceptée avec succès.';
        this.showSuccessOverlay = true;
        this.loading = false;
        this.selectedEntreprise = null;
        this.loadDemandes();
        this.loadEntreprisesActives();
      },
      error: (err: any) => {
        console.error('❌ Erreur accepterEntreprise:', err);
        this.error = err.error?.message || 'Erreur lors de l’acceptation.';
        this.loading = false;
      }
    });
  }

  refuser(id: number): void {
    if (id == null) return;
    this.loading = true;
    this.entrepriseService.refuserEntreprise(id).subscribe({
      next: () => {
        this.successMessage = 'Entreprise refusée.';
        this.showSuccessOverlay = true;
        this.loading = false;
        this.selectedEntreprise = null;
        this.loadDemandes();
        this.loadEntreprisesActives();
      },
      error: (err: any) => {
        console.error('❌ Erreur refuserEntreprise:', err);
        this.error = err.error?.message || 'Erreur lors du refus.';
        this.loading = false;
      }
    });
  }

  confirmDelete(entreprise: Entreprise): void {
    this.entrepriseToDelete = entreprise;
  }

  cancelDelete(): void {
    this.entrepriseToDelete = null;
  }

  deleteEntreprise(): void {
    if (!this.entrepriseToDelete || this.entrepriseToDelete.id == null) return;

    this.entrepriseService.supprimerEntreprise(this.entrepriseToDelete.id).subscribe({
      next: () => {
        this.successMessage = 'Entreprise supprimée avec succès.';
        this.showSuccessOverlay = true;
        this.entrepriseToDelete = null;
        this.loadDemandes();
        this.loadEntreprisesActives();
      },
      error: (err: any) => {
        console.error('❌ Erreur supprimerEntreprise:', err);
        this.error = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  closeSuccessOverlay(): void {
    this.showSuccessOverlay = false;
    this.successMessage = '';
  }

  // 🚀 GESTION DES PERMISSIONS
  openPermModal(entreprise: Entreprise): void {
    this.selectedEntrepriseForPerms = entreprise;
    this.selectedPermIds = entreprise.permissions ? entreprise.permissions.map((p: any) => p.id) : [];
    this.showPermModal = true;
  }

  closePermModal(): void {
    this.showPermModal = false;
    this.selectedEntrepriseForPerms = null;
  }

  togglePerm(permId: number): void {
    const idx = this.selectedPermIds.indexOf(permId);
    if (idx > -1) {
      this.selectedPermIds.splice(idx, 1);
    } else {
      this.selectedPermIds.push(permId);
    }
  }

  savePerms(): void {
    if (!this.selectedEntrepriseForPerms?.id) return;
    this.entrepriseService.assignPermissionsToEntreprise(this.selectedEntrepriseForPerms.id, this.selectedPermIds).subscribe({
      next: () => {
        this.successMessage = 'Permissions mises à jour avec succès.';
        this.showSuccessOverlay = true;
        this.closePermModal();
        this.loadEntreprisesActives();
      },
      error: (err: any) => {
        console.error(err);
        this.error = 'Erreur lors de la mise à jour des permissions.';
      }
    });
  }

  // IA modal
  verifyWithAI(entreprise: Entreprise): void {
    this.entrepriseToVerify = entreprise;
    this.showAIModal = true;
    this.loadingAI = true;
    this.aiResult = '';
    this.aiError = '';
    this.aiIsSafe = true;

    const payload = {
      id: entreprise.id,
      nom: entreprise.nom,
      email: entreprise.email,
      matriculeFiscale: entreprise.matriculeFiscale,
      ville: entreprise.ville,
      gouvernorat: entreprise.gouvernorat
    };

    this.entrepriseService.verifierEntrepriseIA(payload).subscribe({
      next: (resp: any) => {
        this.aiResult = resp.message || resp.texte || resp.resultat || JSON.stringify(resp);
        this.aiIsSafe = resp.isSafe ?? resp.estValide ?? true;
        this.loadingAI = false;
      },
      error: (err: any) => {
        console.error('❌ Erreur verifierEntrepriseIA:', err);
        this.aiError = err.error?.message || 'Erreur lors de l’analyse automatique.';
        this.loadingAI = false;
      }
    });
  }

  closeAIModal(): void {
    this.showAIModal = false;
    this.entrepriseToVerify = null;
    this.aiResult = '';
    this.aiError = '';
  }
}
