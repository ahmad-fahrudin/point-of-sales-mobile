import { db } from '@/config/firebase';
import type {
  ApiResponse,
  CreateSpendingInput,
  FirestoreSpending,
  Spending,
  UpdateSpendingInput,
} from '@/types/spending.type';
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
import { reportService } from './report.service';

/**
 * Spending Service Layer
 * Handles all Firebase Firestore operations for spending/expenses and receipt image management
 */
export const spendingService = {
  /**
   * Create a new spending record
   */
  async create(input: CreateSpendingInput): Promise<ApiResponse<string>> {
    try {
      const data: FirestoreSpending = {
        description: input.description.trim(),
        totalAmount: input.totalAmount,
        spendingDate: input.spendingDate,
        imagePath: input.imagePath,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'spendings'), data);

      // Update daily revenue with new spending total
      await this.syncDailyRevenue(input.spendingDate);

      return {
        success: true,
        data: docRef.id,
      };
    } catch (error) {
      console.error('Error creating spending:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menambahkan pengeluaran',
      };
    }
  },

  /**
   * Update an existing spending record
   */
  async update(id: string, input: UpdateSpendingInput): Promise<ApiResponse<void>> {
    try {
      // Get old spending data to check if date changed
      const oldDoc = await getDoc(doc(db, 'spendings', id));
      const oldDate = oldDoc.exists() ? oldDoc.data().spendingDate : null;

      await updateDoc(doc(db, 'spendings', id), {
        description: input.description.trim(),
        totalAmount: input.totalAmount,
        spendingDate: input.spendingDate,
        imagePath: input.imagePath,
        updatedAt: new Date().toISOString(),
      });

      // Update daily revenue for both old and new dates
      if (oldDate && oldDate !== input.spendingDate) {
        await this.syncDailyRevenue(oldDate);
      }
      await this.syncDailyRevenue(input.spendingDate);

      return { success: true };
    } catch (error) {
      console.error('Error updating spending:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memperbarui pengeluaran',
      };
    }
  },

  /**
   * Delete a spending record
   */
  async delete(id: string, imagePath?: string): Promise<ApiResponse<void>> {
    try {
      // Get spending date before deleting
      const docSnap = await getDoc(doc(db, 'spendings', id));
      const spendingDate = docSnap.exists() ? docSnap.data().spendingDate : null;

      // Delete receipt image from local storage if exists
      if (imagePath) {
        await this.deleteImage(imagePath);
      }

      await deleteDoc(doc(db, 'spendings', id));

      // Update daily revenue if date exists
      if (spendingDate) {
        await this.syncDailyRevenue(spendingDate);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting spending:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghapus pengeluaran',
      };
    }
  },

  /**
   * Get a single spending by ID
   */
  async getById(id: string): Promise<ApiResponse<Spending>> {
    try {
      const docSnap = await getDoc(doc(db, 'spendings', id));

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Pengeluaran tidak ditemukan',
        };
      }

      const spending: Spending = {
        spendingId: docSnap.id,
        ...(docSnap.data() as FirestoreSpending),
      };

      return {
        success: true,
        data: spending,
      };
    } catch (error) {
      console.error('Error fetching spending:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat pengeluaran',
      };
    }
  },

  /**
   * Get all spendings (one-time fetch)
   */
  async getAll(): Promise<ApiResponse<Spending[]>> {
    try {
      const q = query(collection(db, 'spendings'), orderBy('spendingDate', 'desc'));
      const snapshot = await getDocs(q);

      const spendings: Spending[] = snapshot.docs.map((doc) => ({
        spendingId: doc.id,
        ...(doc.data() as FirestoreSpending),
      }));

      return {
        success: true,
        data: spendings,
      };
    } catch (error) {
      console.error('Error fetching spendings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat data pengeluaran',
      };
    }
  },

  /**
   * Get spendings by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Spending[]>> {
    try {
      const q = query(
        collection(db, 'spendings'),
        where('spendingDate', '>=', startDate),
        where('spendingDate', '<=', endDate),
        orderBy('spendingDate', 'desc')
      );
      const snapshot = await getDocs(q);

      const spendings: Spending[] = snapshot.docs.map((doc) => ({
        spendingId: doc.id,
        ...(doc.data() as FirestoreSpending),
      }));

      return {
        success: true,
        data: spendings,
      };
    } catch (error) {
      console.error('Error fetching spendings by date range:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat data pengeluaran',
      };
    }
  },

  /**
   * Subscribe to real-time spending updates
   */
  subscribe(onUpdate: (spendings: Spending[]) => void, onError: (error: string) => void): () => void {
    const q = query(collection(db, 'spendings'), orderBy('spendingDate', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const spendings: Spending[] = snapshot.docs.map((doc) => ({
          spendingId: doc.id,
          ...(doc.data() as FirestoreSpending),
        }));
        onUpdate(spendings);
      },
      (error) => {
        console.error('Error in spending subscription:', error);
        onError(error.message);
      }
    );

    return unsubscribe;
  },

  /**
   * Pick receipt image from gallery or camera
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
            aspect: [3, 4],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
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
      console.error('Error picking receipt image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memilih gambar',
      };
    }
  },

  /**
   * Save receipt image to local storage
   */
  async saveImage(uri: string, spendingId: string): Promise<ApiResponse<string>> {
    try {
      // Create receipts directory in document directory
      const receiptsDir = new FileSystem.Directory(FileSystem.Paths.document, 'receipts');
      
      // Create directory if it doesn't exist
      const dirExists = await receiptsDir.exists;
      if (!dirExists) {
        await receiptsDir.create();
      }

      // Generate unique filename
      const filename = `${spendingId}_${Date.now()}.jpg`;
      const destinationFile = new FileSystem.File(receiptsDir, filename);

      // Copy file to new location
      const sourceFile = new FileSystem.File(uri);
      await sourceFile.copy(destinationFile);

      console.log('Receipt image saved to:', destinationFile.uri);

      return {
        success: true,
        data: destinationFile.uri,
      };
    } catch (error) {
      console.error('Error saving receipt image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menyimpan gambar',
      };
    }
  },

  /**
   * Delete receipt image from local storage
   */
  async deleteImage(imagePath: string): Promise<void> {
    try {
      // Only delete if it's a local file in our app directory
      if (imagePath && imagePath.includes('receipts/')) {
        const file = new FileSystem.File(imagePath);
        const fileExists = await file.exists;

        if (fileExists) {
          await file.delete();
        }
      }
    } catch (error) {
      console.error('Error deleting receipt image:', error);
    }
  },

  /**
   * Format currency to IDR
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  /**
   * Format date to Indonesian format
   */
  formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  },

  /**
   * Calculate total spending for a list
   */
  calculateTotal(spendings: Spending[]): number {
    return spendings.reduce((sum, spending) => sum + spending.totalAmount, 0);
  },

  /**
   * Sync spending total with daily revenue
   */
  async syncDailyRevenue(date: string): Promise<void> {
    try {
      // Get all spendings for this date
      const q = query(
        collection(db, 'spendings'),
        where('spendingDate', '==', date)
      );
      const snapshot = await getDocs(q);

      // Calculate total spending
      const totalSpending = snapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().totalAmount || 0),
        0
      );

      // Update daily revenue
      await reportService.updateSpendingTotal(date, totalSpending);
    } catch (error) {
      console.error('Error syncing daily revenue:', error);
    }
  },
};

