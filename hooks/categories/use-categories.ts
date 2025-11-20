import { categoryService } from '@/services/category.service';
import type { Category } from '@/types/category.type';
import { useEffect, useState } from 'react';

/**
 * Custom hook for real-time category list with subscription
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = categoryService.subscribe(
      (data) => {
        setCategories(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Get parent category name
   */
  const getParentName = (parentId: string | null) => {
    return categoryService.getParentName(parentId, categories);
  };

  /**
   * Filter categories excluding specific ID (useful for parent dropdown)
   */
  const getCategoriesExcluding = (excludeId?: string) => {
    if (!excludeId) return categories;
    return categories.filter((cat) => cat.categoryId !== excludeId);
  };

  return {
    categories,
    loading,
    error,
    getParentName,
    getCategoriesExcluding,
  };
}
