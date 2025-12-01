import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableAction, TableColumn } from '@/components/ui/table';
import { useCreditOrders } from '@/hooks/orders/use-credit-orders';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Order } from '@/types/order.type';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function HistoryUtangScreen() {
  const router = useRouter();
  // Status filter: 'semua' (all), 'lunas' (paid), 'belum_lunas' (unpaid)
  const [statusFilter, setStatusFilter] = useState<'semua' | 'lunas' | 'belum_lunas'>('semua');
  // Always fetch all credit orders from the hook; filtering is done client-side so we can show paid/unpaid/semi
  const { orders, loading, error, addPayment, refresh } = useCreditOrders(true);

  // Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris'>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const cardBg = useThemeColor({ light: '#fff', dark: '#1c1c1e' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleAddPayment = (order: Order) => {
    setSelectedOrder(order);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentNote('');
    setPaymentModalVisible(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedOrder) return;

    const amount = parseFloat(paymentAmount);

    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Masukkan jumlah pembayaran yang valid');
      return;
    }

    if (amount > (selectedOrder.creditInfo?.remainingDebt || 0)) {
      Alert.alert(
        'Jumlah Berlebih',
        `Jumlah pembayaran melebihi sisa utang (Rp ${selectedOrder.creditInfo?.remainingDebt.toLocaleString('id-ID')})`
      );
      return;
    }

    setProcessing(true);

    try {
      const response = await addPayment(
        selectedOrder.orderId,
        amount,
        paymentMethod,
        paymentNote
      );

      if (response.success) {
        const remainingAfterPayment = (selectedOrder.creditInfo?.remainingDebt || 0) - amount;
        const isPaid = remainingAfterPayment <= 0;

        Toast.show({
          type: 'success',
          text1: 'Pembayaran Berhasil',
          text2: isPaid
            ? 'Utang telah lunas!'
            : `Sisa utang: Rp ${remainingAfterPayment.toLocaleString('id-ID')}`,
        });

        setPaymentModalVisible(false);
        setSelectedOrder(null);
        await refresh();
      } else {
        Alert.alert('Error', response.error || 'Gagal menambahkan pembayaran');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  // Define table columns
  const columns: TableColumn<Order>[] = [
    {
      key: 'createdAt',
      label: 'Tanggal',
      flex: 1,
      render: (item) => (
        <ThemedText style={styles.cellText}>{formatDate(item.createdAt)}</ThemedText>
      ),
    },
    {
      key: 'customerName',
      label: 'Pelanggan',
      flex: 1,
      render: (item) => (
        <ThemedText style={styles.cellText}>{item.customerName || '-'}</ThemedText>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total Tagihan',
      flex: 1,
      render: (item) => (
        <ThemedText style={[styles.cellText, styles.amountText]}>
          Rp {item.totalAmount.toLocaleString('id-ID')}
        </ThemedText>
      ),
    },
    {
      key: 'totalPaid',
      label: 'Dibayar',
      flex: 1,
      render: (item) => (
        <ThemedText style={[styles.cellText, styles.paidText]}>
          Rp {(item.creditInfo?.totalPaid || 0).toLocaleString('id-ID')}
        </ThemedText>
      ),
    },
    {
      key: 'remainingDebt',
      label: 'Sisa Utang',
      flex: 1,
      render: (item) => (
        <ThemedText style={[styles.cellText, styles.debtText]}>
          Rp {(item.creditInfo?.remainingDebt || 0).toLocaleString('id-ID')}
        </ThemedText>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      flex: 0.7,
      render: (item) => {
        const isPaid = item.creditInfo?.isPaid || false;
        return (
          <View style={[styles.statusBadge, { backgroundColor: isPaid ? '#34c759' : '#ff9500' }]}>
            <ThemedText style={styles.statusText}>
              {isPaid ? 'LUNAS' : 'BELUM LUNAS'}
            </ThemedText>
          </View>
        );
      },
    },
  ];

  // Define table actions per-row. Hide the 'cash' action for paid orders.
  const actions = (item: Order) => {
    const rowActions: TableAction<Order>[] = [
      {
        icon: 'eye-outline',
        color: '#4CAF50',
        onPress: () => router.push(`/orders/detail?id=${item.orderId}`),
      },
    ];

    const isPaid = !!item.creditInfo?.isPaid;

    if (!isPaid) {
      rowActions.push({
        icon: 'cash-outline',
        color: '#FF9500',
        onPress: () => handleAddPayment(item),
      });
    }

    return rowActions;
  };

  // Search filter function that also respects the status filter
  const handleSearch = (searchTerm: string) => {
    const base = orders.filter((order) => {
      const isPaid = !!order.creditInfo?.isPaid;
      if (statusFilter === 'semua') return true;
      if (statusFilter === 'lunas') return isPaid;
      return !isPaid; // 'belum_lunas'
    });

    return base.filter((order) =>
      (order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.totalAmount.toString().includes(searchTerm) ||
      (order.creditInfo?.remainingDebt || 0).toString().includes(searchTerm)
    );
  };

  // Date filter function that also respects the status filter
  const handleDateFilter = (startDate: Date | null, endDate: Date | null) => {
    const base = orders.filter((order) => {
      const isPaid = !!order.creditInfo?.isPaid;
      if (statusFilter === 'semua') return true;
      if (statusFilter === 'lunas') return isPaid;
      return !isPaid; // 'belum_lunas'
    });

    if (!startDate && !endDate) return base;

    return base.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      if (start && end) {
        return orderDate >= start && orderDate <= end;
      }
      if (start) {
        return orderDate >= start;
      }
      if (end) {
        return orderDate <= end;
      }
      return true;
    });
  };

  const paymentMethodOptions = [
    { label: 'Tunai', value: 'cash' },
    { label: 'Kartu', value: 'card' },
    { label: 'QRIS', value: 'qris' },
  ];

  return (
    <View style={styles.container}>
          {/* Filter Toggle */}
          <View style={[styles.filterContainer, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.filterLabel}>Tampilkan:</ThemedText>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'belum_lunas' && styles.filterButtonActive]}
              onPress={() => setStatusFilter('belum_lunas')}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.filterButtonText, statusFilter === 'belum_lunas' && styles.filterButtonTextActive]}>
                Belum Lunas
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'lunas' && styles.filterButtonActive]}
              onPress={() => setStatusFilter('lunas')}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.filterButtonText, statusFilter === 'lunas' && styles.filterButtonTextActive]}>
                Lunas
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'semua' && styles.filterButtonActive]}
              onPress={() => setStatusFilter('semua')}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.filterButtonText, statusFilter === 'semua' && styles.filterButtonTextActive]}>
                Semua
              </ThemedText>
            </TouchableOpacity>
          </View>

      {/* Table */}
      {/* Apply status filter to data passed to the Table */}
          <Table
            columns={columns}
            data={orders.filter((order) => {
              const isPaid = !!order.creditInfo?.isPaid;
              if (statusFilter === 'semua') return true;
              if (statusFilter === 'lunas') return isPaid;
              return !isPaid; // 'belum_lunas'
            })}
        actions={actions}
        loading={loading}
        error={error || undefined}
        emptyMessage={
          statusFilter === 'semua'
            ? 'Belum ada data utang'
            : statusFilter === 'lunas'
            ? 'Tidak ada utang yang sudah lunas'
            : 'Tidak ada utang yang belum lunas'
        }
        emptyIcon="receipt-outline"
        keyExtractor={(item) => item.orderId}
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        enableSearch={true}
        enableDateFilter={true}
        searchPlaceholder="Cari pelanggan atau jumlah..."
        minWidth={800}
      />

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalTitle}>Tambah Pembayaran</ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  {selectedOrder?.customerName || 'Pelanggan'}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setPaymentModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              {/* Debt Info */}
              <View
                style={[
                  styles.debtInfoBox,
                  {
                    backgroundColor: 'rgba(255, 149, 0, 0.06)',
                    borderColor: 'rgba(255, 149, 0, 0.1)',
                  },
                ]}
              >
                <ThemedText style={styles.debtInfoLabel}>Sisa Utang</ThemedText>
                <ThemedText style={styles.debtInfoAmount}>
                  Rp {(selectedOrder?.creditInfo?.remainingDebt || 0).toLocaleString('id-ID')}
                </ThemedText>
              </View>

              <View style={styles.modalSection}>
                <ThemedText style={styles.label}>Jumlah Pembayaran</ThemedText>
                <Input
                  placeholder="Masukkan jumlah pembayaran"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  leftIcon={<ThemedText>Rp</ThemedText>}
                />
              </View>

              <View style={styles.modalSection}>
                <ThemedText style={styles.label}>Metode Pembayaran</ThemedText>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'qris')}
                  options={paymentMethodOptions}
                />
              </View>

              <View style={styles.modalSection}>
                <ThemedText style={styles.label}>Catatan (Opsional)</ThemedText>
                <Input
                  placeholder="Tambahkan catatan"
                  value={paymentNote}
                  onChangeText={setPaymentNote}
                  multiline
                />
              </View>

              {/* Submit Button */}
              <Button
                title={processing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                onPress={handleSubmitPayment}
                disabled={processing}
                style={styles.submitButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  cellText: {
    fontSize: 14,
  },
  amountText: {
    fontWeight: '600',
    color: '#007AFF',
  },
  paidText: {
    fontWeight: '600',
    color: '#34c759',
  },
  debtText: {
    fontWeight: '700',
    color: '#ff9500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 24,
    paddingTop: 20,
  },
  debtInfoBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  debtInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 8,
  },
  debtInfoAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ff9500',
    letterSpacing: -0.5,
  },
  modalSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    opacity: 0.75,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  submitButton: {
    marginTop: 12,
    marginBottom: 20,
    height: 56,
    borderRadius: 16,
  },
});
