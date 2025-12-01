import { orderService } from '@/services/order.service';
import type { Order } from '@/types/order.type';
import { useEffect, useState } from 'react';

/**
 * Hook for managing credit orders with real-time updates
 */
export function useCreditOrders(includeFullyPaid: boolean = false) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load
    loadOrders();

    // Subscribe to real-time updates
    const unsubscribe = orderService.subscribeCreditOrders(
      includeFullyPaid,
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

    return () => unsubscribe();
  }, [includeFullyPaid]);

  const loadOrders = async () => {
    setLoading(true);
    const response = await orderService.getCreditOrders(includeFullyPaid);

    if (response.success && response.data) {
      setOrders(response.data);
      setError(null);
    } else {
      setError(response.error || 'Gagal memuat data utang');
    }

    setLoading(false);
  };

  const addPayment = async (
    orderId: string,
    amount: number,
    paymentMethod: 'cash' | 'card' | 'qris',
    note?: string
  ) => {
    const response = await orderService.addPayment(orderId, amount, paymentMethod, note);
    
    if (response.success) {
      await loadOrders(); // Refresh data after successful payment
    }
    
    return response;
  };

  const refresh = async () => {
    await loadOrders();
  };

  return {
    orders,
    loading,
    error,
    addPayment,
    refresh,
  };
}
