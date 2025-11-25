import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ImagePicker } from '@/components/ui/image-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/categories/use-categories';
import { useProduct } from '@/hooks/products/use-product';
import { productService } from '@/services/product.service';
import type { UpdateProductInput } from '@/types/product.type';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, loading: productLoading, error: productError } = useProduct(id);
  const { categories } = useCategories();
  const [imageUri, setImageUri] = useState<string>('');
  const [originalImagePath, setOriginalImagePath] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateProductInput>({
    defaultValues: {
      name: '',
      categoryId: '',
      description: '',
      price: '',
      stock: '',
      image_path: '',
    },
  });

  // Update form when product data is loaded
  useEffect(() => {
    if (product) {
      console.log('Product loaded:', product);
      console.log('Image path:', product.image_path);
      reset({
        name: product.name,
        categoryId: product.categoryId,
        description: product.description,
        price: product.price,
        stock: product.stock,
        image_path: product.image_path,
      });
      setImageUri(product.image_path || '');
      setOriginalImagePath(product.image_path || '');
    }
  }, [product, reset]);

  // Handle error or not found
  useEffect(() => {
    if (productError && !productLoading) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: productError,
        position: 'top',
      });
      router.back();
    }
  }, [productError, productLoading]);

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

  const onSubmit = async (data: UpdateProductInput) => {
    if (!id) return;

    try {
      let finalImagePath = originalImagePath;

      // If image was changed, save new image and delete old one
      if (imageUri && imageUri !== originalImagePath) {
        // Delete old image if exists
        if (originalImagePath) {
          await productService.deleteImage(originalImagePath);
        }

        // Save new image
        const imageResult = await productService.saveImage(imageUri, id);
        if (imageResult.success && imageResult.data) {
          finalImagePath = imageResult.data;
        } else {
          console.error('Failed to save image:', imageResult.error);
        }
      } else if (!imageUri && originalImagePath) {
        // If image was removed, delete old image
        await productService.deleteImage(originalImagePath);
        finalImagePath = '';
      }

      const result = await productService.update(id, {
        ...data,
        image_path: finalImagePath,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Berhasil',
          text2: 'Produk berhasil diperbarui',
          position: 'top',
        });
        router.push('/(drawer)/products');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'Gagal memperbarui produk',
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

  if (productLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView>
          <View style={styles.form}>
            <View>
              <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
              <Skeleton width={200} height={200} style={{ alignSelf: 'center', marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Skeleton width="48%" height={48} />
                <Skeleton width="48%" height={48} />
              </View>
            </View>

            <View>
              <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={48} />
            </View>

            <View>
              <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={48} />
            </View>

            <View>
              <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={96} />
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
