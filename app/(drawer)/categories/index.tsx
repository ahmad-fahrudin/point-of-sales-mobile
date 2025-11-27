import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Table, TableAction, TableColumn } from '@/components/ui/table';
import { useCategories } from '@/hooks/categories/use-categories';
import { categoryService } from '@/services/category.service';
import type { Category } from '@/types/category.type';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, loading, error } = useCategories();

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const result = await categoryService.delete(category.categoryId);

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
      ]
    );
  };

  // Define table columns
  const columns: TableColumn<Category>[] = [
    {
      key: 'name',
      label: 'Nama Kategori',
      flex: 1,
      render: (item) => (
        <ThemedText style={styles.cellText}>{item.name}</ThemedText>
      ),
    },
  ];

  // Define table actions
  const actions: TableAction<Category>[] = [
    {
      icon: 'create-outline',
      color: '#2196F3',
      onPress: (item) => router.push(`/categories/edit?id=${item.categoryId}`),
    },
    {
      icon: 'trash-outline',
      color: '#f44336',
      onPress: handleDelete,
    },
  ];

  // Search filter function
  const handleSearch = (searchTerm: string) => {
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Header component
  const headerComponent = (
    <View style={styles.headerRight}>
      <Button
        title="Tambah Kategori"
        onPress={() => router.push('/categories/create')}
        style={styles.addButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Table
        columns={columns}
        data={categories}
        actions={actions}
        loading={loading}
        error={error || undefined}
        emptyMessage="Tidak ada data kategori"
        emptyIcon="list-outline"
        keyExtractor={(item) => item.categoryId}
        onSearch={handleSearch}
        enableSearch={true}
        searchPlaceholder="Cari nama kategori..."
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
});
