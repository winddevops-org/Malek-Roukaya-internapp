// src/app/services/entreprise.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Entreprise {
  id?: number;
  nom: string;
  matriculeFiscale: string;
  email: string;
  password: string;
  telephone: string;
  gouvernorat: string;
  ville: string;
  statut?: 'EN_ATTENTE' | 'ACTIVE' | 'REFUSE';
  dateInscription?: string;
  dateValidation?: string;
  permissions?: any[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  type: 'ENTREPRISE' | 'USER' | 'SUPER_ADMIN';
  id: number;
  nom: string;
  email: string;
  matriculeFiscale?: string;
  departement?: string;
  entrepriseId?: number;
  permissions?: string[];
  tenantId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EntrepriseService {
  private apiUrl = 'http://localhost:8080/api/entreprises';
  private authUrl = 'http://localhost:8080/api/auth';
  private passwordResetUrl = 'http://localhost:8080/api/password-reset';

  constructor(private http: HttpClient) {}

  inscription(entreprise: Entreprise): Observable<Entreprise> {
    return this.http.post<Entreprise>(`${this.apiUrl}/inscription`, entreprise);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, credentials);
  }

  connexion(credentials: LoginRequest): Observable<Entreprise> {
    return this.http.post<Entreprise>(`${this.apiUrl}/connexion`, credentials);
  }

  requestOTP(email: string): Observable<any> {
    return this.http.post(`${this.passwordResetUrl}/request-otp`, { email });
  }

  verifyOTP(email: string, otpCode: string): Observable<any> {
    return this.http.post(`${this.passwordResetUrl}/verify-otp`, { email, otpCode });
  }

  resetPassword(email: string, otpCode: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.passwordResetUrl}/reset-password`, {
      email,
      otpCode,
      newPassword
    });
  }

  getDemandesEnAttente(): Observable<Entreprise[]> {
    return this.http.get<Entreprise[]>(`${this.apiUrl}/en-attente`);
  }

  getEntreprisesActives(): Observable<Entreprise[]> {
    return this.http.get<Entreprise[]>(`${this.apiUrl}/actives`);
  }

  accepterEntreprise(id: number): Observable<Entreprise> {
    return this.http.put<Entreprise>(`${this.apiUrl}/${id}/accepter`, {});
  }

  refuserEntreprise(id: number): Observable<Entreprise> {
    return this.http.put<Entreprise>(`${this.apiUrl}/${id}/refuser`, {});
  }

  getAllEntreprises(): Observable<Entreprise[]> {
    return this.http.get<Entreprise[]>(this.apiUrl);
  }

  supprimerEntreprise(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  assignPermissionsToEntreprise(entrepriseId: number, permissionIds: number[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/${entrepriseId}/permissions`, permissionIds);
  }

  // 🚀 NOUVEAU : Récupérer uniquement les permissions de l'entreprise
  getEntreprisePermissions(entrepriseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${entrepriseId}/permissions`);
  }

  verifierEntrepriseIA(entrepriseData: any): Observable<any> {
    return this.http.post('http://localhost:8080/api/ai/verify', entrepriseData);
  }
}
