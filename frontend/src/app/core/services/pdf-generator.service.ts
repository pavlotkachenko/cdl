// ============================================
// PDF Generator Service - FULLY FIXED
// Location: frontend/src/app/core/services/pdf-generator.service.ts
// ============================================

import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CasePdfData {
  ticketNumber: string;
  type: string;
  status: string;
  citationNumber?: string;
  violationDate?: Date | string;
  location?: string;
  state?: string;
  description?: string;
  createdAt?: Date | string;
  courtDate?: Date | string;
  driverName?: string;
  assignedAttorney?: string;
  documents?: any[];
  statusHistory?: any[];
  comments?: any[];
  resolution?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  constructor() {}

  generateCasePdf(caseData: CasePdfData): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    this.addHeader(doc, yPosition);
    yPosition += 25;

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 173, 140); // Primary color
    doc.text(`Case ${caseData.ticketNumber}`, 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55); // Text color
    doc.text(`Status: ${this.formatStatus(caseData.status)}`, 20, yPosition);
    yPosition += 15;

    doc.setDrawColor(29, 173, 140); // Primary color
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    yPosition = this.addSectionTitle(doc, 'Case Information', yPosition);
    yPosition = this.addCaseInfo(doc, caseData, yPosition);
    yPosition += 10;

    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    if (caseData.statusHistory && caseData.statusHistory.length > 0) {
      yPosition = this.addSectionTitle(doc, 'Status History', yPosition);
      yPosition = this.addStatusHistory(doc, caseData.statusHistory, yPosition);
      yPosition += 10;
    }

    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    if (caseData.documents && caseData.documents.length > 0) {
      yPosition = this.addSectionTitle(doc, 'Attached Documents', yPosition);
      yPosition = this.addDocumentsList(doc, caseData.documents, yPosition);
      yPosition += 10;
    }

    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    if (caseData.comments && caseData.comments.length > 0) {
      yPosition = this.addSectionTitle(doc, 'Comments & Notes', yPosition);
      yPosition = this.addComments(doc, caseData.comments, yPosition);
      yPosition += 10;
    }

    if (caseData.resolution) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }
      yPosition = this.addSectionTitle(doc, 'Resolution', yPosition);
      yPosition = this.addResolution(doc, caseData.resolution, yPosition);
    }

    this.addFooter(doc);

    const filename = `case-${caseData.ticketNumber}-${this.getDateString()}.pdf`;
    doc.save(filename);
  }

  private addHeader(doc: jsPDF, yPosition: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 173, 140);
    doc.text('CDL Ticket Management', 20, yPosition);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Generated: ${dateStr}`, pageWidth - 20, yPosition, { align: 'right' });
  }

  private addSectionTitle(doc: jsPDF, title: string, yPosition: number): number {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 173, 140);
    doc.text(title, 20, yPosition);
    
    const textWidth = doc.getTextWidth(title);
    doc.setDrawColor(29, 173, 140);
    doc.setLineWidth(0.3);
    doc.line(20, yPosition + 1, 20 + textWidth, yPosition + 1);
    
    return yPosition + 8;
  }

  private addCaseInfo(doc: jsPDF, caseData: CasePdfData, yPosition: number): number {
    const lineHeight = 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);

    const infoItems = [
      { label: 'Ticket Number:', value: caseData.ticketNumber },
      { label: 'Type:', value: caseData.type },
      { label: 'Status:', value: this.formatStatus(caseData.status) },
      { label: 'Citation Number:', value: caseData.citationNumber || 'N/A' },
      { label: 'Violation Date:', value: this.formatDate(caseData.violationDate) },
      { label: 'Location:', value: caseData.location || 'N/A' },
      { label: 'State:', value: caseData.state || 'N/A' },
      { label: 'Submitted:', value: this.formatDate(caseData.createdAt) },
      { label: 'Court Date:', value: this.formatDate(caseData.courtDate) },
      { label: 'Assigned Attorney:', value: caseData.assignedAttorney || 'Not assigned' }
    ];

    infoItems.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.label, 25, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, 75, yPosition);
      yPosition += lineHeight;
    });

    if (caseData.description) {
      yPosition += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Description:', 25, yPosition);
      yPosition += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(caseData.description, 150);
      doc.text(descLines, 25, yPosition);
      yPosition += descLines.length * lineHeight;
    }

    return yPosition;
  }

  private addStatusHistory(doc: jsPDF, history: any[], yPosition: number): number {
    const tableData = history.map(h => [
      this.formatDateTime(h.timestamp),
      this.formatStatus(h.status),
      h.note || '-'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date/Time', 'Status', 'Notes']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [29, 173, 140],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246]
      },
      margin: { left: 20, right: 20 },
      styles: {
        fontSize: 9,
        cellPadding: 5
      }
    });

    return (doc as any).lastAutoTable.finalY + 5;
  }

  private addDocumentsList(doc: jsPDF, documents: any[], yPosition: number): number {
    const tableData = documents.map(d => [
      d.fileName || 'Unnamed',
      this.formatFileSize(d.fileSize || 0),
      this.formatDate(d.uploadedAt)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['File Name', 'Size', 'Upload Date']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [29, 173, 140],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246]
      },
      margin: { left: 20, right: 20 },
      styles: {
        fontSize: 9,
        cellPadding: 5
      }
    });

    return (doc as any).lastAutoTable.finalY + 5;
  }

  private addComments(doc: jsPDF, comments: any[], yPosition: number): number {
    const lineHeight = 6;
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFontSize(9);

    comments.forEach((comment, index) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 173, 140);
      doc.text(comment.author || 'Unknown', 25, yPosition);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(this.formatDateTime(comment.timestamp), 100, yPosition);
      yPosition += lineHeight;

      doc.setTextColor(31, 41, 55);
      const commentLines = doc.splitTextToSize(comment.text, 150);
      doc.text(commentLines, 25, yPosition);
      yPosition += commentLines.length * lineHeight + 5;

      if (index < comments.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(25, yPosition, 185, yPosition);
        yPosition += 5;
      }
    });

    return yPosition;
  }

  private addResolution(doc: jsPDF, resolution: string, yPosition: number): number {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(29, 173, 140);
    doc.setLineWidth(0.5);
    
    const resolutionLines = doc.splitTextToSize(resolution, 150);
    const boxHeight = (resolutionLines.length * 6) + 10;
    
    doc.rect(20, yPosition - 5, 170, boxHeight, 'FD');
    
    doc.text(resolutionLines, 25, yPosition);
    
    return yPosition + boxHeight;
  }

  private addFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      
      doc.text('CONFIDENTIAL - For Attorney Use Only', 20, pageHeight - 10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
    }
  }

  generateSummaryPdf(cases: any[], title: string = 'Cases Summary'): void {
    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 173, 140);
    doc.text(title, 20, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;

    doc.setDrawColor(29, 173, 140);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    const stats = this.calculateStats(cases);
    yPosition = this.addSummaryStats(doc, stats, yPosition);
    yPosition += 10;

    const tableData = cases.map(c => [
      c.ticketNumber || c.id?.substring(0, 8) || 'N/A',
      c.type || 'N/A',
      this.formatStatus(c.status),
      this.formatDate(c.violationDate || c.createdAt),
      c.location || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Ticket #', 'Type', 'Status', 'Date', 'Location']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [29, 173, 140],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246]
      },
      margin: { left: 20, right: 20 },
      styles: {
        fontSize: 9,
        cellPadding: 5
      }
    });

    this.addFooter(doc);

    const filename = `cases-summary-${this.getDateString()}.pdf`;
    doc.save(filename);
  }

  private addSummaryStats(doc: jsPDF, stats: any, yPosition: number): number {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    const statsText = [
      `Total Cases: ${stats.total}`,
      `Active: ${stats.active}`,
      `Resolved: ${stats.resolved}`,
      `Pending: ${stats.pending}`
    ];

    statsText.forEach(text => {
      doc.text(text, 25, yPosition);
      yPosition += 7;
    });

    return yPosition;
  }

  private calculateStats(cases: any[]): any {
    return {
      total: cases.length,
      active: cases.filter(c => ['under_review', 'in_progress'].includes(c.status)).length,
      resolved: cases.filter(c => c.status === 'resolved').length,
      pending: cases.filter(c => ['new', 'submitted', 'waiting_for_driver'].includes(c.status)).length
    };
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'new': 'New',
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'rejected': 'Rejected',
      'waiting_for_driver': 'Waiting for Info'
    };
    return statusMap[status] || status;
  }

  private formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}
