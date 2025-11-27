import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Table, TableAction, TableColumn } from '@/components/ui/table';
import { useSpendings } from '@/hooks/spending/use-spendings';
import { spendingService } from '@/services/spending.service';
import type { Spending } from '@/types/spending.type';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function SpendingsScreen() {
  const router = useRouter();
  const { spendings, loading, error, deleteSpending } = useSpendings();

  const handleDelete = (spending: Spending) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus pengeluaran "${spending.description}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteSpending(spending.spendingId, spending.imagePath);
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

  // Define table columns
  const columns: TableColumn<Spending>[] = [
    {
      key: 'spendingDate',
      label: 'Tanggal',
      flex: 2,
      render: (item) => (
        <ThemedText style={styles.cellText}>
          {spendingService.formatDate(item.spendingDate)}
        </ThemedText>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Jumlah',
      flex: 2,
      render: (item) => (
        <ThemedText style={[styles.cellText, styles.amountText]}>
          {spendingService.formatCurrency(item.totalAmount)}
        </ThemedText>
      ),
    },
  ];

  // Define table actions
  const actions: TableAction<Spending>[] = [
    {
      icon: 'eye-outline',
      color: '#4CAF50',
      onPress: (item) => router.push(`/spendings/show?id=${item.spendingId}`),
    },
    {
      icon: 'create-outline',
      color: '#2196F3',
      onPress: (item) => router.push(`/spendings/edit?id=${item.spendingId}`),
    },
    {
      icon: 'trash-outline',
      color: '#f44336',
      onPress: handleDelete,
    },
  ];

  // Search filter function
  const handleSearch = (searchTerm: string) => {
    return spendings.filter((spending) =>
      spending.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spendingService.formatCurrency(spending.totalAmount).includes(searchTerm)
    );
  };

  // Date filter function
  const handleDateFilter = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate && !endDate) return spendings;

    return spendings.filter((spending) => {
      const spendingDate = new Date(spending.spendingDate);
      const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
      const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;

      if (start && end) {
        return spendingDate >= start && spendingDate <= end;
      }
      if (start) {
        return spendingDate >= start;
      }
      if (end) {
        return spendingDate <= end;
      }
      return true;
    });
  };

  // Header component with button
  const headerComponent = (
    <View style={styles.headerRight}>
      <Button
        title="Tambah Pengeluaran"
        onPress={() => router.push('/spendings/create')}
        style={styles.addButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Table
        columns={columns}
        data={spendings}
        actions={actions}
        loading={loading}
        error={error || undefined}
        emptyMessage="Belum ada data pengeluaran"
        emptyIcon="receipt-outline"
        keyExtractor={(item) => item.spendingId}
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        enableSearch={true}
        enableDateFilter={true}
        searchPlaceholder="Cari deskripsi atau jumlah..."
        headerComponent={headerComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  cellText: {
    fontSize: 14,
  },
  amountText: {
    fontWeight: '600',
    color: '#007AFF',
  },
});
