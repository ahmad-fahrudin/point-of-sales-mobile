import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/categories/use-categories';
import { useProducts } from '@/hooks/products/use-products';
import { useThemeColor } from '@/hooks/use-theme-color';
import { productService } from '@/services/product.service';
import type { Product } from '@/types/product.type';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ProductsScreen() {
  const router = useRouter();
  const { products, loading, error, getCategoryName } = useProducts();
  const { categories } = useCategories();
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const cardBg = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(products.length / itemsPerPage);

  const handleDelete = async (productId: string, name: string, imagePath: string) => {
    const result = await productService.delete(productId, imagePath);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Produk berhasil dihapus',
        position: 'top',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Gagal menghapus produk',
        position: 'top',
      });
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={[styles.tableRow, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
      <View style={styles.imageCell}>
        {item.image_path ? (
          <Image
            source={{ uri: item.image_path }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Icon name="image" size={20} color="#999" />
          </View>
        )}
      </View>
      <View style={styles.tableCell}>
        <ThemedText style={styles.cellText}>{item.name}</ThemedText>
      </View>
      <View style={styles.tableCell}>
        <ThemedText style={styles.cellText}>{getCategoryName(item.categoryId, categories)}</ThemedText>
      </View>
      <View style={styles.tableCell}>
        <ThemedText style={styles.cellText}>{item.stock}</ThemedText>
      </View>
      <View style={styles.actionCell}>
        <View style={styles.actionButtons}>
          <Pressable style={styles.actionButton} onPress={() => router.push(`/products/show?id=${item.productId}`)}>
            <Icon name="visibility" size={20} color="#4CAF50" />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => router.push(`/products/edit?id=${item.productId}`)}>
            <Icon name="edit" size={20} color="#2196F3" />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => handleDelete(item.productId, item.name, item.image_path)}>
            <Icon name="delete" size={20} color="#f44336" />
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.headerRight}>
          <Button title="Tambah Produk" onPress={() => router.push('/products/create')} style={styles.addButton} />
        </View>

        <View style={styles.tableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.tableWrapper}>
              <View style={[styles.tableHeader, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
            <View style={styles.imageCell}>
              <ThemedText style={styles.headerText}>Gambar</ThemedText>
            </View>
            <View style={styles.tableCell}>
              <ThemedText style={styles.headerText}>Nama Produk</ThemedText>
            </View>
            <View style={styles.tableCell}>
              <ThemedText style={styles.headerText}>Kategori</ThemedText>
            </View>
            <View style={styles.tableCell}>
              <ThemedText style={styles.headerText}>Stock</ThemedText>
            </View>
            <View style={styles.actionCell}>
              <ThemedText style={styles.headerText}>Aksi</ThemedText>
            </View>
          </View>

          {[1, 2, 3, 4, 5].map((i) => (
            <TableRowSkeleton key={i} />
          ))}
            </View>
          </ScrollView>
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
      <View style={styles.headerRight}>
        <Button title="Tambah Produk" onPress={() => router.push('/products/create')} style={styles.addButton} />
      </View>

      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableWrapper}>
            <View style={[styles.tableHeader, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
          <View style={styles.imageCell}>
            <ThemedText style={styles.headerText}>Gambar</ThemedText>
          </View>
          <View style={styles.tableCell}>
            <ThemedText style={styles.headerText}>Nama Produk</ThemedText>
          </View>
          <View style={styles.tableCell}>
            <ThemedText style={styles.headerText}>Kategori</ThemedText>
          </View>
          <View style={styles.tableCell}>
            <ThemedText style={styles.headerText}>Stock</ThemedText>
          </View>
          <View style={styles.actionCell}>
            <ThemedText style={styles.headerText}>Aksi</ThemedText>
          </View>
        </View>

        <FlatList
          data={paginatedProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.productId}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText>Tidak ada data produk</ThemedText>
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
          totalItems={products.length}
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
  headerRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tableContainer: {
    flex: 1,
    borderRadius: 8,
  },
  tableWrapper: {
    minWidth: 500,
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
  tableRowActive: {
    zIndex: 1001,
    elevation: 6,
  },
  imageCell: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 8,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
  },
  actionCell: {
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  cellText: {
    fontSize: 14,
  },
  dropdownButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
});
