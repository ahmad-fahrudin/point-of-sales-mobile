import { orderService } from '@/services/order.service';
import type { Order } from '@/types/order.type';
import { useEffect, useState } from 'react';

/**
 * Custom hook for managing orders with real-time updates
 */
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = orderService.subscribe(
      (updatedOrders) => {
        setOrders(updatedOrders);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  /**
   * Refresh orders manually
   */
  const refresh = async () => {
    setLoading(true);
    const response = await orderService.getAll();

    if (response.success && response.data) {
      setOrders(response.data);
      setError(null);
    } else {
      setError(response.error || 'Gagal memuat data');
    }

    setLoading(false);
  };

  return {
    orders,
    loading,
    error,
    refresh,
  };
}
