import { auth, googleProvider } from '@/config/firebase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

// Penting: Enable warm up untuk web browser di Android
WebBrowser.maybeCompleteAuthSession();

// Konfigurasi Google Sign-In
// Web Client ID dari Firebase Console > Authentication > Sign-in method > Google
const WEB_CLIENT_ID = '220462691864-25vq696haq4kth4bq2gem8it4hv510p1.apps.googleusercontent.com';

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: WEB_CLIENT_ID,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'pointofsale',
      }),
      responseType: AuthSession.ResponseType.IdToken,
      scopes: ['openid', 'profile', 'email'],
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    }
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleCredential(id_token);
    }
  }, [response]);

  const handleGoogleCredential = async (idToken: string) => {
    try {
      setLoading(true);
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      return result.user;
    } catch (error: any) {
      console.error('Google credential error:', error);
      let errorMessage = 'Gagal login dengan Google. Silakan coba lagi.';

      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Email sudah terdaftar dengan metode login lain';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Tidak ada koneksi internet';
      }

      Alert.alert('Error', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      if (Platform.OS === 'web') {
        // Untuk web, gunakan popup
        const { signInWithPopup } = await import('firebase/auth');
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      } else {
        // Untuk native (Android/iOS) menggunakan Expo AuthSession
        const result = await promptAsync();
        if (result.type === 'success') {
          // Akan di-handle di useEffect
          return null;
        } else if (result.type === 'cancel') {
          return null;
        }
        throw new Error('Authentication failed');
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);

      let errorMessage = 'Gagal login dengan Google. Silakan coba lagi.';

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login dibatalkan';
      } else if (error.message === 'Authentication failed') {
        return null; // User cancelled
      }

      Alert.alert('Error', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    loading,
  };
}
