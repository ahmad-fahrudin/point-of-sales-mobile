import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCategories } from '@/hooks/categories/use-categories';
import { categoryService } from '@/services/category.service';
import type { CreateCategoryInput } from '@/types/category.type';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function CreateCategoryScreen() {
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useCategories();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    defaultValues: {
      name: '',
      parentId: '',
    },
  });

  const onSubmit = async (data: CreateCategoryInput) => {
    const result = await categoryService.create(data);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Kategori berhasil ditambahkan',
        position: 'top',
      });
      reset();
      router.push('/(drawer)/categories');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Gagal menambahkan kategori',
        position: 'top',
      });
    }
  };

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
                options={categories.map((category) => ({
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
