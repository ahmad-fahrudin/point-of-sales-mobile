import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const [setupExpanded, setSetupExpanded] = useState(false);

  const activeColor = Colors[colorScheme ?? 'light'].tint;
  const inactiveColor = Colors[colorScheme ?? 'light'].icon;
  // gunakan warna 'danger' dari theme jika tersedia, fallback ke merah iOS
  const destructiveColor = (Colors[colorScheme ?? 'light'] as any)?.danger ?? '#ff3b30';

  // Added logout handler
  const handleLogout = () => {
    Alert.alert('Logout', 'Anda yakin ingin logout?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    // Wrap scroll + footer in a container so the footer can be static at the bottom
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
        <DrawerItem
          label="Home"
          icon={({ color }) => <MaterialCommunityIcons size={28} name="home" color={color} />}
          onPress={() => router.push('/(drawer)')}
          activeTintColor={activeColor}
          focused={pathname === '/(drawer)' || pathname === '/'}
        />

        {/* Setup Dropdown */}
        <TouchableOpacity style={styles.dropdownHeader} onPress={() => setSetupExpanded(!setupExpanded)}>
          <View style={styles.dropdownHeaderContent}>
            <MaterialCommunityIcons
              size={28}
              name="cog"
              color={pathname.includes('/categories') || pathname.includes('/products') ? activeColor : inactiveColor}
              style={styles.icon}
            />
            <Text
              style={[
                styles.dropdownLabel,
                {
                  color: pathname.includes('/categories') || pathname.includes('/products') ? activeColor : inactiveColor,
                },
              ]}
            >
              Setup
            </Text>
          </View>
          <MaterialCommunityIcons
            size={20}
            name={setupExpanded ? 'chevron-up' : 'chevron-down'}
            color={setupExpanded ? activeColor : inactiveColor}
          />
        </TouchableOpacity>

        {setupExpanded && (
          <View style={styles.subItemsContainer}>
            <DrawerItem
              label="Category"
              icon={({ color }) => <MaterialCommunityIcons size={24} name="view-list" color={color} />}
              onPress={() => router.push('/(drawer)/categories')}
              activeTintColor={activeColor}
              focused={pathname.includes('/categories')}
              style={styles.subItem}
            />
            <DrawerItem
              label="Product"
              icon={({ color }) => <MaterialCommunityIcons size={24} name="package-variant" color={color} />}
              onPress={() => router.push('/(drawer)/products')}
              activeTintColor={activeColor}
              focused={pathname.includes('/products')}
              style={styles.subItem}
            />
          </View>
        )}

        <DrawerItem
          label="Riwayat Pesanan"
          icon={({ color }) => <MaterialCommunityIcons size={28} name="receipt" color={color} />}
          onPress={() => router.push('/(drawer)/orders/history')}
          activeTintColor={activeColor}
          focused={pathname.includes('/orders/history')}
        />

        <DrawerItem
          label="Laporan Pendapatan"
          icon={({ color }) => <MaterialCommunityIcons size={28} name="chart-bar" color={color} />}
          onPress={() => router.push('/(drawer)/reports')}
          activeTintColor={activeColor}
          focused={pathname.includes('/reports')}
        />

        <DrawerItem
          label="Pengeluaran"
          icon={({ color }) => <MaterialCommunityIcons size={28} name="cash-multiple" color={color} />}
          onPress={() => router.push('/(drawer)/spendings')}
          activeTintColor={activeColor}
          focused={pathname.includes('/spendings')}
        />
      </DrawerContentScrollView>

      {/* Logout sekarang berada di luar DrawerContentScrollView sehingga menempel di bawah */}
      <View style={styles.logoutContainer}>
        <DrawerItem
          label="Logout"
          // selalu gunakan warna destruktif
          icon={() => <MaterialCommunityIcons size={28} name="logout" color={destructiveColor} />}
          onPress={handleLogout}
          activeTintColor={destructiveColor}
          labelStyle={{ color: destructiveColor, fontWeight: '600' }}
          style={styles.logoutItem} // <-- apply new style
        />
      </View>
    </View>
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
  // Adjusted logoutContainer style
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
    paddingVertical: 8,
    paddingBottom: 16, 
    alignSelf: 'stretch',
  },
  // shift logout item a bit to the right
  logoutItem: {
    paddingLeft: 20,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
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
        <Drawer.Screen
          name="products"
          options={{
            title: 'Product',
            drawerLabel: 'Product',
            drawerIcon: ({ color }) => <MaterialCommunityIcons size={28} name="package-variant" color={color} />,
            headerShown: true,
            drawerItemStyle: { height: 0, display: 'none' },
          }}
        />
        <Drawer.Screen
          name="products/index"
          options={{
            title: 'Product',
            drawerLabel: 'Product',
            drawerIcon: ({ color }) => <MaterialCommunityIcons size={28} name="package-variant" color={color} />,
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="products/create"
          options={{
            title: 'Tambah Produk',
            drawerItemStyle: { height: 0, display: 'none' },
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="products/edit"
          options={{
            title: 'Edit Produk',
            drawerItemStyle: { height: 0, display: 'none' },
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="orders"
          options={{
            title: 'Orders',
            drawerLabel: 'Orders',
            drawerIcon: ({ color }) => <MaterialCommunityIcons size={28} name="cart" color={color} />,
            headerShown: false,
            drawerItemStyle: { height: 0, display: 'none' },
          }}
        />
        <Drawer.Screen
          name="orders/index"
          options={{
            title: 'Keranjang Pesanan',
            drawerItemStyle: { height: 0, display: 'none' },
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="orders/history"
          options={{
            title: 'Riwayat Pesanan',
            drawerLabel: 'Riwayat Pesanan',
            drawerIcon: ({ color }) => <MaterialCommunityIcons size={28} name="receipt" color={color} />,
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="orders/detail"
          options={{
            title: 'Detail Pesanan',
            drawerItemStyle: { height: 0, display: 'none' },
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="reports"
          options={{
            title: 'Reports',
            drawerLabel: 'Reports',
            drawerIcon: ({ color }) => <MaterialCommunityIcons size={28} name="chart-bar" color={color} />,
            headerShown: false,
            drawerItemStyle: { height: 0, display: 'none' },
          }}
        />
        <Drawer.Screen
          name="reports/index"
          options={{
            title: 'Laporan Pendapatan',
            drawerLabel: 'Laporan Pendapatan',
            drawerIcon: ({ color }) => <MaterialCommunityIcons size={28} name="chart-bar" color={color} />,
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="spendings"
          options={{
            title: 'Pengeluaran',
            drawerLabel: 'Pengeluaran',
            drawerIcon: ({ color }) => <MaterialCommunityIcons size={28} name="cash-multiple" color={color} />,
            headerShown: false,
            drawerItemStyle: { height: 0, display: 'none' },
          }}
        />
        <Drawer.Screen
          name="spendings/index"
          options={{
            title: 'Pengeluaran',
            drawerLabel: 'Pengeluaran',
            drawerIcon: ({ color }) => <MaterialCommunityIcons size={28} name="cash-multiple" color={color} />,
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="spendings/create"
          options={{
            title: 'Tambah Pengeluaran',
            drawerItemStyle: { height: 0, display: 'none' },
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="spendings/edit"
          options={{
            title: 'Edit Pengeluaran',
            drawerItemStyle: { height: 0, display: 'none' },
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="spendings/show"
          options={{
            title: 'Detail Pengeluaran',
            drawerItemStyle: { height: 0, display: 'none' },
            headerShown: true,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
