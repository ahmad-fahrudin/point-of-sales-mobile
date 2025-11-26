import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { useSpendingReport } from '@/hooks/reports/use-spending-report';
import { useThemeColor } from '@/hooks/use-theme-color';
import { reportService } from '@/services/report.service';
import type { Order } from '@/types/order.type';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function SpendingReportScreen() {
  const router = useRouter();
  const {
    report,
    loading,
    error,
    dateRange,
    setToday,
    setThisMonth,
    setCustomRange,
    refreshReport,
  } = useSpendingReport();

  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const cardBg = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');
  const tintColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(dateRange.startDate);
  const [tempEndDate, setTempEndDate] = useState(dateRange.endDate);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedOrders = useMemo(() => {
    if (!report?.orders) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return report.orders.slice(startIndex, endIndex);
  }, [report?.orders, currentPage]);

  const totalPages = Math.ceil((report?.orders.length || 0) / itemsPerPage);

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempStartDate(selectedDate);
      if (Platform.OS !== 'ios') {
        setCustomRange(selectedDate, tempEndDate);
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempEndDate(selectedDate);
      if (Platform.OS !== 'ios') {
        setCustomRange(tempStartDate, selectedDate);
      }
    }
  };

  const applyDateRange = () => {
    setCustomRange(tempStartDate, tempEndDate);
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <Pressable
      style={[styles.orderCard, { borderColor, backgroundColor: cardBg }]}
      onPress={() => router.push(`/orders/detail?id=${item.orderId}`)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <ThemedText style={styles.orderDate}>
            {reportService.formatDateTime(item.createdAt)}
          </ThemedText>
          <ThemedText style={styles.orderCustomer}>
            {item.customerName || 'Pelanggan'}
          </ThemedText>
        </View>
        <View style={styles.orderAmount}>
          <ThemedText style={[styles.totalAmount, { color: tintColor }]}>
            {reportService.formatCurrency(item.totalAmount)}
          </ThemedText>
          <ThemedText style={styles.paymentMethod}>
            {item.paymentMethod === 'cash' ? 'Tunai' : item.paymentMethod === 'card' ? 'Kartu' : 'QRIS'}
          </ThemedText>
        </View>
      </View>
      <View style={styles.orderItems}>
        <ThemedText style={styles.itemCount}>
          {item.items.length} item • {item.items.map(i => i.productName).join(', ')}
        </ThemedText>
      </View>
    </Pressable>
  );

  if (loading && !report) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.summaryCard}>
          {[1, 2, 3].map((i) => (
            <TableRowSkeleton key={i} />
          ))}
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Date Filter Section */}
        <View style={[styles.filterCard, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.filterTitle}>Filter Tanggal</ThemedText>
          
          <View style={styles.quickFilters}>
            <TouchableOpacity
              style={[styles.quickFilterBtn, { borderColor: tintColor }]}
              onPress={setToday}
            >
              <ThemedText style={[styles.quickFilterText, { color: tintColor }]}>
                Hari Ini
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickFilterBtn, { borderColor: tintColor }]}
              onPress={setThisMonth}
            >
              <ThemedText style={[styles.quickFilterText, { color: tintColor }]}>
                Bulan Ini
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.dateInputs}>
            <View style={styles.dateInput}>
              <ThemedText style={styles.dateLabel}>Dari Tanggal</ThemedText>
              <TouchableOpacity
                style={[styles.datePicker, { borderColor, backgroundColor: cardBg }]}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={tintColor} />
                <ThemedText style={styles.dateText}>
                  {reportService.formatDate(tempStartDate)}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.dateInput}>
              <ThemedText style={styles.dateLabel}>Sampai Tanggal</ThemedText>
              <TouchableOpacity
                style={[styles.datePicker, { borderColor, backgroundColor: cardBg }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={tintColor} />
                <ThemedText style={styles.dateText}>
                  {reportService.formatDate(tempEndDate)}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {Platform.OS === 'ios' && (showStartDatePicker || showEndDatePicker) && (
            <View style={styles.datePickerContainer}>
              {showStartDatePicker && (
                <DateTimePicker
                  value={tempStartDate}
                  mode="date"
                  display="spinner"
                  onChange={onStartDateChange}
                  maximumDate={tempEndDate}
                />
              )}
              {showEndDatePicker && (
                <DateTimePicker
                  value={tempEndDate}
                  mode="date"
                  display="spinner"
                  onChange={onEndDateChange}
                  minimumDate={tempStartDate}
                />
              )}
              <Button title="Terapkan" onPress={applyDateRange} />
            </View>
          )}

          {Platform.OS === 'android' && showStartDatePicker && (
            <DateTimePicker
              value={tempStartDate}
              mode="date"
              display="default"
              onChange={onStartDateChange}
              maximumDate={tempEndDate}
            />
          )}

          {Platform.OS === 'android' && showEndDatePicker && (
            <DateTimePicker
              value={tempEndDate}
              mode="date"
              display="default"
              onChange={onEndDateChange}
              minimumDate={tempStartDate}
            />
          )}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="receipt-outline" size={32} color={tintColor} />
              <View style={styles.summaryContent}>
                <ThemedText style={styles.summaryLabel}>Total Transaksi</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {report?.totalOrders || 0} Pesanan
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.summaryCard, styles.highlightCard, { backgroundColor: tintColor }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="cash-outline" size={32} color="#fff" />
              <View style={styles.summaryContent}>
                <ThemedText style={[styles.summaryLabel, { color: '#fff' }]}>
                  Total Pengeluaran
                </ThemedText>
                <ThemedText style={[styles.summaryValue, styles.totalSpending, { color: '#fff' }]}>
                  {reportService.formatCurrency(report?.totalSpending || 0)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {error && (
          <View style={[styles.errorCard, { backgroundColor: '#ffebee', borderColor: '#f44336' }]}>
            <Ionicons name="alert-circle" size={24} color="#f44336" />
            <ThemedText style={{ color: '#f44336', marginLeft: 8 }}>{error}</ThemedText>
          </View>
        )}

        {/* Orders List */}
        <View style={[styles.ordersSection, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Detail Transaksi</ThemedText>
            <TouchableOpacity onPress={() => refreshReport()}>
              <Ionicons name="refresh" size={24} color={tintColor} />
            </TouchableOpacity>
          </View>

          {report?.orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <ThemedText style={styles.emptyText}>
                Tidak ada transaksi pada periode ini
              </ThemedText>
            </View>
          ) : (
            <>
              <FlatList
                data={paginatedOrders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.orderId}
                scrollEnabled={false}
                contentContainerStyle={styles.ordersList}
              />

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={report?.orders.length || 0}
                />
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
    padding: 16,
  },
  filterCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickFilterBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateInputs: {
    gap: 12,
  },
  dateInput: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 14,
  },
  datePickerContainer: {
    marginTop: 16,
    gap: 12,
  },
  summaryContainer: {
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  highlightCard: {
    borderWidth: 0,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalSpending: {
    fontSize: 24,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  ordersSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 12,
    opacity: 0.7,
  },
  orderAmount: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 12,
    opacity: 0.7,
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  itemCount: {
    fontSize: 12,
    opacity: 0.8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
});
