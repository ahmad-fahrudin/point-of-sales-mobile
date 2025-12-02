import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auth } from '@/config/firebase';
import { useGoogleSignIn } from '@/hooks/use-google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const { signInWithGoogle, loading: googleLoading } = useGoogleSignIn();

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

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

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      try {
        const u = cred.user;
        const persisted = { uid: u.uid, email: u.email, displayName: u.displayName };
        await AsyncStorage.setItem('persistedUser', JSON.stringify(persisted));
      } catch (e) {
        // ignore storage errors
      }
      // Navigation handled automatically by useProtectedRoute in _layout.tsx
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Gagal login. Silakan coba lagi.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email tidak terdaftar';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password salah';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email atau password salah';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Navigation handled automatically by useProtectedRoute in _layout.tsx
    } catch (error) {
      // Error sudah ditangani di hook
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
            Selamat Datang
          </ThemedText>
          <ThemedText style={styles.subtitle}>Silakan login untuk melanjutkan</ThemedText>

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
              placeholder="Masukkan password Anda"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: '' });
              }}
              error={errors.password}
              leftIcon={<Icon name="lock" size={20} color="#666" />}
              showPasswordToggle
            />

            <Button
              title={loading ? 'Loading...' : 'Login'}
              onPress={handleLogin}
              disabled={loading || googleLoading}
              style={styles.loginButton}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <ThemedText style={styles.dividerText}>atau</ThemedText>
              <View style={styles.divider} />
            </View>

            <Button
              title={googleLoading ? 'Loading...' : 'Login dengan Google'}
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
              variant="secondary"
              style={styles.googleButton}
              leftIcon={
                <Image
                  source={require('@/assets/icon/icon-google.png')}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
              }
            />

            <View style={styles.registerContainer}>
              <ThemedText>Belum punya akun? </ThemedText>
              <Button
                title="Daftar"
                variant="secondary"
                onPress={() => router.push('/auth/register')}
                disabled={loading}
                style={styles.registerButton}
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
  loginButton: {
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    marginHorizontal: 16,
    opacity: 0.6,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  registerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
