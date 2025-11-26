import { useThemeColor } from '@/hooks/use-theme-color';
import { ReactNode } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { ThemedText } from '../themed-text';

export type TextareaProps = TextInputProps & {
  label?: string;
  error?: string;
  lightColor?: string;
  darkColor?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  rows?: number; // visual height in rows
  showCharCount?: boolean;
};

export function Textarea({
  label,
  error,
  style,
  lightColor,
  darkColor,
  leftIcon,
  rightIcon,
  rows = 4,
  showCharCount = false,
  maxLength,
  ...otherProps
}: TextareaProps) {
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#333' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  const currentLength = typeof otherProps.value === 'string' ? otherProps.value.length : 0;

  return (
    <View style={styles.container}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}

      <View style={styles.inputContainer}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          {...otherProps}
          style={[
            styles.textarea,
            {
              borderColor: error ? '#f44336' : borderColor,
              backgroundColor,
              color: textColor,
              paddingLeft: leftIcon ? 40 : 12,
              paddingRight: rightIcon ? 40 : 12,
              minHeight: rows * 24,
              textAlignVertical: 'top',
            },
            style,
          ]}
          multiline
          placeholderTextColor="#999"
          maxLength={maxLength}
        />

        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>

      <View style={styles.metaRow}>
        <View style={{ flex: 1 }} />
        {showCharCount && (
          <ThemedText style={styles.charCount}>
            {currentLength}
            {maxLength ? ` / ${maxLength}` : ''}
          </ThemedText>
        )}
      </View>

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
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
  inputContainer: {
    position: 'relative',
  },
  leftIconContainer: {
    position: 'absolute',
    left: 12,
    top: 8,
    bottom: 8,
    justifyContent: 'center',
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 12,
    top: 8,
    bottom: 8,
    justifyContent: 'center',
    zIndex: 1,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: '#f44336',
  },
});
