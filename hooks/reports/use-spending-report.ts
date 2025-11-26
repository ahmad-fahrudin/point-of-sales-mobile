import { reportService } from '@/services/report.service';
import type { DateRangeFilter, SpendingReport } from '@/types/report.type';
import { useEffect, useState } from 'react';

/**
 * Custom hook for spending report management
 */
export const useSpendingReport = () => {
  const [report, setReport] = useState<SpendingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default date range (today)
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    return { startDate: today, endDate };
  });

  /**
   * Fetch spending report
   */
  const fetchReport = async (customDateRange?: DateRangeFilter) => {
    try {
      setLoading(true);
      setError(null);

      const range = customDateRange || dateRange;
      const response = await reportService.getSpendingReport(range);

      if (response.success && response.data) {
        setReport(response.data);
      } else {
        setError(response.error || 'Gagal memuat laporan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update date range and fetch report
   */
  const updateDateRange = (newDateRange: DateRangeFilter) => {
    setDateRange(newDateRange);
    fetchReport(newDateRange);
  };

  /**
   * Set date range to today
   */
  const setToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    updateDateRange({ startDate: today, endDate });
  };

  /**
   * Set date range to this month
   */
  const setThisMonth = () => {
    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    updateDateRange({ startDate, endDate });
  };

  /**
   * Set custom date range
   */
  const setCustomRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    updateDateRange({ startDate: start, endDate: end });
  };

  // Load initial report
  useEffect(() => {
    fetchReport();
  }, []);

  return {
    report,
    loading,
    error,
    dateRange,
    updateDateRange,
    setToday,
    setThisMonth,
    setCustomRange,
    refreshReport: fetchReport,
  };
};
