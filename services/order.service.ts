import { db } from '@/config/firebase';
import type { ApiResponse, CreateOrderInput, FirestoreOrder, Order } from '@/types/order.type';
import type { FirestoreDailyRevenue } from '@/types/report.type';
import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  updateDoc,
  where,
} from 'firebase/firestore';

/**
 * Order Service Layer
 * Handles all Firebase Firestore operations for orders/transactions
 */
export const orderService = {
  /**
   * Create a new order/transaction
   */
  async create(input: CreateOrderInput): Promise<ApiResponse<string>> {
    try {
      const data: FirestoreOrder = {
        items: input.items,
        totalAmount: input.totalAmount,
        paymentMethod: input.paymentMethod,
        paymentAmount: input.paymentAmount,
        change: input.change,
        customerName: input.customerName || '',
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'orders'), data);

      // Update daily revenue record
      await this.updateDailyRevenue(input.totalAmount);

      return {
        success: true,
        data: docRef.id,
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal membuat pesanan',
      };
    }
  },

  /**
   * Update or create daily revenue record
   */
  async updateDailyRevenue(totalAmount: number): Promise<void> {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Check if daily revenue record exists
      const q = query(
        collection(db, 'daily_revenues'),
        where('date', '==', today)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Create new daily revenue record
        const data: FirestoreDailyRevenue = {
          date: today,
          totalRevenue: totalAmount,
          totalOrders: 1,
          totalSpending: 0,
          netRevenue: totalAmount,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'daily_revenues'), data);
      } else {
        // Update existing daily revenue record
        const docRef = doc(db, 'daily_revenues', snapshot.docs[0].id);
        const currentData = snapshot.docs[0].data();
        const newTotalRevenue = currentData.totalRevenue + totalAmount;
        const newNetRevenue = newTotalRevenue - (currentData.totalSpending || 0);

        await updateDoc(docRef, {
          totalRevenue: newTotalRevenue,
          totalOrders: increment(1),
          netRevenue: newNetRevenue,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating daily revenue:', error);
      // Don't throw error to prevent order creation from failing
    }
  },

  /**
   * Get a single order by ID
   */
  async getById(id: string): Promise<ApiResponse<Order>> {
    try {
      const docSnap = await getDoc(doc(db, 'orders', id));

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Pesanan tidak ditemukan',
        };
      }

      const order: Order = {
        orderId: docSnap.id,
        ...(docSnap.data() as FirestoreOrder),
      };

      return {
        success: true,
        data: order,
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat pesanan',
      };
    }
  },

  /**
   * Get all orders (one-time fetch)
   */
  async getAll(): Promise<ApiResponse<Order[]>> {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const orders: Order[] = snapshot.docs.map((doc) => ({
        orderId: doc.id,
        ...(doc.data() as FirestoreOrder),
      }));

      return {
        success: true,
        data: orders,
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat data pesanan',
      };
    }
  },

  /**
   * Get recent orders (limited)
   */
  async getRecent(limitCount: number = 10): Promise<ApiResponse<Order[]>> {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);

      const orders: Order[] = snapshot.docs.map((doc) => ({
        orderId: doc.id,
        ...(doc.data() as FirestoreOrder),
      }));

      return {
        success: true,
        data: orders,
      };
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat data pesanan',
      };
    }
  },

  /**
   * Subscribe to real-time order updates
   */
  subscribe(onUpdate: (orders: Order[]) => void, onError: (error: string) => void): () => void {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const orders: Order[] = snapshot.docs.map((doc) => ({
          orderId: doc.id,
          ...(doc.data() as FirestoreOrder),
        }));
        onUpdate(orders);
      },
      (error) => {
        console.error('Error in order subscription:', error);
        onError(error.message);
      }
    );

    return unsubscribe;
  },

  /**
   * Calculate total from items
   */
  calculateTotal(items: { price: number; quantity: number }[]): number {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  /**
   * Calculate change
   */
  calculateChange(paymentAmount: number, totalAmount: number): number {
    return Math.max(0, paymentAmount - totalAmount);
  },
};
