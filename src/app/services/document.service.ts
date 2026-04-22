import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentEntity } from '../models/interfaces/document.interface';

export interface ModelType {
  id?: number;
  name: string;
  label: string;
}

export interface DocumentModel {
  id?: number;
  name: string;
  modelType?: ModelType;
  fields?: any[];
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  private baseApiUrl = 'http://localhost:8080/api';
  private documentsApiUrl = 'http://localhost:8080/api/documents';

  constructor(private http: HttpClient) {}

  // ========= TYPES =========

  getModelTypes(tenantId: string): Observable<ModelType[]> {
    return this.http.get<ModelType[]>(`${this.baseApiUrl}/types`, {
      params: { tenantId }
    });
  }

  saveType(type: ModelType, tenantId: string): Observable<ModelType> {
    return this.http.post<ModelType>(`${this.baseApiUrl}/types`, type, {
      params: { tenantId }
    });
  }

  updateType(type: ModelType, tenantId: string): Observable<ModelType> {
    return this.http.put<ModelType>(`${this.baseApiUrl}/types/${type.id}`, type, {
      params: { tenantId }
    });
  }

  deleteType(id: number, tenantId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseApiUrl}/types/${id}`, {
      params: { tenantId }
    });
  }

  // ========= MODELS (gabarits) =========
  getModelsByType(typeId: number, tenantId: string): Observable<DocumentModel[]> {
    return this.http.get<DocumentModel[]>(`${this.baseApiUrl}/models/by-type`, {
      params: { type: typeId.toString(), tenantId }
    });
  }

  createModel(name: string, typeId: number, tenantId: string): Observable<DocumentModel> {
    const model = { name, modelType: { id: typeId } };
    return this.http.post<DocumentModel>(`${this.baseApiUrl}/models`, model, {
      params: { typeId: typeId.toString(), tenantId }
    });
  }

  updateModel(id: number, model: DocumentModel, tenantId: string): Observable<DocumentModel> {
    return this.http.put<DocumentModel>(`${this.baseApiUrl}/models/${id}`, model, {
      params: { tenantId }
    });
  }

  deleteModel(id: number, tenantId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/models/${id}`, {
      params: { tenantId }
    });
  }

  // ========= DOCUMENTS RÉELS (factures remplies) =========
  createDocument(doc: DocumentEntity, tenantId: string): Observable<DocumentEntity> {
    return this.http.post<DocumentEntity>(this.documentsApiUrl, doc, {
      params: { tenantId }
    });
  }

  getDocumentsByType(typeId: number, tenantId: string): Observable<DocumentEntity[]> {
    return this.http.get<DocumentEntity[]>(this.documentsApiUrl, {
      params: { typeId: typeId.toString(), tenantId }
    });
  }

  deleteDocument(id: number, tenantId: string): Observable<void> {
    return this.http.delete<void>(`${this.documentsApiUrl}/${id}`, {
      params: { tenantId }
    });
  }
}
