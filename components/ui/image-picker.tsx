import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from './button';

interface ImagePickerProps {
  value?: string;
  onValueChange?: (uri: string) => void;
  onPickImage?: (fromCamera: boolean) => Promise<string | undefined>;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function ImagePicker({ value, onValueChange, onPickImage, label, error, disabled = false }: ImagePickerProps) {
  console.log('ImagePicker rendered with value:', value);
  
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#1c1c1c' }, 'background');
  const errorBorderColor = useThemeColor({ light: '#f44336', dark: '#ef5350' }, 'text');
  const cardBg = useThemeColor({ light: '#f5f5f5', dark: '#2a2a2a' }, 'background');

  const handleRemoveImage = () => {
    onValueChange?.('');
  };

  const handlePickFromGallery = async () => {
    if (onPickImage && !disabled) {
      await onPickImage(false);
    }
  };

  const handlePickFromCamera = async () => {
    if (onPickImage && !disabled) {
      await onPickImage(true);
    }
  };

  return (
    <View style={styles.container}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}

      <View style={[styles.imagePickerContainer, { backgroundColor: cardBg }]}>
        {value ? (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: value }} 
              style={styles.imagePreview} 
              resizeMode="cover"
              onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
              onLoad={() => console.log('Image loaded successfully')}
            />
            <View style={styles.imageOverlay}>
              <Pressable
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
                disabled={disabled}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Icon name="close" size={24} color="#fff" />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.imagePlaceholder, { borderColor: error ? errorBorderColor : borderColor }]}>
            <View style={styles.placeholderIconContainer}>
              <Icon name="add-photo-alternate" size={64} color="#999" />
            </View>
            <ThemedText style={styles.imagePlaceholderTitle}>Tambah Gambar</ThemedText>
            <ThemedText style={styles.imagePlaceholderText}>Pilih gambar dari galeri atau ambil foto</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.imageButtonsContainer}>
        <Button
          title="📁 Galeri"
          variant="secondary"
          onPress={handlePickFromGallery}
          style={styles.imageButton}
          disabled={disabled}
        />
      </View>

      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  imagePickerContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderIconContainer: {
    marginBottom: 16,
    opacity: 0.6,
  },
  imagePlaceholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 12,
  },
  removeImageButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
});
