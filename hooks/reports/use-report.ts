import { reportService } from '@/services/report.service';
import type { ReportData, ReportFilter } from '@/types/report.type';
import { useEffect, useState } from 'react';

/**
 * Custom hook for managing revenue reports
 */
export const useReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRangeState] = useState<{
    startDate: string;
    endDate: string;
  }>(() => {
    // Default to last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  });

  const pageSize = 10;

  /**
   * Fetch reports based on current filters and page
   */
  const fetchReports = async (page: number = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      const filter: ReportFilter = {
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
   * Set date range
   */
  const setDateRange = (startDate: string, endDate: string) => {
    setDateRangeState({ startDate, endDate });
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

  // Fetch reports when date range changes
  useEffect(() => {
    fetchReports(1);
  }, [dateRange]);

  return {
    // State
    loading,
    error,
    reportData,
    currentPage,
    dateRange,

    // Actions
    setDateRange,
    nextPage,
    previousPage,
    goToPage,
    refresh,
    fetchReports,
  };
};
