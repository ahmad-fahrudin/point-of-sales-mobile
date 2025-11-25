import { db } from '@/config/firebase';
import type {
  ApiResponse,
  CreateProductInput,
  FirestoreProduct,
  Product,
  UpdateProductInput,
} from '@/types/product.type';
import * as FileSystem from 'expo-file-system/next';
import * as ImagePicker from 'expo-image-picker';
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
  where,
} from 'firebase/firestore';

/**
 * Product Service Layer
 * Handles all Firebase Firestore operations for products and image management
 */
export const productService = {
  /**
   * Create a new product
   */
  async create(input: CreateProductInput): Promise<ApiResponse<string>> {
    try {
      const data: FirestoreProduct = {
        name: input.name.trim(),
        categoryId: input.categoryId,
        description: input.description.trim(),
        price: input.price,
        stock: input.stock,
        image_path: input.image_path,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'products'), data);

      return {
        success: true,
        data: docRef.id,
      };
    } catch (error) {
      console.error('Error creating product:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menambahkan produk',
      };
    }
  },

  /**
   * Update an existing product
   */
  async update(id: string, input: UpdateProductInput): Promise<ApiResponse<void>> {
    try {
      await updateDoc(doc(db, 'products', id), {
        name: input.name.trim(),
        categoryId: input.categoryId,
        description: input.description.trim(),
        price: input.price,
        stock: input.stock,
        image_path: input.image_path,
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating product:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memperbarui produk',
      };
    }
  },

  /**
   * Delete a product
   */
  async delete(id: string, imagePath?: string): Promise<ApiResponse<void>> {
    try {
      // Delete image from local storage if exists
      if (imagePath) {
        await this.deleteImage(imagePath);
      }

      await deleteDoc(doc(db, 'products', id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghapus produk',
      };
    }
  },

  /**
   * Get a single product by ID
   */
  async getById(id: string): Promise<ApiResponse<Product>> {
    try {
      const docSnap = await getDoc(doc(db, 'products', id));

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Produk tidak ditemukan',
        };
      }

      const product: Product = {
        productId: docSnap.id,
        ...(docSnap.data() as FirestoreProduct),
      };

      return {
        success: true,
        data: product,
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat produk',
      };
    }
  },

  /**
   * Get all products (one-time fetch)
   */
  async getAll(): Promise<ApiResponse<Product[]>> {
    try {
      const q = query(collection(db, 'products'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);

      const products: Product[] = snapshot.docs.map((doc) => ({
        productId: doc.id,
        ...(doc.data() as FirestoreProduct),
      }));

      return {
        success: true,
        data: products,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat data produk',
      };
    }
  },

  /**
   * Get products by category
   */
  async getByCategory(categoryId: string): Promise<ApiResponse<Product[]>> {
    try {
      const q = query(collection(db, 'products'), where('categoryId', '==', categoryId), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);

      const products: Product[] = snapshot.docs.map((doc) => ({
        productId: doc.id,
        ...(doc.data() as FirestoreProduct),
      }));

      return {
        success: true,
        data: products,
      };
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat data produk',
      };
    }
  },

  /**
   * Subscribe to real-time product updates
   */
  subscribe(onUpdate: (products: Product[]) => void, onError: (error: string) => void): () => void {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const products: Product[] = snapshot.docs.map((doc) => ({
          productId: doc.id,
          ...(doc.data() as FirestoreProduct),
        }));
        onUpdate(products);
      },
      (error) => {
        console.error('Error in product subscription:', error);
        onError(error.message);
      }
    );

    return unsubscribe;
  },

  /**
   * Pick image from gallery or camera
   */
  async pickImage(fromCamera: boolean = false): Promise<ApiResponse<string>> {
    try {
      // Request permissions
      const permissionResult = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        return {
          success: false,
          error: 'Izin akses diperlukan untuk memilih gambar',
        };
      }

      // Launch image picker
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (result.canceled) {
        return {
          success: false,
          error: 'Pemilihan gambar dibatalkan',
        };
      }

      return {
        success: true,
        data: result.assets[0].uri,
      };
    } catch (error) {
      console.error('Error picking image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memilih gambar',
      };
    }
  },

  /**
   * Save image to local storage
   */
  async saveImage(uri: string, productId: string): Promise<ApiResponse<string>> {
    try {
      // Create products directory in document directory
      const productsDir = new FileSystem.Directory(FileSystem.Paths.document, 'products');

      // Create directory if it doesn't exist
      if (!(await productsDir.exists)) {
        await productsDir.create();
      }

      // Generate unique filename
      const filename = `${productId}_${Date.now()}.jpg`;
      const destinationFile = new FileSystem.File(productsDir, filename);

      // Copy file to new location
      const sourceFile = new FileSystem.File(uri);
      await sourceFile.copy(destinationFile);

      return {
        success: true,
        data: destinationFile.uri,
      };
    } catch (error) {
      console.error('Error saving image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menyimpan gambar',
      };
    }
  },

  /**
   * Delete image from local storage
   */
  async deleteImage(imagePath: string): Promise<void> {
    try {
      // Only delete if it's a local file in our app directory
      if (imagePath && imagePath.includes('products/')) {
        const file = new FileSystem.File(imagePath);
        if (await file.exists) {
          await file.delete();
          console.log('Image deleted:', imagePath);
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  },

  /**
   * Check if product can be deleted (add any business logic here)
   */
  async canDelete(id: string): Promise<boolean> {
    // Add any business logic here
    // For example, check if product is in any orders
    return true;
  },
};
