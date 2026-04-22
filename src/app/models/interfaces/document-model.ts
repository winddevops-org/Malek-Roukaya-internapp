export interface ModelType {
  id?: number;
  name: string;
  label: string;
}

export interface DocumentModel {
  id?: number;
  name: string;
  type: ModelType; 
  fields?: any[];  
}