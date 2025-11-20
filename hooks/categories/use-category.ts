import { categoryService } from '@/services/category.service';
import type { Category } from '@/types/category.type';
import { useEffect, useState } from 'react';

/**
 * Custom hook for fetching a single category
 */
export function useCategory(id: string | undefined) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchCategory = async () => {
      setLoading(true);
      const result = await categoryService.getById(id);

      if (result.success && result.data) {
        setCategory(result.data);
        setError(null);
      } else {
        setError(result.error || 'Kategori tidak ditemukan');
      }

      setLoading(false);
    };

    fetchCategory();
  }, [id]);

  return { category, loading, error };
}
