import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModelField } from '../../services/model.service';
import { DocumentData } from '../interfaces/document-data.interface';

export interface ModelData {
  id: number;
  name: string;
  type: string;
  updatedAt: string;
  fields?: ModelField[];
}

@Component({
  selector: 'app-model-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './model-viewer.component.html',
  styleUrls: ['./model-viewer.component.css']
})
export class ModelViewerComponent {
  @Input() model!: ModelData;
  @Input() documentData: DocumentData | null = null;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onPrint() {
    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) return;

    const fieldsHtml = (this.model.fields ?? []).map(field => {
      const f = field as any;
      const style = `left:${field.x}px;top:${field.y}px;width:${field.width}px;height:${field.height}px;`;
      const value = this.getFieldDisplayValue(field);
      const fontWeight  = field.bold      ? '700'       : '400';
      const fontStyle   = field.italic    ? 'italic'    : 'normal';
      const textDecor   = field.underline ? 'underline' : 'none';
      const fontSize    = field.fontSize  ? `${field.fontSize}px` : '13px';
      const border      = field.boxed     ? '1px solid #0f172a' : 'none';
      const borderRadius = field.boxed    ? '4px'       : '0';
      const inputStyle  = `width:100%;height:100%;border:${border};border-radius:${borderRadius};outline:none;font-family:'DM Sans',Arial,sans-serif;font-size:${fontSize};font-weight:${fontWeight};font-style:${fontStyle};text-decoration:${textDecor};padding:8px 10px;box-sizing:border-box;background:transparent;color:#111827;resize:none;`;

      if (field.type === 'shape-rect') {
        const bw = f.borderWidth  ?? 2;
        const bc = f.borderColor  ?? '#0f172a';
        const br = f.borderRadius ?? 0;
        const bg = f.backgroundColor && f.backgroundColor !== 'transparent' ? f.backgroundColor : 'transparent';
        const shapeStyle = `position:absolute;inset:0;box-sizing:border-box;border:${bw}px solid ${bc};border-radius:${br}px;background:${bg};`;
        return `<div style="position:absolute;overflow:visible;box-sizing:border-box;${style}"><div style="${shapeStyle}"></div></div>`;
      }

      if (field.type === 'textarea') {
        return `<div style="position:absolute;box-sizing:border-box;${style}"><textarea readonly disabled style="${inputStyle}">${this.escapeHtml(value)}</textarea></div>`;
      }

      if (field.type === 'checkbox') {
        const checked = value === 'true' ? 'checked' : '';
        return `<div style="position:absolute;box-sizing:border-box;display:flex;align-items:center;justify-content:center;${style}"><input type="checkbox" ${checked} disabled/></div>`;
      }

      if (field.type === 'image') {
        if (field.value) {
          return `<div style="position:absolute;box-sizing:border-box;${style}"><img src="${field.value}" style="width:100%;height:100%;object-fit:contain;display:block;" /></div>`;
        }
        return `<div style="position:absolute;box-sizing:border-box;${style}"></div>`;
      }

      if (field.type === 'table') {
        // Affichage du tableau, toujours au moins header+1 ligne
        let tableData = this.getTableData(field);
        let tableHeaders = this.getTableHeaders(field, tableData);
        // Fallback une ligne vide si pas de data
        if (!tableData || tableData.length === 0) {
          tableData = [this.createEmptyRow(tableHeaders)];
        }

        let tableHtml = '<table style="width:100%;border-collapse:collapse;font-family:DM Sans,sans-serif;font-size:13px;">';
        if (tableHeaders.length > 0) {
          tableHtml += '<thead><tr>';
          for (const header of tableHeaders) {
            tableHtml += `<th style="border:1px solid #1e293b;background:#f1f5f9;font-weight:600;padding:6px 8px;">${header}</th>`;
          }
          tableHtml += '</tr></thead>';
        }
        tableHtml += '<tbody>';
        for (const row of tableData) {
          tableHtml += '<tr>';
          for (const header of tableHeaders) {
            tableHtml += `<td style="border:1px solid #1e293b;padding:6px 8px;background:#fff;">${row[header] ?? ''}</td>`;
          }
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        return `<div style="position:absolute;box-sizing:border-box;${style}">${tableHtml}</div>`;
      }

      const inputType = field.type === 'date' ? 'date' : 'text';
      return `<div style="position:absolute;box-sizing:border-box;${style}"><input type="${inputType}" value="${this.escapeHtml(value)}" readonly disabled style="${inputStyle}" /></div>`;
    }).join('\n');

    printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Impression – ${this.model?.name ?? 'Modèle'}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      position: relative;
      width: 794px;
      height: 1123px;
      background: #ffffff;
      margin: 0 auto;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="page">
    ${fieldsHtml}
  </div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`);

    printWindow.document.close();
  }

  private escapeHtml(value: string): string {
    return (value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  onExportPDF() {
    this.onPrint();
  }

  getFieldDisplayValue(field: ModelField): string {
    const anyField = field as any;
    let value: any = field.value ?? '';
    if (
      this.documentData &&
      anyField.documentKey &&
      this.documentData.hasOwnProperty(anyField.documentKey)
    ) {
      value = this.documentData[anyField.documentKey];
    }
    else if (
      this.documentData &&
      field.label &&
      this.documentData.hasOwnProperty(field.label)
    ) {
      value = this.documentData[field.label];
    }
    if (field.type === 'checkbox') {
      return value === true || value === 'true' ? 'true' : '';
    }
    if (field.type === 'date') {
      return this.normalizeDateForInput(value);
    }
    if (typeof value === 'object' && value !== null) {
      try { return JSON.stringify(value); } catch { return ''; }
    }
    return value ?? '';
  }

  getFieldStyle(field: ModelField): { [key: string]: string | number } {
    const style: { [key: string]: string | number } = {};
    if (field.bold)       style['font-weight']     = '700';
    else                  style['font-weight']     = '400';
    if (field.italic)     style['font-style']      = 'italic';
    else                  style['font-style']      = 'normal';
    if (field.underline)  style['text-decoration'] = 'underline';
    else                  style['text-decoration'] = 'none';
    if (field.fontSize)   style['font-size.px']    = field.fontSize;
    if (field.boxed) {
      style['border']         = '1px solid #0f172a';
      style['border-radius']  = '4px';
    } else {
      style['border']         = 'none';
      style['border-radius']  = '0';
    }
    return style;
  }

  getShapeStyle(field: ModelField): { [key: string]: string | number } {
    const style: { [key: string]: string | number } = {};
    const borderWidth    = (field as any).borderWidth ?? 1;
    const borderColor    = (field as any).borderColor ?? '#0f172a';
    const borderRadius   = (field as any).borderRadius ?? 0;
    const backgroundColor= (field as any).backgroundColor ?? 'transparent';
    style['border']              = `${borderWidth}px solid ${borderColor}`;
    style['border-radius.px']    = borderRadius;
    style['background-color']    = backgroundColor;
    return style;
  }

  private normalizeDateForInput(value: string | undefined | null): string {
    if (!value) return '';
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (isoDateRegex.test(value)) {
      return value;
    }
    const partsSlash = value.split('/');
    if (partsSlash.length === 3) {
      const [d, m, y] = partsSlash;
      if (d.length <= 2 && m.length <= 2 && y.length === 4) {
        const dd = d.padStart(2, '0');
        const mm = m.padStart(2, '0');
        return `${y}-${mm}-${dd}`;
      }
    }
    const partsDash = value.split('-');
    if (partsDash.length === 3) {
      const [a, b, c] = partsDash;
      if (a.length <= 2 && c.length === 4) {
        const dd = a.padStart(2, '0');
        const mm = b.padStart(2, '0');
        return `${c}-${mm}-${dd}`;
      }
    }
    return '';
  }

  // Renvoie toujours une liste (data document > data modèle > [1 ligne vide])
  getTableData(field: any): any[] {
    if (field.type === 'table' && this.documentData && field.documentKey && this.documentData[field.documentKey]) {
      const data = this.documentData[field.documentKey];
      return Array.isArray(data) ? data : [];
    }
    if (field.tableConfig && Array.isArray(field.tableConfig.data) && field.tableConfig.headers) {
      return field.tableConfig.data.length > 0
        ? field.tableConfig.data.map((row: any[] | object) => {
            if (Array.isArray(row)) {
              const obj: any = {};
              field.tableConfig.headers.forEach((h: string, idx: number) => { obj[h] = row[idx] !== undefined ? row[idx] : ""; });
              return obj;
            }
            return row;
          })
        : []; // PAS de ligne par défaut, gérée via createEmptyRow
    }
    return [];
  }

  // Toujours au moins les headers (important pour structure)
  getTableHeaders(field: any, data: any[]): string[] {
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
    return field.tableConfig?.headers || [];
  }

  // Pour ligne vide quand pas de data (table consult)
  createEmptyRow(headers: string[]): any {
    const obj: any = {};
    headers.forEach(h => obj[h] = "");
    return obj;
  }
}
