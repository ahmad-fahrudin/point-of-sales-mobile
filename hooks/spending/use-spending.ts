import { spendingService } from '@/services/spending.service';
import type { Spending } from '@/types/spending.type';
import { useEffect, useState } from 'react';

/**
 * Custom hook for fetching a single spending by ID
 */
export const useSpending = (id: string) => {
  const [spending, setSpending] = useState<Spending | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    fetchSpending();
  }, [id]);

  /**
   * Fetch spending data
   */
  const fetchSpending = async () => {
    setLoading(true);
    setError(null);

    const response = await spendingService.getById(id);

    if (response.success && response.data) {
      setSpending(response.data);
    } else {
      setError(response.error || 'Gagal memuat data');
    }

    setLoading(false);
  };

  /**
   * Refresh spending data
   */
  const refresh = () => {
    fetchSpending();
  };

  return {
    spending,
    loading,
    error,
    refresh,
  };
};
