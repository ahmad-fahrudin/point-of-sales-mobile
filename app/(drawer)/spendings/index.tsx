import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { useSpendings } from '@/hooks/spending/use-spendings';
import { useThemeColor } from '@/hooks/use-theme-color';
import { spendingService } from '@/services/spending.service';
import type { Spending } from '@/types/spending.type';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function SpendingsScreen() {
  const router = useRouter();
  const { spendings, loading, error, deleteSpending, totalSpending } = useSpendings();
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const cardBg = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');
  const tintColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedSpendings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return spendings.slice(startIndex, endIndex);
  }, [spendings, currentPage]);

  const totalPages = Math.ceil(spendings.length / itemsPerPage);

  const handleDelete = (spendingId: string, description: string, imagePath?: string) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus pengeluaran "${description}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteSpending(spendingId, imagePath);
            if (success) {
              Toast.show({
                type: 'success',
                text1: 'Berhasil',
                text2: 'Pengeluaran berhasil dihapus',
                position: 'top',
              });
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Gagal menghapus pengeluaran',
                position: 'top',
              });
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Spending }) => (
    <View style={[styles.tableRow, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
      <View style={styles.dateCell}>
        <ThemedText style={styles.cellText}>
          {spendingService.formatDate(item.spendingDate)}
        </ThemedText>
      </View>
      <View style={styles.amountCell}>
        <ThemedText style={[styles.cellText, styles.amountText]}>
          {spendingService.formatCurrency(item.totalAmount)}
        </ThemedText>
      </View>
      <View style={styles.actionCell}>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push(`/spendings/show?id=${item.spendingId}`)}
        >
          <Icon name="visibility" size={20} color="#4CAF50" />
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push(`/spendings/edit?id=${item.spendingId}`)}
        >
          <Icon name="edit" size={20} color="#2196F3" />
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => handleDelete(item.spendingId, item.description, item.imagePath)}
        >
          <Icon name="delete" size={20} color="#f44336" />
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRight}>
            <Button
              title="Tambah Pengeluaran"
              onPress={() => router.push('/spendings/create')}
              style={styles.addButton}
            />
          </View>
        </View>

        <View style={styles.tableContainer}>
          <View style={[styles.tableHeader, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
            <View style={styles.dateCell}>
              <ThemedText style={styles.headerText}>Tanggal</ThemedText>
            </View>
            <View style={styles.amountCell}>
              <ThemedText style={styles.headerText}>Jumlah</ThemedText>
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
      <View style={styles.headerContainer}>
        <View style={[styles.totalCard, { backgroundColor: tintColor }]}>
          <Ionicons name="cash-outline" size={24} color="#fff" />
          <View style={styles.totalContent}>
            <ThemedText style={[styles.totalLabel, { color: '#fff' }]}>Total Pengeluaran</ThemedText>
            <ThemedText style={[styles.totalValue, { color: '#fff' }]}>
              {spendingService.formatCurrency(totalSpending)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Button
            title="Tambah Pengeluaran"
            onPress={() => router.push('/spendings/create')}
            style={styles.addButton}
          />
        </View>
      </View>

      <View style={styles.tableContainer}>
        <View style={[styles.tableHeader, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
          <View style={styles.dateCell}>
            <ThemedText style={styles.headerText}>Tanggal</ThemedText>
          </View>
          <View style={styles.amountCell}>
            <ThemedText style={styles.headerText}>Jumlah</ThemedText>
          </View>
          <View style={styles.actionCell}>
            <ThemedText style={styles.headerText}>Aksi</ThemedText>
          </View>
        </View>

        <FlatList
          data={paginatedSpendings}
          renderItem={renderItem}
          keyExtractor={(item) => item.spendingId}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <ThemedText style={styles.emptyText}>Belum ada data pengeluaran</ThemedText>
            </View>
          }
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={spendings.length}
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
  headerContainer: {
    marginBottom: 16,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  totalContent: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tableContainer: {
    flex: 1,
    borderRadius: 8,
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
  dateCell: {
    flex: 2,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  amountCell: {
    flex: 2,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actionCell: {
    width: 120,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
  actionButton: {
    padding: 4,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  },
});
