import { useThemeColor } from '@/hooks/use-theme-color';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ThemedText } from '../themed-text';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  lightColor?: string;
  darkColor?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showPasswordToggle?: boolean;
};

export function Input({
  label,
  error,
  style,
  lightColor,
  darkColor,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  secureTextEntry,
  ...otherProps
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#333' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}
      <View style={styles.inputContainer}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              borderColor: error ? '#f44336' : borderColor,
              backgroundColor,
              color: textColor,
              paddingLeft: leftIcon ? 40 : 12,
              paddingRight: showPasswordToggle ? 40 : 12,
            },
            style,
          ]}
          placeholderTextColor="#999"
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          {...otherProps}
        />
        {showPasswordToggle && (
          <Pressable onPress={togglePasswordVisibility} style={styles.rightIconContainer}>
            <Icon name={isPasswordVisible ? 'visibility' : 'visibility-off'} size={20} color="#666" />
          </Pressable>
        )}
        {rightIcon && !showPasswordToggle && <View style={styles.rightIconContainer}>{rightIcon}</View>}
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
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: '#f44336',
  },
});
