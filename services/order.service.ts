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

  /**
   * Print receipt for an order
   */
  async printReceipt(order: Order): Promise<void> {
    try {
      const { Asset } = await import('expo-asset');
      const FileSystem = await import('expo-file-system/legacy');
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');
      const { Platform } = await import('react-native');

      // Load logo
      let logoBase64 = '';
      try {
        const logo = require('../assets/logo.png');
        const asset = Asset.fromModule(logo);
        await asset.downloadAsync();
        
        if (asset.localUri) {
          const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          logoBase64 = `data:image/png;base64,${base64}`;
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }

      // Load receipt template
      const template = require('../templates/receipt-template.html');
      const templateAsset = Asset.fromModule(template);
      await templateAsset.downloadAsync();
      
      if (!templateAsset.localUri) {
        throw new Error('Failed to load receipt template');
      }

      let html = await FileSystem.readAsStringAsync(templateAsset.localUri);

      // Format helpers
      const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('id-ID', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      };

      const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date);
      };

      const formatTime = (dateStr: string): string => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      };

      const getPaymentMethodLabel = (method: string): string => {
        const labels: Record<string, string> = {
          cash: 'Tunai',
          card: 'Kartu',
          qris: 'QRIS',
        };
        return labels[method] || method;
      };

      // Build items HTML
      let itemsHtml = '';
      for (const item of order.items) {
        itemsHtml += `
        <div class="item-row">
            <div class="item-name">${item.productName}</div>
            <div class="item-details">
                <span>${item.quantity} x Rp ${formatCurrency(item.price)}</span>
                <span>Rp ${formatCurrency(item.subtotal)}</span>
            </div>
        </div>`;
      }

      // Handle customer name conditional
      const customerNameSection = order.customerName ? `
        <div class="meta-row">
            <span class="meta-label">Pelanggan:</span>
            <span>${order.customerName}</span>
        </div>` : '';

      // Handle payment details for cash
      const paymentSection = order.paymentMethod === 'cash' ? `
        <div class="summary-row payment">
            <span>Bayar (${getPaymentMethodLabel(order.paymentMethod)}):</span>
            <span>Rp ${formatCurrency(order.paymentAmount)}</span>
        </div>` : '';

      const changeSection = order.change > 0 ? `
        <div class="summary-row change">
            <span>Kembalian:</span>
            <span>Rp ${formatCurrency(order.change)}</span>
        </div>` : '';

      // Replace items section first
      html = html.replace(
        /{{#each items}}[\s\S]*?{{\/each}}/,
        itemsHtml
      );

      // Replace conditional sections
      html = html.replace(
        /{{#if customerName}}[\s\S]*?{{\/if}}/,
        customerNameSection
      );

      html = html.replace(
        /{{#if paymentAmount}}[\s\S]*?{{\/if}}/,
        paymentSection
      );

      html = html.replace(
        /{{#if change}}[\s\S]*?{{\/if}}/,
        changeSection
      );

      // Replace simple placeholders
      html = html
        .replace(/{{logoBase64}}/g, logoBase64)
        .replace(/{{orderId}}/g, order.orderId.substring(0, 8).toUpperCase())
        .replace(/{{date}}/g, formatDate(order.createdAt))
        .replace(/{{time}}/g, formatTime(order.createdAt))
        .replace(/{{subtotal}}/g, formatCurrency(order.totalAmount))
        .replace(/{{total}}/g, formatCurrency(order.totalAmount));

      // Generate PDF
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Struk-${order.orderId.substring(0, 8)}-${timestamp}.pdf`;
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 226.77, // 80mm in points
        height: undefined, // Auto height to fit content
      });

      // Share or print
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Cetak Struk Pembayaran',
            UTI: 'com.adobe.pdf',
          });
        }
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  },
};
