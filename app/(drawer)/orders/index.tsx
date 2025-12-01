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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris' | 'credit'>('cash');
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

    // Validation for cash payment
    if (paymentMethod === 'cash' && paymentAmountNum < totalAmount) {
      Alert.alert('Pembayaran Tidak Cukup', 'Jumlah pembayaran kurang dari total');
      return;
    }

    // Validation for credit payment - customer name is required
    if (paymentMethod === 'credit' && !customerName.trim()) {
      Alert.alert('Nama Pelanggan Wajib', 'Untuk pembayaran kredit, nama pelanggan harus diisi');
      return;
    }

    // Validation for credit payment - payment amount cannot exceed total
    if (paymentMethod === 'credit' && paymentAmountNum > totalAmount) {
      Alert.alert('Pembayaran Berlebih', 'Jumlah pembayaran tidak boleh melebihi total');
      return;
    }

    setProcessing(true);

    try {
      let finalPaymentAmount = totalAmount;
      let changeAmount = 0;

      if (paymentMethod === 'cash') {
        finalPaymentAmount = paymentAmountNum;
        changeAmount = paymentAmountNum - totalAmount;
      } else if (paymentMethod === 'credit') {
        finalPaymentAmount = paymentAmountNum;
        changeAmount = 0;
      }

      const response = await orderService.create({
        items: cartItems,
        totalAmount,
        paymentMethod,
        paymentAmount: finalPaymentAmount,
        change: changeAmount,
        customerName: customerName.trim(),
      });

      if (response.success && response.data) {
        const successMessage = paymentMethod === 'credit' 
          ? `Pesanan kredit berhasil dibuat. Sisa utang: Rp ${(totalAmount - paymentAmountNum).toLocaleString('id-ID')}`
          : 'Pesanan telah berhasil dibuat';

        Toast.show({
          type: 'success',
          text1: 'Transaksi Berhasil',
          text2: successMessage,
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
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={18} color="#fff" />
          </TouchableOpacity>

          <Text style={[styles.quantityText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color="#fff" />
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
        }} style={styles.deleteButton} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={22} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const paymentOptions = [
    { label: 'Tunai', value: 'cash' },
    { label: 'QRIS', value: 'qris' },
    { label: 'Kredit/Utang', value: 'credit' },
  ];

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <View style={{ 
              width: 120, 
              height: 120, 
              borderRadius: 60, 
              backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <Ionicons name="cart-outline" size={64} color={colorScheme === 'dark' ? '#666' : '#ccc'} />
            </View>
            <ThemedText style={styles.emptyText}>Keranjang masih kosong</ThemedText>
            <ThemedText style={{ fontSize: 14, opacity: 0.4, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>Silakan pilih produk yang ingin Anda beli</ThemedText>
            <Button title="Pilih Produk" onPress={() => router.back()} style={{ marginTop: 24, paddingHorizontal: 32, height: 48, borderRadius: 24 }} />
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
                <View>
                  <ThemedText style={{ fontSize: 14, opacity: 0.6, marginBottom: 4, letterSpacing: 0.3 }}>Total Pembayaran</ThemedText>
                  <ThemedText style={styles.totalLabel}>Total</ThemedText>
                </View>
                <ThemedText style={styles.totalAmount}>Rp {getTotalAmount().toLocaleString('id-ID')}</ThemedText>
              </View>
              <Button title="Proses Checkout" onPress={handleCheckout} style={styles.checkoutButton} />
            </View>
          </>
        )}

        {/* Payment Modal */}
        <Modal visible={paymentModalVisible} animationType="slide" transparent={true} onRequestClose={() => setPaymentModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
              <View style={styles.modalHeader}>
                <View>
                  <ThemedText type="subtitle" style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Pembayaran</ThemedText>
                  <ThemedText style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>Lengkapi informasi pembayaran</ThemedText>
                </View>
                <TouchableOpacity 
                  onPress={() => setPaymentModalVisible(false)} 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={[styles.modalSection, { 
                  backgroundColor: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0, 122, 255, 0.06)',
                  padding: 20,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)'
                }]}>
                  <ThemedText style={styles.label}>Total Pembayaran</ThemedText>
                  <ThemedText style={styles.totalAmountModal}>Rp {getTotalAmount().toLocaleString('id-ID')}</ThemedText>
                </View>

                <View style={styles.modalSection}>
                  <ThemedText style={styles.label}>
                    Nama Pelanggan {paymentMethod === 'credit' && '(Wajib untuk Kredit)'}
                  </ThemedText>
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
                    onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'qris' | 'credit')}
                    options={paymentOptions}
                  />
                </View>

                {(paymentMethod === 'cash' || paymentMethod === 'credit') && (
                  <View style={styles.modalSection}>
                    <ThemedText style={styles.label}>
                      {paymentMethod === 'cash' ? 'Jumlah Bayar' : 'Uang Muka (Opsional)'}
                    </ThemedText>
                    <Input
                      placeholder={paymentMethod === 'cash' ? 'Masukkan jumlah uang' : 'Masukkan uang muka (boleh kosong)'}
                      value={paymentAmount}
                      onChangeText={setPaymentAmount}
                      keyboardType="numeric"
                      leftIcon={<ThemedText>Rp</ThemedText>}
                    />
                    {paymentMethod === 'cash' && paymentAmount && parseFloat(paymentAmount) >= getTotalAmount() && (
                      <View style={styles.changeContainer}>
                        <ThemedText style={styles.changeLabel}>Kembalian:</ThemedText>
                        <ThemedText style={styles.changeAmount}>
                          Rp {(parseFloat(paymentAmount) - getTotalAmount()).toLocaleString('id-ID')}
                        </ThemedText>
                      </View>
                    )}
                    {paymentMethod === 'credit' && (
                      <View style={[styles.changeContainer, { 
                        backgroundColor: colorScheme === 'dark' ? 'rgba(255, 149, 0, 0.12)' : 'rgba(255, 149, 0, 0.08)',
                        borderColor: colorScheme === 'dark' ? 'rgba(255, 149, 0, 0.3)' : 'rgba(255, 149, 0, 0.2)',
                      }]}>
                        <ThemedText style={styles.changeLabel}>Sisa Utang:</ThemedText>
                        <ThemedText style={[styles.changeAmount, { color: '#ff9500' }]}>
                          Rp {(getTotalAmount() - (parseFloat(paymentAmount) || 0)).toLocaleString('id-ID')}
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
    padding: 20,
    paddingBottom: 8,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cartItemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
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
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  cartItemActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minWidth: 100,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  quantityText: {
    fontSize: 17,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtotal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#007AFF',
    marginVertical: 6,
    letterSpacing: -0.3,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 17,
    opacity: 0.5,
    letterSpacing: 0.1,
  },
  footer: {
    padding: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  totalLabel: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#007AFF',
    letterSpacing: -0.5,
  },
  checkoutButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  modalBody: {
    padding: 24,
    paddingTop: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    opacity: 0.75,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  totalAmountModal: {
    fontSize: 36,
    fontWeight: '900',
    color: '#007AFF',
    letterSpacing: -0.8,
    padding: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    padding: 16,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  changeLabel: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  changeAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#34c759',
    letterSpacing: -0.5,
  },
  payButton: {
    marginTop: 12,
    marginBottom: 20,
    height: 56,
    borderRadius: 16,
  },
});
