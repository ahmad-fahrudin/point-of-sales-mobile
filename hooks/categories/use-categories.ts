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

  // parent hierarchy removed — no helper functions for parent or exclusions

  return {
    categories,
    loading,
    error,
    
  };
}
