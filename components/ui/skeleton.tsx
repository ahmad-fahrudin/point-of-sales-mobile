import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
};

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const colorScheme = useColorScheme();
  const opacity = useRef(new Animated.Value(0.3));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity.current, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity.current, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
          opacity: opacity.current,
        },
        style,
      ]}
    />
  );
}

export function TableRowSkeleton() {
  return (
    <View style={styles.tableRowSkeleton}>
      <View style={styles.tableCell}>
        <Skeleton width="80%" height={16} />
      </View>
      <View style={styles.tableCell}>
        <Skeleton width="60%" height={16} />
      </View>
      <View style={styles.actionCell}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <Skeleton width={32} height={32} borderRadius={16} style={{ marginLeft: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableRowSkeleton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
  },
  actionCell: {
    width: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
