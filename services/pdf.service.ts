import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface ReportData {
  summary: {
    totalRevenue: number;
    totalSpending: number;
    netRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  startDate: string;
  endDate: string;
}

class PDFService {
  private templateCache: string | null = null;
  private logoBase64Cache: string | null = null;

  async loadLogo(): Promise<string> {
    if (this.logoBase64Cache) {
      return this.logoBase64Cache;
    }

    try {
      const logo = require('../assets/logo.png');
      const asset = Asset.fromModule(logo);
      await asset.downloadAsync();
      
      if (asset.localUri) {
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        this.logoBase64Cache = `data:image/png;base64,${base64}`;
        return this.logoBase64Cache;
      }
      
      throw new Error('Failed to load logo');
    } catch (error) {
      console.error('Error loading logo:', error);
      // Return empty string if logo fails to load
      return '';
    }
  }

  async loadTemplate(): Promise<string> {
    if (this.templateCache) {
      return this.templateCache;
    }

    try {
      const template = require('../templates/report-template.html');
      const asset = Asset.fromModule(template);
      await asset.downloadAsync();
      
      if (asset.localUri) {
        this.templateCache = await FileSystem.readAsStringAsync(asset.localUri);
        return this.templateCache;
      }
      
      throw new Error('Failed to load template');
    } catch (error) {
      console.error('Error loading template:', error);
      throw error;
    }
  }

  async generateReportHTML(data: ReportData): Promise<string> {
    const template = await this.loadTemplate();
    const logoBase64 = await this.loadLogo();
    
    // Format currency helper
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };
    
    // Format date helper
    const formatDate = (dateStr: string): string => {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    };
    
    // Format datetime helper
    const formatDateTime = (date: Date): string => {
      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    };
    
    // Get period text
    const getPeriodText = (): string => {
      return `${formatDate(data.startDate)} - ${formatDate(data.endDate)}`;
    };
    
    // Replace all placeholders with actual data
    let html = template
      .replace('{{logoBase64}}', logoBase64)
      .replace('{{currentDate}}', formatDateTime(new Date()))
      .replace('{{periodText}}', getPeriodText())
      .replace('{{totalRevenue}}', formatCurrency(data.summary.totalRevenue))
      .replace('{{totalSpending}}', formatCurrency(data.summary.totalSpending))
      .replace('{{netRevenue}}', formatCurrency(data.summary.netRevenue))
      .replace('{{totalOrders}}', data.summary.totalOrders.toString())
      .replace('{{averageOrderValue}}', formatCurrency(data.summary.averageOrderValue))
      .replace('{{year}}', new Date().getFullYear().toString());
    
    return html;
  }

  async generateAndSharePDF(data: ReportData): Promise<void> {
    try {
      const html = await this.generateReportHTML(data);
      
      // Generate PDF with a better filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Laporan-Pendapatan-${timestamp}.pdf`;
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 595, // A4 width in points
        height: 842, // A4 height in points
      });

      // Share the PDF directly
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Bagikan Laporan Pendapatan',
          UTI: 'com.adobe.pdf',
        });
      } else {
        throw new Error('Sharing tidak tersedia di perangkat ini');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  async printPDF(data: ReportData): Promise<void> {
    try {
      const html = await this.generateReportHTML(data);
      
      if (Platform.OS === 'web') {
        // For web platform, open print dialog
        await Print.printAsync({
          html,
        });
      } else {
        // For mobile platforms, generate and share PDF
        await this.generateAndSharePDF(data);
      }
    } catch (error) {
      console.error('Error printing PDF:', error);
      throw error;
    }
  }
}

export const pdfService = new PDFService();