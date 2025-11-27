import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  lightColor?: string;
  darkColor?: string;
  style?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
};

export function Button({
  title,
  variant = 'primary',
  style,
  disabled,
  lightColor,
  darkColor,
  leftIcon,
  ...otherProps
}: ButtonProps) {
  // Panggil hooks di level atas komponen
  const secondaryColor = useThemeColor({ light: '#6c757d', dark: '#495057' }, 'text');
  const primaryColor = useThemeColor({ light: lightColor || '#007AFF', dark: darkColor || '#0A84FF' }, 'tint');

  const getBackgroundColor = () => {
    if (disabled) return '#ccc';
    switch (variant) {
      case 'secondary':
        return secondaryColor;
      case 'danger':
        return '#f44336';
      default:
        return primaryColor;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: getBackgroundColor(), opacity: pressed ? 0.8 : 1 },
        style,
      ]}
      disabled={disabled}
      {...otherProps}
    >
      <View style={styles.contentRow}>
        {leftIcon ? <View style={styles.iconWrapper}>{leftIcon}</View> : null}
        <Text style={styles.text}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
