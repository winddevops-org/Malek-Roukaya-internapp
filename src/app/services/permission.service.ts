// src/app/services/permission.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Permission {
  id: number;
  code: string;
  label: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private apiUrl = 'http://localhost:8080/api'; // adapte si besoin

  constructor(private http: HttpClient) {}

  // Liste TOUTES les permissions globales
  listPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions`);
  }

  // Créer une permission globale
  createCustomPermission(code: string, label: string): Observable<Permission> {
    return this.http.post<Permission>(`${this.apiUrl}/permissions/custom`, { code, label });
  }

  // Supprimer une permission globale
  deletePermission(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/permissions/${id}`);
  }

  // Affecter des permissions (liste d'id) à un user
  assignPermissionsToUser(userId: number, permissionIds: number[]): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/${userId}/permissions`,
      { permissionIds }
    );
  }
}
