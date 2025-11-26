import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ImagePicker } from '@/components/ui/image-picker';
import { Input } from '@/components/ui/input';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useSpending } from '@/hooks/spending/use-spending';
import { spendingService } from '@/services/spending.service';
import type { UpdateSpendingInput } from '@/types/spending.type';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function EditSpendingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spending, loading } = useSpending(id);
  const [imageUri, setImageUri] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSpendingInput>({
    defaultValues: {
      description: '',
      totalAmount: 0,
      spendingDate: '',
      imagePath: '',
    },
  });

  useEffect(() => {
    if (spending) {
      setValue('description', spending.description);
      setValue('totalAmount', spending.totalAmount);
      setValue('spendingDate', spending.spendingDate);
      setValue('imagePath', spending.imagePath);
      setImageUri(spending.imagePath);
      setSelectedDate(new Date(spending.spendingDate));
    }
  }, [spending, setValue]);

  const handlePickImage = async (fromCamera: boolean = false) => {
    try {
      const result = await spendingService.pickImage(fromCamera);

      if (result.success && result.data) {
        setImageUri(result.data);
        return result.data;
      } else if (result.error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error,
          position: 'top',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Gagal memilih gambar',
        position: 'top',
      });
    }
    return undefined;
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      const dateString = date.toISOString().split('T')[0];
      setValue('spendingDate', dateString);
    }
  };

  const onSubmit = async (data: UpdateSpendingInput) => {
    if (!spending) return;

    try {
      let finalImagePath = spending.imagePath;

      // If image changed, save new image
      if (imageUri && imageUri !== spending.imagePath) {
        const imageResult = await spendingService.saveImage(imageUri, spending.spendingId);
        if (imageResult.success && imageResult.data) {
          finalImagePath = imageResult.data;
          // Delete old image
          if (spending.imagePath) {
            await spendingService.deleteImage(spending.imagePath);
          }
        }
      }

      const result = await spendingService.update(spending.spendingId, {
        ...data,
        imagePath: finalImagePath,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Berhasil',
          text2: 'Pengeluaran berhasil diperbarui',
          position: 'top',
        });
        router.push('/(drawer)/spendings');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'Gagal memperbarui pengeluaran',
          position: 'top',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Terjadi kesalahan',
        position: 'top',
      });
    }
  };

  if (loading || !spending) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.form}>
          {[1, 2, 3, 4].map((i) => (
            <TableRowSkeleton key={i} />
          ))}
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <View style={styles.form}>
          <ImagePicker
            label="Foto Struk/Bukti (Opsional)"
            value={imageUri}
            onValueChange={setImageUri}
            onPickImage={handlePickImage}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Pengeluaran *</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <Text style={styles.dateText}>
                {spendingService.formatDate(selectedDate)}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <Controller
            control={control}
            name="description"
            rules={{ required: 'Keterangan harus diisi' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Textarea
                label="Keterangan *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
                placeholder="Contoh: Pembelian bahan baku, Biaya listrik, dll"
                rows={3}
              />
            )}
          />

          <Controller
            control={control}
            name="totalAmount"
            rules={{
              required: 'Jumlah pengeluaran harus diisi',
              min: { value: 1, message: 'Jumlah minimal Rp 1' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Jumlah Pengeluaran *"
                value={value?.toString()}
                onChangeText={(text) => {
                  const numValue = text.replace(/[^0-9]/g, '');
                  onChange(numValue ? parseInt(numValue) : 0);
                }}
                onBlur={onBlur}
                error={errors.totalAmount?.message}
                keyboardType="numeric"
                placeholder="0"
              />
            )}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Batal"
              onPress={() => router.push('/(drawer)/spendings')}
              variant="secondary"
              style={styles.button}
            />
            <Button
              title={isSubmitting ? 'Menyimpan...' : 'Simpan'}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={styles.button}
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
  },
  form: {
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
});
