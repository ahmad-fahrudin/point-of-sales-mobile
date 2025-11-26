import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { orderService } from '@/services/order.service';
import type { Order } from '@/types/order.type';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    const response = await orderService.getById(id as string);

    if (response.success && response.data) {
      setOrder(response.data);
      setError(null);
    } else {
      setError(response.error || 'Gagal memuat detail pesanan');
    }

    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Tunai',
      card: 'Kartu',
      qris: 'QRIS',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Memuat detail pesanan...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !order) {
    return (
      <ThemedView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <ThemedText style={[styles.errorText, { color: '#f44336' }]}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Info Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.cardTitle}>Informasi Pesanan</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>ID Pesanan:</ThemedText>
            <ThemedText style={styles.infoValue}>{order.orderId}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Tanggal & Waktu:</ThemedText>
            <ThemedText style={styles.infoValue}>{formatDate(order.createdAt)}</ThemedText>
          </View>

          {order.customerName && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Nama Pelanggan:</ThemedText>
              <ThemedText style={styles.infoValue}>{order.customerName}</ThemedText>
            </View>
          )}

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Metode Pembayaran:</ThemedText>
            <View style={styles.paymentBadge}>
              <ThemedText style={styles.paymentBadgeText}>
                {getPaymentMethodLabel(order.paymentMethod)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Items Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="cart-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.cardTitle}>Item Pesanan</ThemedText>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={[styles.itemRow, index < order.items.length - 1 && styles.itemRowBorder]}>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemName}>{item.productName}</ThemedText>
                <ThemedText style={styles.itemDetails}>
                  Rp {item.price.toLocaleString('id-ID')} × {item.quantity}
                </ThemedText>
              </View>
              <ThemedText style={styles.itemSubtotal}>
                Rp {item.subtotal.toLocaleString('id-ID')}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Payment Summary Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.cardTitle}>Ringkasan Pembayaran</ThemedText>
          </View>

          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subtotal:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              Rp {order.totalAmount.toLocaleString('id-ID')}
            </ThemedText>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <ThemedText style={styles.totalLabel}>Total:</ThemedText>
            <ThemedText style={styles.totalValue}>
              Rp {order.totalAmount.toLocaleString('id-ID')}
            </ThemedText>
          </View>

          {order.paymentMethod === 'cash' && (
            <>
              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Dibayar:</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  Rp {order.paymentAmount.toLocaleString('id-ID')}
                </ThemedText>
              </View>

              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Kembalian:</ThemedText>
                <ThemedText style={[styles.summaryValue, styles.changeAmount]}>
                  Rp {order.change.toLocaleString('id-ID')}
                </ThemedText>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  paymentBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paymentBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    opacity: 0.7,
  },
  itemSubtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  changeAmount: {
    color: '#34c759',
  },
});
