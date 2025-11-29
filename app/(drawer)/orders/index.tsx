import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCart } from '@/hooks/use-cart-context';
import { orderService } from '@/services/order.service';
import type { OrderItem } from '@/types/order.type';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function OrdersScreen() {
  const colorScheme = useColorScheme();
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris'>('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [processing, setProcessing] = useState(false);

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Keranjang Kosong', 'Silakan tambahkan produk terlebih dahulu');
      return;
    }
    setPaymentModalVisible(true);
  };

  const handlePayment = async () => {
    const totalAmount = getTotalAmount();
    const paymentAmountNum = parseFloat(paymentAmount) || 0;

    if (paymentMethod === 'cash' && paymentAmountNum < totalAmount) {
      Alert.alert('Pembayaran Tidak Cukup', 'Jumlah pembayaran kurang dari total');
      return;
    }

    setProcessing(true);

    try {
      const response = await orderService.create({
        items: cartItems,
        totalAmount,
        paymentMethod,
        paymentAmount: paymentMethod === 'cash' ? paymentAmountNum : totalAmount,
        change: paymentMethod === 'cash' ? paymentAmountNum - totalAmount : 0,
        customerName: customerName.trim(),
      });

      if (response.success && response.data) {
        Toast.show({
          type: 'success',
          text1: 'Transaksi Berhasil',
          text2: 'Pesanan telah berhasil dibuat',
        });

        // Reset form
        clearCart();
        setPaymentAmount('');
        setCustomerName('');
        setPaymentModalVisible(false);

        // Navigate to detail page with order ID
        router.push(`/orders/detail?id=${response.data}`);
      } else {
        Alert.alert('Error', response.error || 'Gagal membuat pesanan');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const renderCartItem = ({ item }: { item: OrderItem }) => (
    <View style={[styles.cartItem, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
      <View style={styles.cartItemImage}>
        {item.image_path ? (
          <Image source={{ uri: item.image_path }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={[styles.itemImagePlaceholder, { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f0f0f0' }]}>
            <Ionicons name="image-outline" size={24} color={colorScheme === 'dark' ? '#666' : '#ccc'} />
          </View>
        )}
      </View>

      <View style={styles.cartItemInfo}>
        <Text style={[styles.cartItemName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>{item.productName}</Text>
        <Text style={styles.cartItemPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
      </View>

      <View style={styles.cartItemActions}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f0f0f0' }]}
            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
          >
            <Ionicons name="remove" size={16} color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>

          <Text style={[styles.quantityText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>{item.quantity}</Text>

          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f0f0f0' }]}
            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
          >
            <Ionicons name="add" size={16} color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtotal}>Rp {item.subtotal.toLocaleString('id-ID')}</Text>

        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Konfirmasi Hapus',
            `Apakah Anda yakin ingin menghapus "${item.productName}" dari keranjang?`,
            [
              { text: 'Batal', style: 'cancel' },
              {
                text: 'Hapus',
                style: 'destructive',
                onPress: () => removeFromCart(item.productId),
              },
            ]
          );
        }} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const paymentOptions = [
    { label: 'Tunai', value: 'cash' },
    { label: 'Kartu', value: 'card' },
    { label: 'QRIS', value: 'qris' },
  ];

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={80} color={colorScheme === 'dark' ? '#666' : '#ccc'} />
            <ThemedText style={styles.emptyText}>Keranjang masih kosong</ThemedText>
            <Button title="Pilih Produk" onPress={() => router.back()} style={{ marginTop: 16 }} />
          </View>
        ) : (
          <>
            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.productId}
              renderItem={renderCartItem}
              contentContainerStyle={styles.cartList}
            />

            <View style={[styles.footer, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
              <View style={styles.totalContainer}>
                <ThemedText style={styles.totalLabel}>Total:</ThemedText>
                <ThemedText style={styles.totalAmount}>Rp {getTotalAmount().toLocaleString('id-ID')}</ThemedText>
              </View>
              <Button title="Checkout" onPress={handleCheckout} style={styles.checkoutButton} />
            </View>
          </>
        )}

        {/* Payment Modal */}
        <Modal visible={paymentModalVisible} animationType="slide" transparent={true} onRequestClose={() => setPaymentModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Pembayaran</ThemedText>
                <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <ThemedText style={styles.label}>Total Pembayaran</ThemedText>
                  <ThemedText style={styles.totalAmountModal}>Rp {getTotalAmount().toLocaleString('id-ID')}</ThemedText>
                </View>

                <View style={styles.modalSection}>
                  <ThemedText style={styles.label}>Nama Pelanggan (Opsional)</ThemedText>
                  <Input
                    placeholder="Masukkan nama pelanggan"
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                </View>

                <View style={styles.modalSection}>
                  <ThemedText style={styles.label}>Metode Pembayaran</ThemedText>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'qris')}
                    options={paymentOptions}
                  />
                </View>

                {paymentMethod === 'cash' && (
                  <View style={styles.modalSection}>
                    <ThemedText style={styles.label}>Jumlah Bayar</ThemedText>
                    <Input
                      placeholder="Masukkan jumlah uang"
                      value={paymentAmount}
                      onChangeText={setPaymentAmount}
                      keyboardType="numeric"
                      leftIcon={<ThemedText>Rp</ThemedText>}
                    />
                    {paymentAmount && parseFloat(paymentAmount) >= getTotalAmount() && (
                      <View style={styles.changeContainer}>
                        <ThemedText style={styles.changeLabel}>Kembalian:</ThemedText>
                        <ThemedText style={styles.changeAmount}>
                          Rp {(parseFloat(paymentAmount) - getTotalAmount()).toLocaleString('id-ID')}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                )}

                <Button
                  title={processing ? 'Memproses...' : 'Proses Pembayaran'}
                  onPress={handlePayment}
                  disabled={processing}
                  style={styles.payButton}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  cartItemActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  subtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginVertical: 4,
  },
  deleteButton: {
    padding: 4,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  checkoutButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalBody: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  totalAmountModal: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 8,
  },
  changeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34c759',
  },
  payButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});
