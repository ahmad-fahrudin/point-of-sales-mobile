import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ImagePicker } from '@/components/ui/image-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCategories } from '@/hooks/categories/use-categories';
import { productService } from '@/services/product.service';
import type { CreateProductInput } from '@/types/product.type';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function CreateProductScreen() {
  const router = useRouter();
  const { categories } = useCategories();
  const [imageUri, setImageUri] = useState<string>('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductInput>({
    defaultValues: {
      name: '',
      categoryId: '',
      description: '',
      price: '',
      stock: '',
      image_path: '',
    },
  });

  const handlePickImage = async (fromCamera: boolean = false) => {
    try {
      const result = await productService.pickImage(fromCamera);

      if (result.success && result.data) {
        console.log('Image picked successfully:', result.data);
        setImageUri(result.data);
        return result.data;
      } else if (result.error) {
        console.error('Pick image error:', result.error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Exception in handlePickImage:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Gagal memilih gambar',
        position: 'top',
      });
    }
    return undefined;
  };

  const onSubmit = async (data: CreateProductInput) => {
    try {
      // Create temporary product to get ID
      const tempResult = await productService.create({
        ...data,
        image_path: '',
      });

      if (!tempResult.success || !tempResult.data) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: tempResult.error || 'Gagal menambahkan produk',
          position: 'top',
        });
        return;
      }

      const productId = tempResult.data;

      // Save image if exists
      let finalImagePath = '';
      if (imageUri) {
        const imageResult = await productService.saveImage(imageUri, productId);
        if (imageResult.success && imageResult.data) {
          finalImagePath = imageResult.data;
        } else {
          console.error('Failed to save image:', imageResult.error);
        }
      }

      // Update product with image path
      const updateResult = await productService.update(productId, {
        ...data,
        image_path: finalImagePath,
      });

      if (updateResult.success) {
        Toast.show({
          type: 'success',
          text1: 'Berhasil',
          text2: 'Produk berhasil ditambahkan',
          position: 'top',
        });
        reset();
        setImageUri('');
        router.push('/(drawer)/products');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: updateResult.error || 'Gagal menambahkan produk',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Exception in onSubmit:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Terjadi kesalahan',
        position: 'top',
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <View style={styles.form}>
          <ImagePicker
            label="Gambar Produk"
            value={imageUri}
            onValueChange={setImageUri}
            onPickImage={handlePickImage}
          />

          <Controller
            control={control}
            name="name"
            rules={{ required: 'Nama produk harus diisi' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nama Produk *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Masukkan nama produk"
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="categoryId"
            rules={{ required: 'Kategori harus dipilih' }}
            render={({ field: { onChange, value } }) => (
              <Select
                label="Kategori *"
                selectedValue={value}
                onValueChange={onChange}
                options={categories.map((category) => ({
                  label: category.name,
                  value: category.categoryId,
                }))}
                placeholder="-- Pilih Kategori --"
                error={errors.categoryId?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            rules={{ required: 'Deskripsi harus diisi' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Deskripsi *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Masukkan deskripsi produk"
                error={errors.description?.message}
                multiline
                numberOfLines={4}
              />
            )}
          />

          <Controller
            control={control}
            name="price"
            rules={{
              required: 'Harga harus diisi',
              pattern: {
                value: /^[0-9]+$/,
                message: 'Harga harus berupa angka',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Harga *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Masukkan harga produk"
                error={errors.price?.message}
                keyboardType="numeric"
              />
            )}
          />

          <Controller
            control={control}
            name="stock"
            rules={{
              required: 'Stok harus diisi',
              pattern: {
                value: /^[0-9]+$/,
                message: 'Stok harus berupa angka',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Stok *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Masukkan jumlah stok"
                error={errors.stock?.message}
                keyboardType="numeric"
              />
            )}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Batal"
              variant="secondary"
              onPress={() => router.push('/(drawer)/products')}
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
