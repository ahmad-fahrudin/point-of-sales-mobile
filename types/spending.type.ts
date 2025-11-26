/**
 * Spending Types
 * Type definitions for spending/expense management
 */

// Firestore data types (what's stored in database)
export type FirestoreSpending = {
  description: string;
  totalAmount: number;
  spendingDate: string;
  imagePath: string;
  createdAt: string;
  updatedAt?: string;
};

// Application types (with ID)
export type Spending = FirestoreSpending & {
  spendingId: string;
};

// Form data types
export type CreateSpendingInput = {
  description: string;
  totalAmount: number;
  spendingDate: string;
  imagePath: string;
};

export type UpdateSpendingInput = {
  description: string;
  totalAmount: number;
  spendingDate: string;
  imagePath: string;
};

// API response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
