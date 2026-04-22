import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  
  async exportCanvasToPdf(
    canvasElement: HTMLElement,
    filename: string = 'model.pdf'
  ): Promise<void> {
    try {
      // 1. Convertit le HTML en image
      const canvas = await html2canvas(canvasElement, {
        allowTaint: true,
        useCORS: true,
        scale: 2
      });

      // 2. Crée un PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // 3. Ajoute l'image au PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // 4. Télécharge le PDF
      pdf.save(filename);
      console.log(`✅ PDF exporté : ${filename}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'export PDF:', error);
    }
  }
}