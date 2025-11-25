import { productService } from '@/services/product.service';
import type { Product } from '@/types/product.type';
import { useEffect, useState } from 'react';
import { useCategories } from '../categories/use-categories';

/**
 * Custom hook for fetching a single product
 */
export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { categories } = useCategories();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      const result = await productService.getById(id);

      if (result.success && result.data) {
        setProduct(result.data);
        setError(null);
      } else {
        setError(result.error || 'Produk tidak ditemukan');
      }

      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const categoryName = product ? categories.find((cat) => cat.categoryId === product.categoryId)?.name : null;

  return { product, loading, error, categoryName };
}
