import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/categories/use-categories';
import { useCategory } from '@/hooks/categories/use-category';
import { useThemeColor } from '@/hooks/use-theme-color';
import { categoryService } from '@/services/category.service';
import type { UpdateCategoryInput } from '@/types/category.type';
import { Picker } from '@react-native-picker/picker';
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
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

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
          <View style={styles.header}>
            <Skeleton width={200} height={32} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={48} />
            </View>

            <View style={styles.inputContainer}>
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

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Parent Kategori (Opsional)</ThemedText>
            <View style={[styles.pickerContainer, { borderColor, backgroundColor }]}>
              <Controller
                control={control}
                name="parentId"
                render={({ field: { onChange, value } }) => (
                  <Picker selectedValue={value} onValueChange={onChange} style={{ color: textColor }}>
                    <Picker.Item label="-- Pilih Parent Kategori --" value="" />
                    {getCategoriesExcluding(id).map((category) => (
                      <Picker.Item key={category.categoryId} label={category.name} value={category.categoryId} />
                    ))}
                  </Picker>
                )}
              />
            </View>
          </View>

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
  header: {
    marginBottom: 24,
  },
  form: {
    gap: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
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
