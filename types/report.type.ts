/**
 * Report Types
 * Type definitions for revenue reporting and analytics
 */

// Daily Revenue Record
export interface DailyRevenue {
  dailyRevenueId: string;
  date: string; // YYYY-MM-DD format
  totalRevenue: number; // Gross revenue
  totalOrders: number;
  totalSpending: number; // Total spendings for the day
  netRevenue: number; // totalRevenue - totalSpending
  createdAt: string;
  updatedAt?: string;
}

// Firestore structure (without dailyRevenueId)
export type FirestoreDailyRevenue = Omit<DailyRevenue, 'dailyRevenueId'>;

// Report filter period
export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

// Report filter
export interface ReportFilter {
  period: ReportPeriod;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

// Report summary
export interface ReportSummary {
  totalRevenue: number;
  totalSpending: number;
  netRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

// Report data with pagination
export interface ReportData {
  dailyRevenues: DailyRevenue[];
  summary: ReportSummary;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
