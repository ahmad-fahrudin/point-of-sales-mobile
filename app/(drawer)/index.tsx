import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { auth } from '@/config/firebase';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Alert, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const handleLogout = async () => {
    Alert.alert('Konfirmasi', 'Apakah Anda yakin ingin logout?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace('/auth/login');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Gagal logout. Silakan coba lagi.');
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Point of Sale App
        </ThemedText>
        <ThemedText style={styles.subtitle}>Selamat datang di aplikasi POS</ThemedText>

        <View style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            Halaman utama aplikasi.{'\n'}
            Fitur akan ditambahkan di sini.
          </ThemedText>
        </View>

        <Button title="Logout" variant="danger" onPress={handleLogout} style={styles.logoutButton} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  infoBox: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
  },
  infoText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  logoutButton: {
    width: '100%',
    maxWidth: 300,
  },
});
