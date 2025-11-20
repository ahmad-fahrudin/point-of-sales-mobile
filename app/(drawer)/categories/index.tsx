import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/categories/use-categories';
import { useThemeColor } from '@/hooks/use-theme-color';
import { categoryService } from '@/services/category.service';
import type { Category } from '@/types/category.type';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, loading, error, getParentName } = useCategories();
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const cardBg = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');

  const handleDelete = (categoryId: string, name: string) => {
    // Check if category has children
    const hasChildren = categories.some((cat) => cat.parentId === categoryId);

    if (hasChildren) {
      Toast.show({
        type: 'error',
        text1: 'Gagal Menghapus',
        text2: 'Kategori ini memiliki sub-kategori. Hapus sub-kategori terlebih dahulu.',
        position: 'top',
      });
      return;
    }

    // Confirm deletion with native alert
    Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus kategori "${name}"?`, [
      {
        text: 'Batal',
        style: 'cancel',
      },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          const result = await categoryService.delete(categoryId);

          if (result.success) {
            Toast.show({
              type: 'success',
              text1: 'Berhasil',
              text2: 'Kategori berhasil dihapus',
              position: 'top',
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: result.error || 'Gagal menghapus kategori',
              position: 'top',
            });
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={[styles.tableRow, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
      <View style={styles.tableCell}>
        <ThemedText style={styles.cellText}>{item.name}</ThemedText>
      </View>
      <View style={styles.tableCell}>
        <ThemedText style={styles.cellText}>{getParentName(item.parentId)}</ThemedText>
      </View>
      <View style={styles.actionCell}>
        <Pressable style={styles.actionButton} onPress={() => router.push(`/categories/edit?id=${item.categoryId}`)}>
          <Icon name="edit" size={20} color="#2196F3" />
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => handleDelete(item.categoryId, item.name)}>
          <Icon name="delete" size={20} color="#f44336" />
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.headerRight}>
          <Button title="Tambah Kategori" onPress={() => router.push('/categories/create')} style={styles.addButton} />
        </View>

        <View style={styles.tableContainer}>
          <View style={[styles.tableHeader, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
            <View style={styles.tableCell}>
              <ThemedText style={styles.headerText}>Nama Kategori</ThemedText>
            </View>
            <View style={styles.tableCell}>
              <ThemedText style={styles.headerText}>Parent Kategori</ThemedText>
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
      <View style={styles.headerRight}>
        <Button title="Tambah Kategori" onPress={() => router.push('/categories/create')} style={styles.addButton} />
      </View>

      <View style={styles.tableContainer}>
        <View style={[styles.tableHeader, { borderBottomColor: borderColor, backgroundColor: cardBg }]}>
          <View style={styles.tableCell}>
            <ThemedText style={styles.headerText}>Nama Kategori</ThemedText>
          </View>
          <View style={styles.tableCell}>
            <ThemedText style={styles.headerText}>Parent Kategori</ThemedText>
          </View>
          <View style={styles.actionCell}>
            <ThemedText style={styles.headerText}>Aksi</ThemedText>
          </View>
        </View>

        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item.categoryId}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText>Tidak ada data kategori</ThemedText>
            </View>
          }
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
    overflow: 'hidden',
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
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
  },
  actionCell: {
    width: 100,
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
  actionButton: {
    padding: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
});
