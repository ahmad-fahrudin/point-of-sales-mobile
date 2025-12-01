import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { orderService } from '@/services/order.service';
import type { Order } from '@/types/order.type';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const cardBg = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const headerBorderColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const dividerColor = useThemeColor({ light: '#000', dark: '#666' }, 'text');
  const itemBorderColor = useThemeColor({ light: '#e0e0e0', dark: '#333' }, 'text');
  const badgeBgColor = useThemeColor({ light: '#000', dark: '#007AFF' }, 'text');

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
      credit: 'Kredit/Utang',
    };
    return labels[method] || method;
  };

  const handlePrintReceipt = async () => {
    if (!order) return;

    Alert.alert(
      'Cetak Struk',
      'Pilih format cetak untuk struk pembayaran',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Cetak Struk (80mm)',
          onPress: async () => {
            setPrinting(true);
            try {
              await orderService.printReceipt(order);
              Toast.show({
                type: 'success',
                text1: 'Berhasil',
                text2: 'Struk pembayaran berhasil dicetak',
              });
            } catch (error) {
              Alert.alert('Error', 'Gagal mencetak struk pembayaran');
            } finally {
              setPrinting(false);
            }
          },
        },
      ]
    );
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
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.printButton, printing && styles.printButtonDisabled]}
            onPress={handlePrintReceipt}
            disabled={printing}
          >
            <Ionicons name="print-outline" size={20} color="#fff" />
            <ThemedText style={styles.printButtonText}>
              {printing ? 'Mencetak...' : 'Cetak Struk'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Order Info Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.cardHeader, { borderBottomColor: headerBorderColor }]}>
            <Ionicons name="receipt-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.cardTitle}>Informasi Pesanan</ThemedText>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: itemBorderColor }]}>
            <ThemedText style={styles.infoLabel}>ID Pesanan:</ThemedText>
            <ThemedText style={styles.infoValue}>{order.orderId}</ThemedText>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: itemBorderColor }]}>
            <ThemedText style={styles.infoLabel}>Tanggal & Waktu:</ThemedText>
            <ThemedText style={styles.infoValue}>{formatDate(order.createdAt)}</ThemedText>
          </View>

          {order.customerName && (
            <View style={[styles.infoRow, { borderBottomColor: itemBorderColor }]}>
              <ThemedText style={styles.infoLabel}>Nama Pelanggan:</ThemedText>
              <ThemedText style={styles.infoValue}>{order.customerName}</ThemedText>
            </View>
          )}

          <View style={[styles.infoRow, { borderBottomColor: itemBorderColor }]}>
            <ThemedText style={styles.infoLabel}>Metode Pembayaran:</ThemedText>
            <View style={[styles.paymentBadge, { backgroundColor: badgeBgColor }]}>
              <ThemedText style={styles.paymentBadgeText}>
                {getPaymentMethodLabel(order.paymentMethod)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Items Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.cardHeader, { borderBottomColor: headerBorderColor }]}>
            <Ionicons name="cart-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.cardTitle}>Item Pesanan</ThemedText>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={[styles.itemRow, { borderBottomColor: itemBorderColor }, index < order.items.length - 1 && styles.itemRowBorder]}>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemName}>{item.productName}</ThemedText>
                <ThemedText style={styles.itemDetails}>
                  Rp {item.price.toLocaleString('id-ID')} × {item.quantity}
                </ThemedText>
              </View>
              <ThemedText style={[styles.itemSubtotal, { color: textColor }]}>
                Rp {item.subtotal.toLocaleString('id-ID')}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Payment Summary Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.cardHeader, { borderBottomColor: headerBorderColor }]}>
            <Ionicons name="cash-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.cardTitle}>Ringkasan Pembayaran</ThemedText>
          </View>

          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subtotal:</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: textColor }]}>
              Rp {order.totalAmount.toLocaleString('id-ID')}
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <View style={styles.summaryRow}>
            <ThemedText style={styles.totalLabel}>Total:</ThemedText>
            <ThemedText style={[styles.totalValue, { color: textColor }]}>
              Rp {order.totalAmount.toLocaleString('id-ID')}
            </ThemedText>
          </View>

          {order.paymentMethod === 'cash' && (
            <>
              <View style={[styles.divider, { backgroundColor: dividerColor }]} />

              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Dibayar:</ThemedText>
                <ThemedText style={[styles.summaryValue, { color: textColor }]}>
                  Rp {order.paymentAmount.toLocaleString('id-ID')}
                </ThemedText>
              </View>

              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Kembalian:</ThemedText>
                <ThemedText style={[styles.summaryValue, styles.changeAmount, { color: textColor }]}>
                  Rp {order.change.toLocaleString('id-ID')}
                </ThemedText>
              </View>
            </>
          )}

          {order.paymentMethod === 'credit' && order.creditInfo && (
            <>
              <View style={[styles.divider, { backgroundColor: dividerColor }]} />

              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Sudah Dibayar:</ThemedText>
                <ThemedText style={[styles.summaryValue, { color: '#34c759' }]}>
                  Rp {order.creditInfo.totalPaid.toLocaleString('id-ID')}
                </ThemedText>
              </View>

              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Sisa Utang:</ThemedText>
                <ThemedText style={[styles.summaryValue, { color: order.creditInfo.isPaid ? '#34c759' : '#ff9500', fontWeight: '800' }]}>
                  {order.creditInfo.isPaid ? 'LUNAS' : `Rp ${order.creditInfo.remainingDebt.toLocaleString('id-ID')}`}
                </ThemedText>
              </View>

              {order.creditInfo.paymentHistory.length > 0 && (
                <>
                  <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                  <ThemedText style={[styles.summaryLabel, { marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' }]}>
                    Riwayat Pembayaran:
                  </ThemedText>
                  {order.creditInfo.paymentHistory.map((payment, index) => (
                    <View key={payment.paymentId} style={[styles.summaryRow, { paddingVertical: 6 }]}>
                      <ThemedText style={[styles.summaryLabel, { fontSize: 13 }]}>
                        {formatDate(payment.paymentDate)} - {getPaymentMethodLabel(payment.paymentMethod)}
                      </ThemedText>
                      <ThemedText style={[styles.summaryValue, { fontSize: 13 }]}>
                        Rp {payment.amount.toLocaleString('id-ID')}
                      </ThemedText>
                    </View>
                  ))}
                </>
              )}
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  printButtonDisabled: {
    opacity: 0.6,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  paymentBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  paymentBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  itemDetails: {
    fontSize: 13,
    opacity: 0.7,
    fontFamily: 'monospace',
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  divider: {
    height: 2,
    marginVertical: 14,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  changeAmount: {
    fontWeight: '700',
  },
});
