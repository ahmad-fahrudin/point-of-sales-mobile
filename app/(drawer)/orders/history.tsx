import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Pagination } from '@/components/ui/pagination';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { useOrders } from '@/hooks/orders/use-orders';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Order } from '@/types/order.type';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { orders, loading, error } = useOrders();
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const cardBg = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
  }, [orders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(orders.length / itemsPerPage);

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

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Tunai',
      card: 'Kartu',
      qris: 'QRIS',
    };
    return labels[method] || method;
  };

  const renderItem = ({ item }: { item: Order }) => (
    <View style={[styles.tableRow, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
      <View style={styles.tableCell}>
        <ThemedText style={styles.cellText}>{formatDate(item.createdAt)}</ThemedText>
      </View>
      <View style={styles.tableCell}>
        <ThemedText style={styles.cellText}>
          {item.customerName || '-'}
        </ThemedText>
      </View>
      <View style={styles.tableCell}>
        <ThemedText style={styles.cellText}>{item.items.length} item</ThemedText>
      </View>
      <View style={styles.tableCell}>
        <ThemedText style={[styles.cellText, styles.amountText]}>
          Rp {item.totalAmount.toLocaleString('id-ID')}
        </ThemedText>
      </View>
      <View style={styles.actionCell}>
        <Pressable style={styles.dropdownButton} onPress={() => router.push(`/orders/detail?id=${item.orderId}`)}>
          <Icon name="visibility" size={24} color="#4CAF50" />
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.tableContainer}>
          <View style={[styles.tableHeader, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
            <View style={styles.tableCell}>
              <ThemedText style={styles.headerText}>Tanggal</ThemedText>
            </View>
            <View style={styles.tableCell}>
              <ThemedText style={styles.headerText}>Pelanggan</ThemedText>
            </View>
            <View style={styles.tableCell}>
              <ThemedText style={styles.headerText}>Item</ThemedText>
            </View>
            <View style={styles.tableCell}>
              <ThemedText style={styles.headerText}>Total</ThemedText>
            </View>
            <View style={styles.actionCell}>
              <ThemedText style={styles.headerText}>Aksi</ThemedText>
            </View>
          </View>

          {[1, 2, 3, 4, 5].map((i) => (
            <TableRowSkeleton key={i} />
          ))}
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={{ color: '#f44336' }}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableWrapper}>
            <View style={[styles.tableHeader, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
              <View style={styles.tableCell}>
                <ThemedText style={styles.headerText}>Tanggal</ThemedText>
              </View>
              <View style={styles.tableCell}>
                <ThemedText style={styles.headerText}>Pelanggan</ThemedText>
              </View>
              <View style={styles.tableCell}>
                <ThemedText style={styles.headerText}>Item</ThemedText>
              </View>
              <View style={styles.tableCell}>
                <ThemedText style={styles.headerText}>Total</ThemedText>
              </View>
              <View style={styles.actionCell}>
                <ThemedText style={styles.headerText}>Aksi</ThemedText>
              </View>
            </View>

            <FlatList
              data={paginatedOrders}
              renderItem={renderItem}
              keyExtractor={(item) => item.orderId}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="receipt-outline" size={64} color="#ccc" />
                  <ThemedText style={styles.emptyText}>Belum ada riwayat transaksi</ThemedText>
                </View>
              }
            />
          </View>
        </ScrollView>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={orders.length}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    flex: 1,
    borderRadius: 8,
  },
  tableWrapper: {
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
  },
  actionCell: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  cellText: {
    fontSize: 14,
  },
  amountText: {
    fontWeight: '600',
    color: '#007AFF',
  },
  dropdownButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  },
});
