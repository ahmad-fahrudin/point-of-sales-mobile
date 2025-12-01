/**
 * Order Types
 * Type definitions for order/transaction management
 */

// Order item in cart
export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  image_path?: string;
}

// Payment history for credit orders
export interface PaymentHistory {
  paymentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'qris';
  note?: string;
}

// Credit/Debt information
export interface CreditInfo {
  totalPaid: number;
  remainingDebt: number;
  paymentHistory: PaymentHistory[];
  isPaid: boolean;
  lastPaymentDate?: string;
}

// Order/Transaction
export interface Order {
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'qris' | 'credit';
  paymentAmount: number;
  change: number;
  customerName?: string;
  createdAt: string;
  createdBy?: string;
  // Credit-specific fields
  creditInfo?: CreditInfo;
}

// Firestore structure (without orderId)
export type FirestoreOrder = Omit<Order, 'orderId'>;

// Input for creating order
export interface CreateOrderInput {
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'qris' | 'credit';
  paymentAmount: number;
  change: number;
  customerName?: string;
}

// Input for adding payment to credit order
export interface AddPaymentInput {
  orderId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  note?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
