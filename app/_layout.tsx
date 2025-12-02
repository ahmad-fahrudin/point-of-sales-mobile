import { auth } from '@/config/firebase';
import { CartProvider } from '@/hooks/use-cart-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

export const unstable_settings = {
  initialRouteName: 'auth',
};

function useProtectedRoute(user: any, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inDrawerGroup = segments[0] === '(drawer)';

    if (!user && inDrawerGroup) {
      // Redirect ke login jika tidak ada user dan mencoba akses drawer
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect ke drawer jika sudah login dan berada di auth
      router.replace('/(drawer)');
    }
  }, [user, segments, isLoading]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsLoading(false);
      } else {
        // If Firebase has no user (e.g. auth not persisted), try restoring from AsyncStorage
        (async () => {
          try {
            const raw = await AsyncStorage.getItem('persistedUser');
            if (raw) {
              const parsed = JSON.parse(raw);
              setUser(parsed);
            } else {
              setUser(null);
            }
          } catch (e) {
            setUser(null);
          } finally {
            setIsLoading(false);
          }
        })();
      }
    });

    return () => unsubscribe();
  }, []);

  useProtectedRoute(user, isLoading);

  return (
    <CartProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {!isLoading && (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
          </Stack>
        )}
        <StatusBar style="auto" />
        <Toast />
      </ThemeProvider>
    </CartProvider>
  );
}
