import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/categories/use-categories';
import { useProducts } from '@/hooks/products/use-products';
import { useCart } from '@/hooks/use-cart-context';
import type { Product } from '@/types/product.type';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { products, loading: loadingProducts } = useProducts();
  const { categories, loading: loadingCategories } = useCategories();
  const { addToCart, getTotalItems } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const badgeScale = useRef(new Animated.Value(1)).current;
  const badgeOpacity = useRef(new Animated.Value(1)).current;

  // Filter products berdasarkan search dan category
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategoryId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategoryId, searchQuery]);

  const handleProductPress = (product: Product) => {
    addToCart(product);
    
    // Animasi badge yang sangat cepat
    Animated.sequence([
      // Pulse effect - membesar dengan sangat cepat
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 2.2,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 0.6,
          duration: 30,
          useNativeDriver: true,
        }),
      ]),
      // Kembali ke normal dengan sangat cepat
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.categoryId === categoryId);
    return category?.name || 'Tanpa Kategori';
  };

  const renderCategoryFilter = () => {
    if (loadingCategories) {
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={100} height={40} style={{ marginRight: 8, borderRadius: 20 }} />
          ))}
        </ScrollView>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategoryId && styles.categoryChipActive,
            { borderColor: colorScheme === 'dark' ? '#444' : '#ddd' },
          ]}
          onPress={() => setSelectedCategoryId(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              !selectedCategoryId && styles.categoryChipTextActive,
              { color: !selectedCategoryId ? '#fff' : colorScheme === 'dark' ? '#fff' : '#333' },
            ]}
          >
            Semua
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.categoryId}
            style={[
              styles.categoryChip,
              selectedCategoryId === category.categoryId && styles.categoryChipActive,
              { borderColor: colorScheme === 'dark' ? '#444' : '#ddd' },
            ]}
            onPress={() => setSelectedCategoryId(category.categoryId)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategoryId === category.categoryId && styles.categoryChipTextActive,
                {
                  color:
                    selectedCategoryId === category.categoryId ? '#fff' : colorScheme === 'dark' ? '#fff' : '#333',
                },
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity style={[styles.productCard, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]} onPress={() => handleProductPress(item)}>
      <View style={styles.productImageContainer}>
        {item.image_path ? (
          <Image source={{ uri: item.image_path }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImagePlaceholder, { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f0f0f0' }]}>
            <Ionicons name="image-outline" size={40} color={colorScheme === 'dark' ? '#666' : '#ccc'} />
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.productCategory, { color: colorScheme === 'dark' ? '#999' : '#666' }]}>
          {getCategoryName(item.categoryId)}
        </Text>
        <Text style={styles.productPrice}>Rp {parseFloat(item.price).toLocaleString('id-ID')}</Text>
        <View style={styles.productFooter}>
          <Text style={[styles.productStock, { color: parseInt(item.stock) > 0 ? '#34c759' : '#ff3b30' }]}>
            Stok: {item.stock}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={colorScheme === 'dark' ? '#666' : '#ccc'} />
      <ThemedText style={styles.emptyText}>
        {searchQuery || selectedCategoryId ? 'Produk tidak ditemukan' : 'Belum ada produk'}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <ThemedText type="title" style={styles.title}>
              Pilih Produk
            </ThemedText>
            <ThemedText style={styles.subtitle}>Klik produk untuk memulai transaksi</ThemedText>
          </View>
          
          <TouchableOpacity
            style={[styles.cartButton, { backgroundColor: '#007AFF' }]}
            onPress={() => router.push('/(drawer)/orders' as any)}
            activeOpacity={0.8}
          >
            {getTotalItems() > 0 && (
              <Animated.View
                style={[
                  styles.cartBadge,
                  {
                    transform: [{ scale: badgeScale }],
                    opacity: badgeOpacity,
                  }
                ]}
              >
                <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
              </Animated.View>
            )}
            <Ionicons name="cart" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Cari produk..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={20} color="#999" />}
          rightIcon={
            searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            ) : undefined
          }
        />
      </View>

      {renderCategoryFilter()}

      {loadingProducts ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          numColumns={2}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.productList}
          columnWrapperStyle={styles.productRow}
          renderItem={() => (
            <View style={[styles.productCard, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
              <Skeleton width="100%" height={120} style={{ borderRadius: 8, marginBottom: 8 }} />
              <Skeleton width="80%" height={16} style={{ marginBottom: 4 }} />
              <Skeleton width="60%" height={14} style={{ marginBottom: 4 }} />
              <Skeleton width="40%" height={18} />
            </View>
          )}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.productId}
          contentContainerStyle={styles.productList}
          columnWrapperStyle={styles.productRow}
          renderItem={renderProductCard}
          ListEmptyComponent={renderEmptyState}
          refreshing={loadingProducts}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
    fontSize: 14,
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    marginBottom: 16,
    maxHeight: 52,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 36,
    minWidth: 60,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  productList: {
    padding: 16,
    paddingTop: 12,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    flex: 1,
    maxWidth: '48%',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 6,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productStock: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
