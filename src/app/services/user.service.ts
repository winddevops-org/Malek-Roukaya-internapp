// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Permission } from './permission.service';

export interface User {
  id?: number;
  nom: string;
  email: string;
  password: string;
  departement: string;
  entrepriseId: number;
  tenantId?: string;
  permissions: Permission[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:8080/api'; // adapte

  constructor(private http: HttpClient) {}

  getUsersByEntreprise(entrepriseId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/entreprises/${entrepriseId}/users`);
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  // correspond à @PutMapping("/{id}/tenant/{tenantId}") dans UserController
  updateUser(id: number, user: User, tenantId: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}/tenant/${tenantId}`, user);
  }

  // correspond à @DeleteMapping("/{id}/tenant/{tenantId}")
  deleteUser(id: number, tenantId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}/tenant/${tenantId}`);
  }
}
