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

// Order/Transaction
export interface Order {
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  paymentAmount: number;
  change: number;
  customerName?: string;
  createdAt: string;
  createdBy?: string;
}

// Firestore structure (without orderId)
export type FirestoreOrder = Omit<Order, 'orderId'>;

// Input for creating order
export interface CreateOrderInput {
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  paymentAmount: number;
  change: number;
  customerName?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
