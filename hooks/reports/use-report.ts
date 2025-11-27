import { reportService } from '@/services/report.service';
import type { ReportData, ReportFilter, ReportPeriod } from '@/types/report.type';
import { useEffect, useState } from 'react';

/**
 * Custom hook for managing revenue reports
 */
export const useReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [customDateRange, setCustomDateRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  const pageSize = 10;

  /**
   * Fetch reports based on current filters and page
   */
  const fetchReports = async (page: number = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      // Determine date range
      const dateRange = customDateRange || reportService.getDateRange(period);
      const filter: ReportFilter = {
        period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      const response = await reportService.getReports(filter, page, pageSize);

      if (response.success && response.data) {
        setReportData(response.data);
        setCurrentPage(page);
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
   * Change period filter
   */
  const changePeriod = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod);
    setCustomDateRange(null); // Reset custom date range
    setCurrentPage(1);
  };

  /**
   * Set custom date range
   */
  const setDateRange = (startDate: string, endDate: string) => {
    setCustomDateRange({ startDate, endDate });
    setCurrentPage(1);
  };

  /**
   * Navigate to next page
   */
  const nextPage = () => {
    if (reportData && currentPage < reportData.totalPages) {
      fetchReports(currentPage + 1);
    }
  };

  /**
   * Navigate to previous page
   */
  const previousPage = () => {
    if (currentPage > 1) {
      fetchReports(currentPage - 1);
    }
  };

  /**
   * Go to specific page
   */
  const goToPage = (page: number) => {
    if (reportData && page >= 1 && page <= reportData.totalPages) {
      fetchReports(page);
    }
  };

  /**
   * Refresh current reports
   */
  const refresh = () => {
    fetchReports(currentPage);
  };

  // Fetch reports when filters change
  useEffect(() => {
    fetchReports(1);
  }, [period, customDateRange]);

  return {
    // State
    loading,
    error,
    reportData,
    currentPage,
    period,
    customDateRange,

    // Actions
    changePeriod,
    setDateRange,
    nextPage,
    previousPage,
    goToPage,
    refresh,
    fetchReports,
  };
};
