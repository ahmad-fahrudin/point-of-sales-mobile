import { db } from '@/config/firebase';
import type {
  ApiResponse,
  Category,
  CreateCategoryInput,
  FirestoreCategory,
  UpdateCategoryInput,
} from '@/types/category.type';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  updateDoc,
} from 'firebase/firestore';

/**
 * Category Service Layer
 * Handles all Firebase Firestore operations for categories
 */
export const categoryService = {
  /**
   * Create a new category
   */
  async create(input: CreateCategoryInput): Promise<ApiResponse<string>> {
    try {
      const data: FirestoreCategory = {
        name: input.name.trim(),
        parentId: input.parentId || null,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'categories'), data);

      return {
        success: true,
        data: docRef.id,
      };
    } catch (error) {
      console.error('Error creating category:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menambahkan kategori',
      };
    }
  },

  /**
   * Update an existing category
   */
  async update(id: string, input: UpdateCategoryInput): Promise<ApiResponse<void>> {
    try {
      await updateDoc(doc(db, 'categories', id), {
        name: input.name.trim(),
        parentId: input.parentId || null,
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating category:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memperbarui kategori',
      };
    }
  },

  /**
   * Delete a category
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await deleteDoc(doc(db, 'categories', id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghapus kategori',
      };
    }
  },

  /**
   * Get a single category by ID
   */
  async getById(id: string): Promise<ApiResponse<Category>> {
    try {
      const docSnap = await getDoc(doc(db, 'categories', id));

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Kategori tidak ditemukan',
        };
      }

      const category: Category = {
        categoryId: docSnap.id,
        ...(docSnap.data() as FirestoreCategory),
      };

      return {
        success: true,
        data: category,
      };
    } catch (error) {
      console.error('Error fetching category:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat kategori',
      };
    }
  },

  /**
   * Get all categories (one-time fetch)
   */
  async getAll(): Promise<ApiResponse<Category[]>> {
    try {
      const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);

      const categories: Category[] = snapshot.docs.map((doc) => ({
        categoryId: doc.id,
        ...(doc.data() as FirestoreCategory),
      }));

      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat data kategori',
      };
    }
  },

  /**
   * Subscribe to real-time category updates
   */
  subscribe(onUpdate: (categories: Category[]) => void, onError: (error: string) => void): () => void {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const categories: Category[] = snapshot.docs.map((doc) => ({
          categoryId: doc.id,
          ...(doc.data() as FirestoreCategory),
        }));
        onUpdate(categories);
      },
      (error) => {
        console.error('Error in category subscription:', error);
        onError(error.message);
      }
    );

    return unsubscribe;
  },

  /**
   * Get parent category name
   */
  getParentName(parentId: string | null, categories: Category[]): string {
    if (!parentId) return '-';
    const parent = categories.find((cat) => cat.categoryId === parentId);
    return parent?.name || '-';
  },

  /**
   * Validate if category can be deleted (check for child categories)
   */
  async canDelete(id: string, categories: Category[]): Promise<boolean> {
    const hasChildren = categories.some((cat) => cat.parentId === id);
    return !hasChildren;
  },
};
