// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AcceuilComponent } from './acceuil/acceuil.component';
import { AdminComponent } from './admin/admin.component';
import { SuperAdminComponent } from './super-admin/super-admin.component';
import { UtilisateursComponent } from './admin/utilisateurs/utilisateurs.component';
import { UserComponent } from './user/user.component';

// Container de modèles du 2e module (même pour admin et user)
import { ModelsContainerComponent } from './models/models-container/models-container.component';

export const routes: Routes = [
  { path: '', component: AcceuilComponent },

  // ===== ADMIN =====
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      { path: '', redirectTo: 'utilisateurs', pathMatch: 'full' },
      { path: 'utilisateurs', component: UtilisateursComponent },
      { path: 'modeles', component: ModelsContainerComponent } // /admin/modeles
    ]
  },

  // ===== USER =====
  {
    path: 'user',
    component: UserComponent,
    children: [
      { path: '', redirectTo: 'modeles', pathMatch: 'full' },
      { path: 'modeles', component: ModelsContainerComponent } // /user/modeles
    ]
  },

  { path: 'super-admin', component: SuperAdminComponent }
];