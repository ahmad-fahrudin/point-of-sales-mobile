// Firestore data types (what's stored in database)
export type FirestoreCategory = {
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt?: string;
};

// Application types (with ID)
export type Category = FirestoreCategory & {
  categoryId: string;
};

// Form data types
export type CreateCategoryInput = {
  name: string;
  parentId: string;
};

export type UpdateCategoryInput = {
  name: string;
  parentId: string;
};

// API response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
