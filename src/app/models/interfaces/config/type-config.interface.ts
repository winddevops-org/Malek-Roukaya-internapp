export interface TypeField {
  id?: number;
  fieldName: string;
  fieldOrder?: number;
  fieldType?: string;    // 'text', 'date', 'table'
  tableColumns?: string; // Chaîne JSON (ex: "['Description', 'Prix']")
  
  // Propriété temporaire purement front-end pour manipuler la liste facilement
  _columnsArray?: string[]; 
}

export interface TypeConfig {
  typeId: number;
  fields: TypeField[];
}