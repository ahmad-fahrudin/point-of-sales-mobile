// Firestore data types (what's stored in database)
export type FirestoreProduct = {
  name: string;
  categoryId: string;
  description: string;
  price: string;
  stock: string;
  image_path: string;
  createdAt: string;
  updatedAt?: string;
};

// Application types (with ID)
export type Product = FirestoreProduct & {
  productId: string;
};

// Form data types
export type CreateProductInput = {
  name: string;
  categoryId: string;
  description: string;
  price: string;
  stock: string;
  image_path: string;
};

export type UpdateProductInput = {
  name: string;
  categoryId: string;
  description: string;
  price: string;
  stock: string;
  image_path: string;
};

// API response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
