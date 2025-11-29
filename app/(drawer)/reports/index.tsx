import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useReport } from '@/hooks/reports/use-report';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { pdfService } from '@/services/pdf.service';
import { reportService } from '@/services/report.service';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const {
    loading,
    error,
    reportData,
    currentPage,
    setDateRange,
    nextPage,
    previousPage,
    goToPage,
    refresh,
  } = useReport();

  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  const applyCustomDateRange = () => {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    setDateRange(startDateStr, endDateStr);
  };

  const handlePrintPDF = async () => {
    if (!reportData) {
      Alert.alert('Error', 'Tidak ada data laporan untuk dicetak');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      
      const pdfData = {
        summary: reportData.summary,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      await pdfService.printPDF(pdfData);
      
      Alert.alert(
        'Berhasil', 
        Platform.OS === 'web' 
          ? 'Laporan berhasil disiapkan untuk dicetak'
          : 'PDF laporan berhasil dibuat dan siap dibagikan'
      );
    } catch (error) {
      console.error('Error printing PDF:', error);
      Alert.alert(
        'Error', 
        'Terjadi kesalahan saat membuat PDF. Silakan coba lagi.'
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderSummaryCard = () => {
    if (!reportData) return null;

    const { summary } = reportData;

    return (
      <View
        style={[
          styles.summaryContainer,
          { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff' },
        ]}
      >
        <ThemedText type="subtitle" style={[styles.summaryTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1a1a1a' }]}>
          Ringkasan Laporan
        </ThemedText>

        <View style={styles.summaryGrid}>
          {/* Total Revenue */}
          <View style={[styles.summaryCard, colorScheme === 'dark' ? styles.revenueCardDark : styles.revenueCard]}>
            <View style={[styles.iconContainer, { backgroundColor: '#10b981' }]}>
              <Ionicons name="trending-up" size={24} color="#ffffff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.summaryLabel, { color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Pendapatan Kotor</Text>
              <Text style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#ffffff' : '#1f2937' }]}>
                {reportService.formatCurrency(summary.totalRevenue)}
              </Text>
            </View>
          </View>

          {/* Total Spending */}
          <View style={[styles.summaryCard, colorScheme === 'dark' ? styles.spendingCardDark : styles.spendingCard]}>
            <View style={[styles.iconContainer, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="trending-down" size={24} color="#ffffff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.summaryLabel, { color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Total Pengeluaran</Text>
              <Text style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#ffffff' : '#1f2937' }]}>
                {reportService.formatCurrency(summary.totalSpending)}
              </Text>
            </View>
          </View>

          {/* Net Revenue */}
          <View style={[styles.summaryCard, colorScheme === 'dark' ? styles.netRevenueCardDark : styles.netRevenueCard]}>
            <View style={[styles.iconContainer, { backgroundColor: '#3b82f6' }]}>
              <Ionicons name="cash" size={24} color="#ffffff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.summaryLabel, { color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Pendapatan Bersih</Text>
              <Text style={[styles.summaryValue, styles.netRevenueValue, { color: colorScheme === 'dark' ? '#60a5fa' : '#3b82f6' }]}>
                {reportService.formatCurrency(summary.netRevenue)}
              </Text>
            </View>
          </View>

          {/* Total Orders */}
          <View style={[styles.summaryCard, colorScheme === 'dark' ? styles.ordersCardDark : styles.ordersCard]}>
            <View style={[styles.iconContainer, { backgroundColor: '#f97316' }]}>
              <Ionicons name="receipt" size={24} color="#ffffff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.summaryLabel, { color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Total Transaksi</Text>
              <Text style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#ffffff' : '#1f2937' }]}>{summary.totalOrders}</Text>
            </View>
          </View>

          {/* Average Order Value */}
          <View style={[styles.summaryCard, colorScheme === 'dark' ? styles.avgCardDark : styles.avgCard]}>
            <View style={[styles.iconContainer, { backgroundColor: '#6b7280' }]}>
              <Ionicons name="analytics" size={24} color="#ffffff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.summaryLabel, { color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Rata-rata Transaksi</Text>
              <Text style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#ffffff' : '#1f2937' }]}>
                {reportService.formatCurrency(summary.averageOrderValue)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };







  return (
    <ThemedView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#f8f9fa' }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filter Section */}
        <View style={[styles.filterContainer, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff' }]}>
          <ThemedText type="subtitle" style={[styles.filterTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1a1a1a' }]}>
            Pilih Rentang Tanggal
          </ThemedText>
          
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputWrapper}>
              <ThemedText style={[styles.dateLabel, { color: colorScheme === 'dark' ? '#e5e7eb' : '#374151' }]}>Dari Tanggal</ThemedText>
              <TouchableOpacity
                style={[styles.datePickerButton, { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff' }]}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={[styles.datePickerText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                  {reportService.formatDateShort(startDate)}
                </Text>
                <Ionicons name="calendar" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateInputWrapper}>
              <ThemedText style={[styles.dateLabel, { color: colorScheme === 'dark' ? '#e5e7eb' : '#374151' }]}>Sampai Tanggal</ThemedText>
              <TouchableOpacity
                style={[styles.datePickerButton, { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#fff' }]}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={[styles.datePickerText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                  {reportService.formatDateShort(endDate)}
                </Text>
                <Ionicons name="calendar" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <Button
              title="Terapkan Filter"
              onPress={applyCustomDateRange}
              style={styles.applyButton}
            />

            {/* Start Date Picker */}
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) {
                    setStartDate(selectedDate);
                  }
                }}
                maximumDate={endDate}
              />
            )}

            {/* End Date Picker */}
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) {
                    setEndDate(selectedDate);
                  }
                }}
                minimumDate={startDate}
                maximumDate={new Date()}
              />
            )}
          </View>
        </View>

        {/* Print PDF Button */}
        {reportData && (
          <View style={[styles.printContainer, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff' }]}>
            <Button
              title={isGeneratingPDF ? "Membuat PDF..." : "📄 Cetak PDF"}
              onPress={handlePrintPDF}
              disabled={isGeneratingPDF || loading}
              style={[
                styles.printButton,
                { 
                  backgroundColor: isGeneratingPDF || loading ? '#9ca3af' : '#3b82f6',
                  opacity: isGeneratingPDF || loading ? 0.7 : 1 
                }
              ]}
            />
          </View>
        )}

        {/* Summary Cards */}
        {renderSummaryCard()}
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
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  filterTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  dateRangeContainer: {
    gap: 16,
  },
  dateInputWrapper: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateInput: {
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  datePickerText: {
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  applyButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 4,
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  summaryTitle: {
    marginBottom: 20,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryGrid: {
    gap: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  revenueCard: {
    backgroundColor: '#ecfdf5',
    borderColor: 'rgba(34, 197, 94, 0.1)',
  },
  revenueCardDark: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  spendingCard: {
    backgroundColor: '#fef2f2',
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  spendingCardDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  netRevenueCard: {
    backgroundColor: '#eff6ff',
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  netRevenueCardDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  ordersCard: {
    backgroundColor: '#fff7ed',
    borderColor: 'rgba(249, 115, 22, 0.1)',
  },
  ordersCardDark: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  avgCard: {
    backgroundColor: '#f3f4f6',
    borderColor: 'rgba(107, 114, 128, 0.1)',
  },
  avgCardDark: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  netRevenueValue: {
    // Color will be set dynamically
  },

  printContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  printButton: {
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
