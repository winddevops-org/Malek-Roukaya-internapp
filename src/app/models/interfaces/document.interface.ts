import { DocumentData } from './document-data.interface';

export interface DocumentEntity {
  id?: number;
  typeId: number;
  typeName?: string;

  name: string;          // nom de la facture/document

  data: DocumentData;
  tenantId?: string;     // ✅ NOUVEAU : Ajout de tenantId
  createdAt?: string;
  updatedAt?: string;
}
