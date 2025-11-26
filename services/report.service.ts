import { db } from '@/config/firebase';
import type { FirestoreOrder, Order } from '@/types/order.type';
import type { ApiResponse, DateRangeFilter, SpendingReport } from '@/types/report.type';
import {
    collection,
    getDocs,
    orderBy,
    query,
    where
} from 'firebase/firestore';

/**
 * Report Service Layer
 * Handles all Firebase Firestore operations for reports and analytics
 */
export const reportService = {
  /**
   * Get spending report by date range
   */
  async getSpendingReport(dateRange: DateRangeFilter): Promise<ApiResponse<SpendingReport>> {
    try {
      // Convert dates to ISO strings for comparison
      const startDateISO = dateRange.startDate.toISOString();
      const endDateISO = new Date(dateRange.endDate.setHours(23, 59, 59, 999)).toISOString();

      // Query orders within date range
      const q = query(
        collection(db, 'orders'),
        where('createdAt', '>=', startDateISO),
        where('createdAt', '<=', endDateISO),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      const orders: Order[] = snapshot.docs.map((doc) => ({
        orderId: doc.id,
        ...(doc.data() as FirestoreOrder),
      }));

      // Calculate totals
      const totalOrders = orders.length;
      const totalSpending = orders.reduce((sum, order) => sum + order.totalAmount, 0);

      const report: SpendingReport = {
        orders,
        totalOrders,
        totalSpending,
        dateRange,
      };

      return {
        success: true,
        data: report,
      };
    } catch (error) {
      console.error('Error fetching spending report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat laporan belanja',
      };
    }
  },

  /**
   * Get spending report for today
   */
  async getTodaySpendingReport(): Promise<ApiResponse<SpendingReport>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    return this.getSpendingReport({
      startDate: today,
      endDate: endDate,
    });
  },

  /**
   * Get spending report for this month
   */
  async getMonthlySpendingReport(): Promise<ApiResponse<SpendingReport>> {
    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    return this.getSpendingReport({
      startDate,
      endDate,
    });
  },

  /**
   * Format currency to IDR
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  /**
   * Format date to Indonesian format
   */
  formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  },

  /**
   * Format date and time to Indonesian format
   */
  formatDateTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  },
};
