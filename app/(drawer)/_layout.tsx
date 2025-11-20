import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const [categoryExpanded, setCategoryExpanded] = useState(false);

  const activeColor = Colors[colorScheme ?? 'light'].tint;
  // Use the gray icon color defined in the theme so the header matches the DrawerItem inactive color
  const inactiveColor = Colors[colorScheme ?? 'light'].icon;

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem
        label="Home"
        icon={({ color }) => <MaterialCommunityIcons size={28} name="home" color={color} />}
        onPress={() => router.push('/(drawer)')}
        activeTintColor={activeColor}
        focused={pathname === '/(drawer)' || pathname === '/'}
      />

      {/* Category Dropdown */}
      <TouchableOpacity style={styles.dropdownHeader} onPress={() => setCategoryExpanded(!categoryExpanded)}>
        <View style={styles.dropdownHeaderContent}>
          <MaterialCommunityIcons
            size={28}
            name="view-list"
            color={pathname.includes('/categories') ? activeColor : inactiveColor}
            style={styles.icon}
          />
          <Text
            style={[styles.dropdownLabel, { color: pathname.includes('/categories') ? activeColor : inactiveColor }]}
          >
            Category
          </Text>
        </View>
        <MaterialCommunityIcons
          size={20}
          name={categoryExpanded ? 'chevron-up' : 'chevron-down'}
          color={categoryExpanded ? activeColor : inactiveColor}
        />
      </TouchableOpacity>

      {categoryExpanded && (
        <View style={styles.subItemsContainer}>
          <DrawerItem
            label="List Categories"
            icon={({ color }) => <MaterialCommunityIcons size={24} name="format-list-bulleted" color={color} />}
            onPress={() => router.push('/(drawer)/categories')}
            activeTintColor={activeColor}
            focused={pathname === '/(drawer)/categories' || pathname === '/(drawer)/categories/index'}
            style={styles.subItem}
          />
          <DrawerItem
            label="Create Category"
            icon={({ color }) => <MaterialCommunityIcons size={24} name="plus-circle" color={color} />}
            onPress={() => router.push('/(drawer)/categories/create')}
            activeTintColor={activeColor}
            focused={pathname === '/(drawer)/categories/create'}
            style={styles.subItem}
          />
        </View>
      )}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 9,
    marginHorizontal: 8,
  },
  dropdownHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 11,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  subItemsContainer: {
    paddingLeft: 12,
  },
  subItem: {
    paddingLeft: 16,
  },
});

export default function DrawerLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          drawerPosition: 'left',
          headerShown: true,
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: 'Home',
            drawerLabel: 'Home',
            drawerIcon: ({ color }) => <MaterialCommunityIcons size={28} name="home" color={color} />,
          }}
        />
        <Drawer.Screen
          name="categories"
          options={{
            title: 'Category',
            drawerLabel: 'Category',
            drawerIcon: ({ color }) => <MaterialCommunityIcons size={28} name="view-list" color={color} />,
            headerShown: true,
            drawerItemStyle: { height: 0, display: 'none' },
          }}
        />
        <Drawer.Screen
          name="categories/index"
          options={{
            title: 'Category',
            drawerLabel: 'Category',
            drawerIcon: ({ color }) => <MaterialCommunityIcons size={28} name="view-list" color={color} />,
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="categories/create"
          options={{
            title: 'Tambah Kategori',
            drawerItemStyle: { height: 0, display: 'none' },
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="categories/edit"
          options={{
            title: 'Edit Kategori',
            drawerItemStyle: { height: 0, display: 'none' },
            headerShown: true,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
