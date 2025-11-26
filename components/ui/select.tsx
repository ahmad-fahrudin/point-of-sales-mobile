import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Picker, PickerProps } from '@react-native-picker/picker';
import { StyleSheet, View } from 'react-native';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends Omit<PickerProps, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  value?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder = '-- Pilih --',
  disabled = false,
  value,
  ...pickerProps
}: SelectProps) {
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#444' }, 'text');
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#333' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const disabledBg = useThemeColor({ light: '#f5f5f5', dark: '#2a2a2a' }, 'background');

  return (
    <View style={styles.container}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}

      <View
        style={[
          styles.pickerWrapper,
          {
            borderColor: error ? '#f44336' : borderColor,
            backgroundColor: disabled ? disabledBg : backgroundColor,
          },
          disabled && styles.disabled,
        ]}
      >
        <Picker
          {...pickerProps}
          selectedValue={value}
          enabled={!disabled}
          style={[styles.picker, { color: textColor }]}
          dropdownIconColor={textColor}
        >
          {placeholder && <Picker.Item label={placeholder} value="" enabled={false} />}
          {options.map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
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
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  picker: {
    paddingRight: 40,
    height: 48,
    fontSize: 16,
  },
  iconContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    pointerEvents: 'none',
  },
  disabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
});
