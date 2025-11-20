import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/hooks/categories/use-categories';
import { useThemeColor } from '@/hooks/use-theme-color';
import { categoryService } from '@/services/category.service';
import type { CreateCategoryInput } from '@/types/category.type';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function CreateCategoryScreen() {
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useCategories();
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

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

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Parent Kategori (Opsional)</ThemedText>
            <View style={[styles.pickerContainer, { borderColor, backgroundColor }]}>
              <Controller
                control={control}
                name="parentId"
                render={({ field: { onChange, value } }) => (
                  <Picker selectedValue={value} onValueChange={onChange} style={{ color: textColor }}>
                    <Picker.Item label="-- Pilih Parent Kategori --" value="" />
                    {categories.map((category) => (
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
