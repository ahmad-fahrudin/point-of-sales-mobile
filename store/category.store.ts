import { categoryService } from '@/services/category.service';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category.type';
import { create } from 'zustand';

type CategoryState = {
  categories: Category[];
  loading: boolean;
  error: string | null;

  // Actions
  setCategories: (categories: Category[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // CRUD Operations
  createCategory: (input: CreateCategoryInput) => Promise<boolean>;
  updateCategory: (id: string, input: UpdateCategoryInput) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  fetchCategories: () => Promise<void>;

  // Helpers
  getCategoryById: (id: string) => Category | undefined;
  getParentName: (parentId: string | null) => string;
};

/**
 * Global Category Store using Zustand
 * Manages category state across the application
 */
export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  // Setters
  setCategories: (categories) => set({ categories }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Create category
  createCategory: async (input) => {
    const result = await categoryService.create(input);

    if (!result.success) {
      set({ error: result.error || 'Gagal menambahkan kategori' });
      return false;
    }

    // Optimistic update - could also wait for real-time sync
    set({ error: null });
    return true;
  },

  // Update category
  updateCategory: async (id, input) => {
    const result = await categoryService.update(id, input);

    if (!result.success) {
      set({ error: result.error || 'Gagal memperbarui kategori' });
      return false;
    }

    set({ error: null });
    return true;
  },

  // Delete category
  deleteCategory: async (id) => {
    const result = await categoryService.delete(id);

    if (!result.success) {
      set({ error: result.error || 'Gagal menghapus kategori' });
      return false;
    }

    set({ error: null });
    return true;
  },

  // Fetch all categories
  fetchCategories: async () => {
    set({ loading: true, error: null });
    const result = await categoryService.getAll();

    if (result.success && result.data) {
      set({ categories: result.data, loading: false });
    } else {
      set({ error: result.error || 'Gagal memuat data', loading: false });
    }
  },

  // Get category by ID
  getCategoryById: (id) => {
    return get().categories.find((cat) => cat.categoryId === id);
  },

  // Get parent name
  getParentName: (parentId) => {
    return categoryService.getParentName(parentId, get().categories);
  },
}));
