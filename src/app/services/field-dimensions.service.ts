import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FieldDimensions } from '../models/interfaces/field-dimensions.interface';

@Injectable({
  providedIn: 'root'
})
export class FieldDimensionsService {
  private apiUrl = 'http://localhost:8080/api/field-dimensions';
  private userId = 'user123'; // À remplacer par l'utilisateur connecté

  constructor(private http: HttpClient) {}

  saveDimensions(fieldName: string, x: number, y: number, 
                 width: number, height: number): Observable<FieldDimensions> {
    const dto = { fieldName, positionX: x, positionY: y, width, height };
    return this.http.post<FieldDimensions>(
      `${this.apiUrl}/save?userId=${this.userId}`, 
      dto
    );
  }

  getAllDimensions(): Observable<FieldDimensions[]> {
    return this.http.get<FieldDimensions[]>(
      `${this.apiUrl}/get-all?userId=${this.userId}`
    );
  }

  getDimension(fieldName: string): Observable<FieldDimensions> {
    return this.http.get<FieldDimensions>(
      `${this.apiUrl}/${fieldName}?userId=${this.userId}`
    );
  }
}