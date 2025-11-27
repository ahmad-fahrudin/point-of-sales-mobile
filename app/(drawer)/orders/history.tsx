import { ThemedText } from '@/components/themed-text';
import { Table, TableAction, TableColumn } from '@/components/ui/table';
import { useOrders } from '@/hooks/orders/use-orders';
import type { Order } from '@/types/order.type';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { orders, loading, error } = useOrders();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      key: 'items',
      label: 'Item',
      flex: 1,
      render: (item) => (
        <ThemedText style={styles.cellText}>{item.items.length} item</ThemedText>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total',
      flex: 1,
      render: (item) => (
        <ThemedText style={[styles.cellText, styles.amountText]}>
          Rp {item.totalAmount.toLocaleString('id-ID')}
        </ThemedText>
      ),
    },
  ];

  // Define table actions
  const actions: TableAction<Order>[] = [
    {
      icon: 'eye-outline',
      color: '#4CAF50',
      onPress: (item) => router.push(`/orders/detail?id=${item.orderId}`),
    },
  ];

  // Search filter function
  const handleSearch = (searchTerm: string) => {
    return orders.filter((order) =>
      (order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.totalAmount.toString().includes(searchTerm)
    );
  };

  // Date filter function
  const handleDateFilter = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate && !endDate) return orders;

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
      const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;

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

  return (
    <View style={styles.container}>
      <Table
        columns={columns}
        data={orders}
        actions={actions}
        loading={loading}
        error={error || undefined}
        emptyMessage="Belum ada riwayat transaksi"
        emptyIcon="receipt-outline"
        keyExtractor={(item) => item.orderId}
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        enableSearch={true}
        enableDateFilter={true}
        searchPlaceholder="Cari pelanggan atau total..."
        minWidth={600}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cellText: {
    fontSize: 14,
  },
  amountText: {
    fontWeight: '600',
    color: '#007AFF',
  },
});
