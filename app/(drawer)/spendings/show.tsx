import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { useSpending } from '@/hooks/spending/use-spending';
import { useThemeColor } from '@/hooks/use-theme-color';
import { spendingService } from '@/services/spending.service';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

export default function ShowSpendingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spending, loading, error } = useSpending(id);
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const cardBg = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');
  const tintColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

  if (loading || !spending) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
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
        <Ionicons name="alert-circle" size={64} color="#f44336" />
        <ThemedText style={[styles.errorText, { color: '#f44336' }]}>{error}</ThemedText>
        <Button title="Kembali" onPress={() => router.back()} style={styles.backButton} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Receipt Image */}
          {spending.imagePath ? (
            <View style={[styles.imageCard, { backgroundColor: cardBg, borderColor }]}>
              <ThemedText style={styles.sectionTitle}>Foto Struk/Bukti</ThemedText>
              <Image
                source={{ uri: spending.imagePath }}
                style={styles.receiptImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={[styles.imageCard, styles.noImageCard, { backgroundColor: '#f5f5f5', borderColor }]}>
              <Ionicons name="image-outline" size={64} color="#ccc" />
              <ThemedText style={styles.noImageText}>Tidak ada foto struk</ThemedText>
            </View>
          )}

          {/* Details Card */}
          <View style={[styles.detailCard, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>Detail Pengeluaran</ThemedText>

            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="calendar-outline" size={20} color={tintColor} />
                <ThemedText style={styles.labelText}>Tanggal</ThemedText>
              </View>
              <ThemedText style={styles.valueText}>
                {spendingService.formatDate(spending.spendingDate)}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="document-text-outline" size={20} color={tintColor} />
                <ThemedText style={styles.labelText}>Keterangan</ThemedText>
              </View>
              <ThemedText style={[styles.valueText, styles.descriptionText]}>
                {spending.description}
              </ThemedText>
            </View>

            <View style={[styles.detailRow, styles.amountRow, { backgroundColor: tintColor }]}>
              <View style={styles.detailLabel}>
                <Ionicons name="cash-outline" size={24} color="#fff" />
                <ThemedText style={[styles.labelText, { color: '#fff' }]}>Total</ThemedText>
              </View>
              <ThemedText style={[styles.valueText, styles.amountValue, { color: '#fff' }]}>
                {spendingService.formatCurrency(spending.totalAmount)}
              </ThemedText>
            </View>
          </View>

          {/* Meta Info */}
          <View style={[styles.metaCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.metaRow}>
              <ThemedText style={styles.metaLabel}>Dibuat pada:</ThemedText>
              <ThemedText style={styles.metaValue}>
                {new Date(spending.createdAt).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </ThemedText>
            </View>
            {spending.updatedAt && (
              <View style={styles.metaRow}>
                <ThemedText style={styles.metaLabel}>Diperbarui pada:</ThemedText>
                <ThemedText style={styles.metaValue}>
                  {new Date(spending.updatedAt).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Edit"
              onPress={() => router.push(`/spendings/edit?id=${spending.spendingId}`)}
              style={styles.actionButton}
            />
            <Button
              title="Kembali"
              onPress={() => router.push('/(drawer)/spendings')}
              variant="secondary"
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  imageCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  noImageCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  receiptImage: {
    width: '100%',
    height: 400,
    borderRadius: 8,
  },
  noImageText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.6,
  },
  detailCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  detailRow: {
    gap: 12,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 16,
    marginLeft: 28,
  },
  descriptionText: {
    lineHeight: 24,
  },
  amountRow: {
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metaCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 32,
  },
});
