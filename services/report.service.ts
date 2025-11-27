import { db } from '@/config/firebase';
import type {
  ApiResponse,
  DailyRevenue,
  FirestoreDailyRevenue,
  ReportData,
  ReportFilter,
  ReportSummary,
} from '@/types/report.type';
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  updateDoc,
  where,
} from 'firebase/firestore';

/**
 * Report Service Layer
 * Handles all Firebase Firestore operations for revenue reports and analytics
 */
export const reportService = {
  /**
   * Get daily revenues with filters and pagination
   */
  async getReports(
    filter: ReportFilter,
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<ReportData>> {
    try {
      // Build query with date range
      const q = query(
        collection(db, 'daily_revenues'),
        where('date', '>=', filter.startDate),
        where('date', '<=', filter.endDate),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);

      // Map to DailyRevenue objects
      const allRevenues: DailyRevenue[] = snapshot.docs.map((doc) => ({
        dailyRevenueId: doc.id,
        ...(doc.data() as FirestoreDailyRevenue),
      }));

      // Calculate summary
      const summary: ReportSummary = {
        totalRevenue: allRevenues.reduce((sum, r) => sum + r.totalRevenue, 0),
        totalSpending: allRevenues.reduce((sum, r) => sum + r.totalSpending, 0),
        netRevenue: allRevenues.reduce((sum, r) => sum + r.netRevenue, 0),
        totalOrders: allRevenues.reduce((sum, r) => sum + r.totalOrders, 0),
        averageOrderValue: 0,
      };

      // Calculate average order value
      summary.averageOrderValue =
        summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0;

      // Paginate
      const totalRecords = allRevenues.length;
      const totalPages = Math.ceil(totalRecords / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRevenues = allRevenues.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          dailyRevenues: paginatedRevenues,
          summary,
          currentPage: page,
          totalPages,
          totalRecords,
        },
      };
    } catch (error) {
      console.error('Error fetching reports:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat laporan',
      };
    }
  },

  /**
   * Get a single daily revenue by ID
   */
  async getById(id: string): Promise<ApiResponse<DailyRevenue>> {
    try {
      const docSnap = await getDoc(doc(db, 'daily_revenues', id));

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Data laporan tidak ditemukan',
        };
      }

      const dailyRevenue: DailyRevenue = {
        dailyRevenueId: docSnap.id,
        ...(docSnap.data() as FirestoreDailyRevenue),
      };

      return {
        success: true,
        data: dailyRevenue,
      };
    } catch (error) {
      console.error('Error fetching daily revenue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat laporan',
      };
    }
  },

  /**
   * Update spending total for a specific date
   * Called when spendings are created/updated/deleted
   */
  async updateSpendingTotal(date: string, totalSpending: number): Promise<ApiResponse<void>> {
    try {
      // Find daily revenue record for this date
      const q = query(collection(db, 'daily_revenues'), where('date', '==', date));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docRef = doc(db, 'daily_revenues', snapshot.docs[0].id);
        const currentData = snapshot.docs[0].data();
        const newNetRevenue = (currentData.totalRevenue || 0) - totalSpending;

        await updateDoc(docRef, {
          totalSpending,
          netRevenue: newNetRevenue,
          updatedAt: new Date().toISOString(),
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating spending total:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memperbarui total pengeluaran',
      };
    }
  },

  /**
   * Subscribe to real-time report updates
   */
  subscribe(
    filter: ReportFilter,
    onUpdate: (revenues: DailyRevenue[]) => void,
    onError: (error: string) => void
  ): () => void {
    const q = query(
      collection(db, 'daily_revenues'),
      where('date', '>=', filter.startDate),
      where('date', '<=', filter.endDate),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const revenues: DailyRevenue[] = snapshot.docs.map((doc) => ({
          dailyRevenueId: doc.id,
          ...(doc.data() as FirestoreDailyRevenue),
        }));
        onUpdate(revenues);
      },
      (error) => {
        console.error('Error in report subscription:', error);
        onError(error.message);
      }
    );

    return unsubscribe;
  },

  /**
   * Generate date range for filter period
   */
  getDateRange(period: 'daily' | 'weekly' | 'monthly'): { startDate: string; endDate: string } {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate: string;

    switch (period) {
      case 'daily':
        // Last 7 days
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 6);
        startDate = lastWeek.toISOString().split('T')[0];
        break;

      case 'weekly':
        // Last 4 weeks (28 days)
        const lastMonth = new Date(today);
        lastMonth.setDate(today.getDate() - 27);
        startDate = lastMonth.toISOString().split('T')[0];
        break;

      case 'monthly':
        // Last 12 months
        const lastYear = new Date(today);
        lastYear.setMonth(today.getMonth() - 11);
        lastYear.setDate(1);
        startDate = lastYear.toISOString().split('T')[0];
        break;

      default:
        startDate = endDate;
    }

    return { startDate, endDate };
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
   * Format date to short format
   */
  formatDateShort(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(dateObj);
  },
};
