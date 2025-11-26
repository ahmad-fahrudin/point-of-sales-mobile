/**
 * Report Types
 * Type definitions for report/analytics
 */

import type { Order } from './order.type';

// Date range filter
export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

// Spending report data
export interface SpendingReport {
  orders: Order[];
  totalOrders: number;
  totalSpending: number;
  dateRange: DateRangeFilter;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
