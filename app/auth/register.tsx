import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', confirmPassword: '' });

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '', confirmPassword: '' };

    if (!email.trim()) {
      newErrors.email = 'Email harus diisi';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format email tidak valid';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password harus diisi';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
      valid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Password tidak sama';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      try {
        const u = cred.user;
        const persisted = { uid: u.uid, email: u.email, displayName: u.displayName };
        await AsyncStorage.setItem('persistedUser', JSON.stringify(persisted));
      } catch (e) {
        // ignore storage errors
      }
      // Navigation handled automatically by useProtectedRoute in _layout.tsx
    } catch (error: any) {
      console.error('Register error:', error);
      let errorMessage = 'Gagal registrasi. Silakan coba lagi.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email sudah terdaftar';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password terlalu lemah';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.content}>
          <View style={styles.iconContainer}>
            <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <ThemedText type="title" style={styles.title}>
            Daftar Akun Baru
          </ThemedText>
          <ThemedText style={styles.subtitle}>Buat akun untuk menggunakan aplikasi</ThemedText>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Masukkan email Anda"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: '' });
              }}
              error={errors.email}
              leftIcon={<Icon name="email" size={20} color="#666" />}
            />

            <Input
              label="Password"
              placeholder="Masukkan password (min. 6 karakter)"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: '' });
              }}
              error={errors.password}
              leftIcon={<Icon name="lock" size={20} color="#666" />}
              showPasswordToggle
            />

            <Input
              label="Konfirmasi Password"
              placeholder="Masukkan ulang password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors({ ...errors, confirmPassword: '' });
              }}
              error={errors.confirmPassword}
              leftIcon={<Icon name="lock" size={20} color="#666" />}
              showPasswordToggle
            />

            <Button
              title={loading ? 'Loading...' : 'Daftar'}
              onPress={handleRegister}
              disabled={loading}
              style={styles.registerButton}
            />

            <View style={styles.loginContainer}>
              <ThemedText>Sudah punya akun? </ThemedText>
              <Button
                title="Login"
                variant="secondary"
                onPress={() => router.back()}
                disabled={loading}
                style={styles.loginButton}
              />
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 250,
    height: 250,
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
  form: {
    gap: 16,
  },
  registerButton: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
