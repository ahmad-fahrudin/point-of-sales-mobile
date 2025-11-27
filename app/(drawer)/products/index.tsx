import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Table, TableAction, TableColumn } from '@/components/ui/table';
import { useCategories } from '@/hooks/categories/use-categories';
import { useProducts } from '@/hooks/products/use-products';
import { productService } from '@/services/product.service';
import type { Product } from '@/types/product.type';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function ProductsScreen() {
  const router = useRouter();
  const { products, loading, error, getCategoryName } = useProducts();
  const { categories } = useCategories();

  const handleDelete = async (product: Product) => {
    const result = await productService.delete(product.productId, product.image_path);

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

  // Define table columns
  const columns: TableColumn<Product>[] = [
    {
      key: 'image_path',
      label: 'Gambar',
      width: 60,
      render: (item) => (
        item.image_path ? (
          <Image
            source={{ uri: item.image_path }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="image-outline" size={20} color="#999" />
          </View>
        )
      ),
    },
    {
      key: 'name',
      label: 'Nama Produk',
      flex: 1,
      render: (item) => (
        <ThemedText style={styles.cellText}>{item.name}</ThemedText>
      ),
    },
    {
      key: 'categoryId',
      label: 'Kategori',
      flex: 1,
      render: (item) => (
        <ThemedText style={styles.cellText}>{getCategoryName(item.categoryId, categories)}</ThemedText>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      flex: 1,
      render: (item) => (
        <ThemedText style={styles.cellText}>{item.stock}</ThemedText>
      ),
    },
  ];

  // Define table actions
  const actions: TableAction<Product>[] = [
    {
      icon: 'eye-outline',
      color: '#4CAF50',
      onPress: (item) => router.push(`/products/show?id=${item.productId}`),
    },
    {
      icon: 'create-outline',
      color: '#2196F3',
      onPress: (item) => router.push(`/products/edit?id=${item.productId}`),
    },
    {
      icon: 'trash-outline',
      color: '#f44336',
      onPress: handleDelete,
    },
  ];

  // Search filter function
  const handleSearch = (searchTerm: string) => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryName(product.categoryId, categories).toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.stock.toString().includes(searchTerm)
    );
  };

  // Header component
  const headerComponent = (
    <View style={styles.headerRight}>
      <Button
        title="Tambah Produk"
        onPress={() => router.push('/products/create')}
        style={styles.addButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Table
        columns={columns}
        data={products}
        actions={actions}
        loading={loading}
        error={error || undefined}
        emptyMessage="Tidak ada data produk"
        emptyIcon="cube-outline"
        keyExtractor={(item) => item.productId}
        onSearch={handleSearch}
        enableSearch={true}
        searchPlaceholder="Cari nama produk, kategori, atau stock..."
        minWidth={500}
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
  cellText: {
    fontSize: 14,
  },
});
