import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/hooks/reports/use-report';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { reportService } from '@/services/report.service';
import type { DailyRevenue, ReportPeriod } from '@/types/report.type';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const {
    loading,
    error,
    reportData,
    currentPage,
    period,
    changePeriod,
    nextPage,
    previousPage,
    goToPage,
    refresh,
  } = useReport();

  const [refreshing, setRefreshing] = useState(false);

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const periodOptions = [
    { label: 'Harian (7 Hari)', value: 'daily' },
    { label: 'Mingguan (4 Minggu)', value: 'weekly' },
    { label: 'Bulanan (12 Bulan)', value: 'monthly' },
  ];

  const renderSummaryCard = () => {
    if (!reportData) return null;

    const { summary } = reportData;

    return (
      <View
        style={[
          styles.summaryContainer,
          { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' },
        ]}
      >
        <ThemedText type="subtitle" style={styles.summaryTitle}>
          Ringkasan Laporan
        </ThemedText>

        <View style={styles.summaryGrid}>
          {/* Total Revenue */}
          <View style={[styles.summaryCard, styles.revenueCard]}>
            <Ionicons name="trending-up" size={24} color="#34c759" />
            <Text style={styles.summaryLabel}>Pendapatan Kotor</Text>
            <Text style={styles.summaryValue}>
              {reportService.formatCurrency(summary.totalRevenue)}
            </Text>
          </View>

          {/* Total Spending */}
          <View style={[styles.summaryCard, styles.spendingCard]}>
            <Ionicons name="trending-down" size={24} color="#ff3b30" />
            <Text style={styles.summaryLabel}>Total Pengeluaran</Text>
            <Text style={styles.summaryValue}>
              {reportService.formatCurrency(summary.totalSpending)}
            </Text>
          </View>

          {/* Net Revenue */}
          <View style={[styles.summaryCard, styles.netRevenueCard]}>
            <Ionicons name="cash" size={24} color="#007AFF" />
            <Text style={styles.summaryLabel}>Pendapatan Bersih</Text>
            <Text style={[styles.summaryValue, styles.netRevenueValue]}>
              {reportService.formatCurrency(summary.netRevenue)}
            </Text>
          </View>

          {/* Total Orders */}
          <View style={[styles.summaryCard, styles.ordersCard]}>
            <Ionicons name="receipt" size={24} color="#ff9500" />
            <Text style={styles.summaryLabel}>Total Transaksi</Text>
            <Text style={styles.summaryValue}>{summary.totalOrders}</Text>
          </View>

          {/* Average Order Value */}
          <View style={[styles.summaryCard, styles.avgCard]}>
            <Ionicons name="analytics" size={24} color="#5856d6" />
            <Text style={styles.summaryLabel}>Rata-rata Transaksi</Text>
            <Text style={styles.summaryValue}>
              {reportService.formatCurrency(summary.averageOrderValue)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTableHeader = () => (
    <View
      style={[
        styles.tableHeader,
        { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f0f0f0' },
      ]}
    >
      <Text style={[styles.tableHeaderText, styles.colDate]}>Tanggal</Text>
      <Text style={[styles.tableHeaderText, styles.colAmount]}>Pendapatan</Text>
      <Text style={[styles.tableHeaderText, styles.colAmount]}>Pengeluaran</Text>
      <Text style={[styles.tableHeaderText, styles.colAmount]}>Bersih</Text>
      <Text style={[styles.tableHeaderText, styles.colOrders]}>Transaksi</Text>
    </View>
  );

  const renderTableRow = (item: DailyRevenue) => (
    <View
      key={item.dailyRevenueId}
      style={[
        styles.tableRow,
        { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' },
      ]}
    >
      <Text style={[styles.tableCell, styles.colDate, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
        {reportService.formatDateShort(item.date)}
      </Text>
      <Text style={[styles.tableCell, styles.colAmount, styles.revenueText]}>
        {reportService.formatCurrency(item.totalRevenue)}
      </Text>
      <Text style={[styles.tableCell, styles.colAmount, styles.spendingText]}>
        {reportService.formatCurrency(item.totalSpending)}
      </Text>
      <Text style={[styles.tableCell, styles.colAmount, styles.netRevenueText]}>
        {reportService.formatCurrency(item.netRevenue)}
      </Text>
      <Text style={[styles.tableCell, styles.colOrders, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
        {item.totalOrders}
      </Text>
    </View>
  );

  const renderTable = () => {
    if (loading && !reportData) {
      return (
        <View style={styles.tableContainer}>
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} style={styles.skeletonRow} />
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff3b30" />
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Coba Lagi" onPress={refresh} style={{ marginTop: 16 }} />
        </View>
      );
    }

    if (!reportData || reportData.dailyRevenues.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={64}
            color={colorScheme === 'dark' ? '#666' : '#ccc'}
          />
          <Text style={[styles.emptyText, { color: colorScheme === 'dark' ? '#666' : '#999' }]}>
            Tidak ada data laporan
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tableContainer}>
        {renderTableHeader()}
        <ScrollView style={styles.tableBody}>
          {reportData.dailyRevenues.map(renderTableRow)}
        </ScrollView>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filter Section */}
        <View style={styles.filterContainer}>
          <ThemedText type="subtitle" style={styles.filterTitle}>
            Filter Periode
          </ThemedText>
          <Select
            options={periodOptions}
            value={period}
            onValueChange={(value) => changePeriod(value as ReportPeriod)}
            placeholder="Pilih periode"
          />
        </View>

        {/* Summary Cards */}
        {renderSummaryCard()}

        {/* Table Section */}
        <View
          style={[
            styles.tableSection,
            { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' },
          ]}
        >
          <View style={styles.tableTitleContainer}>
            <ThemedText type="subtitle">Laporan Harian</ThemedText>
            <TouchableOpacity onPress={refresh} disabled={loading}>
              <Ionicons
                name="refresh"
                size={24}
                color={colorScheme === 'dark' ? '#007AFF' : '#007AFF'}
              />
            </TouchableOpacity>
          </View>

          {renderTable()}

          {/* Pagination */}
          {reportData && reportData.totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <Pagination
                currentPage={currentPage}
                totalPages={reportData.totalPages}
                onPageChange={goToPage}
                itemsPerPage={10}
                totalItems={reportData.totalRecords}
              />
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={[styles.infoText, { color: colorScheme === 'dark' ? '#999' : '#666' }]}>
            Pendapatan bersih = Pendapatan kotor - Pengeluaran pada hari yang sama
          </Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  filterContainer: {
    padding: 16,
  },
  filterTitle: {
    marginBottom: 8,
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    marginBottom: 16,
  },
  summaryGrid: {
    gap: 12,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  revenueCard: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  spendingCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  netRevenueCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  ordersCard: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  avgCard: {
    backgroundColor: 'rgba(88, 86, 214, 0.1)',
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  netRevenueValue: {
    color: '#007AFF',
  },
  tableSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  tableTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tableContainer: {
    paddingHorizontal: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tableCell: {
    fontSize: 13,
    fontWeight: '500',
  },
  colDate: {
    flex: 2,
  },
  colAmount: {
    flex: 2,
    textAlign: 'right',
  },
  colOrders: {
    flex: 1,
    textAlign: 'center',
  },
  revenueText: {
    color: '#34c759',
  },
  spendingText: {
    color: '#ff3b30',
  },
  netRevenueText: {
    color: '#007AFF',
    fontWeight: '700',
  },
  skeletonRow: {
    height: 44,
    marginVertical: 4,
    borderRadius: 6,
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  paginationContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
