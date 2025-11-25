import { productService } from '@/services/product.service';
import type { Category } from '@/types/category.type';
import type { Product } from '@/types/product.type';
import { useEffect, useState } from 'react';

/**
 * Custom hook for real-time product list with subscription
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = productService.subscribe(
      (data) => {
        setProducts(data);
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
   * Get category name by ID
   */
  const getCategoryName = (categoryId: string, categories: Category[]) => {
    const category = categories.find((cat) => cat.categoryId === categoryId);
    return category?.name || '-';
  };

  /**
   * Filter products by category
   */
  const getProductsByCategory = (categoryId: string) => {
    return products.filter((product) => product.categoryId === categoryId);
  };

  return {
    products,
    loading,
    error,
    getCategoryName,
    getProductsByCategory,
  };
}
