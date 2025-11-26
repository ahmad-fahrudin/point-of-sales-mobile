import { spendingService } from '@/services/spending.service';
import type { Spending } from '@/types/spending.type';
import { useEffect, useState } from 'react';

/**
 * Custom hook for fetching all spendings with real-time updates
 */
export const useSpendings = () => {
  const [spendings, setSpendings] = useState<Spending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = spendingService.subscribe(
      (updatedSpendings) => {
        setSpendings(updatedSpendings);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Refresh spendings list
   */
  const refresh = async () => {
    setLoading(true);
    setError(null);

    const response = await spendingService.getAll();

    if (response.success && response.data) {
      setSpendings(response.data);
    } else {
      setError(response.error || 'Gagal memuat data');
    }

    setLoading(false);
  };

  /**
   * Delete a spending
   */
  const deleteSpending = async (id: string, imagePath?: string): Promise<boolean> => {
    const response = await spendingService.delete(id, imagePath);
    
    if (response.success) {
      // Remove from local state
      setSpendings((prev) => prev.filter((s) => s.spendingId !== id));
      return true;
    } else {
      setError(response.error || 'Gagal menghapus pengeluaran');
      return false;
    }
  };

  /**
   * Calculate total spending
   */
  const totalSpending = spendingService.calculateTotal(spendings);

  return {
    spendings,
    loading,
    error,
    refresh,
    deleteSpending,
    totalSpending,
  };
};
