import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TypeConfig, TypeField } from '../models/interfaces/config/type-config.interface';

@Injectable({
  providedIn: 'root'
})
export class TypeFieldsService {

  private apiUrl = 'http://localhost:8080/api/document-types';

  constructor(private http: HttpClient) {}

  getConfig(typeId: number): Observable<TypeConfig> {
    return this.http.get<TypeConfig>(`${this.apiUrl}/config`, {
      params: { typeId: typeId.toString() }
    });
  }

  saveConfig(typeId: number, fields: TypeField[]): Observable<TypeConfig> {
    const payload: TypeConfig = {
      typeId,
      fields
    };

    return this.http.post<TypeConfig>(
      `${this.apiUrl}/config`,
      payload,
      { params: { typeId: typeId.toString() } }
    );
  }
}