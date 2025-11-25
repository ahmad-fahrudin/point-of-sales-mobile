import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useProduct } from '@/hooks/products/use-product';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ProductShowScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, loading, error, categoryName } = useProduct(id || '');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const cardBg = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={{ marginTop: 16 }}>Memuat data produk...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !product) {
    return (
      <ThemedView style={styles.centerContainer}>
        <Icon name="error-outline" size={48} color="#f44336" />
        <ThemedText style={{ color: '#f44336', marginTop: 16 }}>{error || 'Produk tidak ditemukan'}</ThemedText>
        <Button title="Kembali" onPress={() => router.back()} style={styles.backButton} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerActions}>
          <Button title="Kembali" onPress={() => router.push('/(drawer)/products')} style={styles.actionButton} />
          <Button
            title="Edit"
            onPress={() => router.push(`/products/edit?id=${product.productId}`)}
            style={styles.actionButton}
          />
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.imageContainer}>
            {product.image_path ? (
              <Image source={{ uri: product.image_path }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={[styles.noImage, { backgroundColor: borderColor }]}>
                <Icon name="image" size={80} color="#999" />
              </View>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Nama Produk</ThemedText>
              <ThemedText style={styles.value}>{product.name}</ThemedText>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Kategori</ThemedText>
              <ThemedText style={styles.value}>{categoryName || '-'}</ThemedText>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Harga</ThemedText>
              <ThemedText style={[styles.value, styles.priceText]}>
                Rp {Number(product.price).toLocaleString('id-ID')}
              </ThemedText>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Stok</ThemedText>
              <View style={styles.stockBadge}>
                <ThemedText style={[styles.value, styles.stockText]}>{product.stock}</ThemedText>
                <ThemedText style={styles.stockUnit}>unit</ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Deskripsi</ThemedText>
              <ThemedText style={styles.value}>{product.description || 'Tidak ada deskripsi'}</ThemedText>
            </View>

            {product.createdAt && (
              <>
                <View style={[styles.divider, { backgroundColor: borderColor }]} />
                <View style={styles.detailRow}>
                  <ThemedText style={styles.label}>Dibuat pada</ThemedText>
                  <ThemedText style={styles.value}>
                    {new Date(product.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </ThemedText>
                </View>
              </>
            )}

            {product.updatedAt && (
              <>
                <View style={[styles.divider, { backgroundColor: borderColor }]} />
                <View style={styles.detailRow}>
                  <ThemedText style={styles.label}>Diperbarui pada</ThemedText>
                  <ThemedText style={styles.value}>
                    {new Date(product.updatedAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </ThemedText>
                </View>
              </>
            )}
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 20,
  },
  detailRow: {
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  stockText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stockUnit: {
    fontSize: 14,
    opacity: 0.6,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
