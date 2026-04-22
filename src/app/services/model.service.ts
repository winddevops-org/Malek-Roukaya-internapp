// src/app/services/model.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ModelType {
  id?: number;
  name: string;
  label: string;
}

export interface ModelField {
  id?: number;
  fieldId?: string;
  type: string;
  label: string;
  placeholder: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  value?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  boxed?: boolean;
  fontSize?: number;
  tableConfig?: any;
  documentKey?: string;
  shapeType?: 'rectangle';
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  backgroundColor?: string;
}

export interface DocumentModel {
  id?: number;
  name: string;
  modelType?: any;
  fields?: ModelField[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  tenantId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModelService {
  private apiUrl = 'http://localhost:8080/api/models';
  private typeUrl = 'http://localhost:8080/api/types';

  constructor(private http: HttpClient) {}

  // ✅ Modifié
  getTypes(tenantId: string): Observable<ModelType[]> {
    return this.http.get<ModelType[]>(this.typeUrl, {
      params: { tenantId }
    });
  }

  getAllModelsByTenant(tenantId: string): Observable<DocumentModel[]> {
    return this.http.get<DocumentModel[]>(this.apiUrl, {
      params: { tenantId }
    });
  }

  getModelsByType(typeId: number, tenantId: string): Observable<DocumentModel[]> {
    return this.http.get<DocumentModel[]>(`${this.apiUrl}/by-type`, {
      params: { type: typeId.toString(), tenantId }
    });
  }

  createModel(name: string, typeId: number, tenantId: string): Observable<DocumentModel> {
    return this.http.post<DocumentModel>(this.apiUrl, {
      name,
      fields: []
    }, {
      params: { typeId: typeId.toString(), tenantId }
    });
  }

  updateModel(id: number, model: any, tenantId: string): Observable<DocumentModel> {
    return this.http.put<DocumentModel>(`${this.apiUrl}/${id}`, model, {
      params: { tenantId }
    });
  }

  deleteModel(id: number, tenantId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      params: { tenantId },
      responseType: 'text' as 'json'
    });
  }

  getTrashedModels(tenantId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/trash`, {
      params: { tenantId }
    });
  }

  restoreModel(trashId: number, tenantId: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/trash/${trashId}/restore`, {}, {
      params: { tenantId },
      responseType: 'text'
    });
  }

  hardDeleteModel(trashId: number, tenantId: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/trash/${trashId}/hard`, {
      params: { tenantId },
      responseType: 'text'
    });
  }
}
