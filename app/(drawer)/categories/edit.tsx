import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/categories/use-categories';
import { useCategory } from '@/hooks/categories/use-category';
import { categoryService } from '@/services/category.service';
import type { UpdateCategoryInput } from '@/types/category.type';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function EditCategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { category, loading: categoryLoading, error: categoryError } = useCategory(id);
  const { categories, getCategoriesExcluding } = useCategories();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateCategoryInput>({
    defaultValues: {
      name: '',
      parentId: '',
    },
  });

  // Update form when category data is loaded
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        parentId: category.parentId || '',
      });
    }
  }, [category, reset]);

  // Handle error or not found
  useEffect(() => {
    if (categoryError && !categoryLoading) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: categoryError,
        position: 'top',
      });
      router.back();
    }
  }, [categoryError, categoryLoading]);

  const onSubmit = async (data: UpdateCategoryInput) => {
    if (!id) return;

    const result = await categoryService.update(id, data);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Kategori berhasil diperbarui',
        position: 'top',
      });
      router.push('/(drawer)/categories');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Gagal memperbarui kategori',
        position: 'top',
      });
    }
  };

  if (categoryLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView>
          <View style={styles.form}>
            <View style={{ marginBottom: 16 }}>
              <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={48} />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Skeleton width={180} height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={48} />
            </View>

            <View style={styles.buttonContainer}>
              <Skeleton width="48%" height={48} />
              <Skeleton width="48%" height={48} />
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            rules={{ required: 'Nama kategori harus diisi' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nama Kategori *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Masukkan nama kategori"
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="parentId"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Parent Kategori (Opsional)"
                selectedValue={value}
                onValueChange={onChange}
                options={getCategoriesExcluding(id).map((category) => ({
                  label: category.name,
                  value: category.categoryId,
                }))}
                placeholder="-- Pilih Parent Kategori --"
              />
            )}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Batal"
              variant="secondary"
              onPress={() => router.push('/(drawer)/categories')}
              style={styles.button}
              disabled={isSubmitting}
            />
            <Button
              title={isSubmitting ? 'Menyimpan...' : 'Simpan'}
              onPress={handleSubmit(onSubmit)}
              style={styles.button}
              disabled={isSubmitting}
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
    padding: 16,
  },
  form: {
    gap: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});
