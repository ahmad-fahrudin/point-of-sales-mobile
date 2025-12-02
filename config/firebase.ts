// Platform shim: delegate to platform-specific firebase implementations.
import { Platform } from 'react-native';
import * as nativeImpl from './firebase.native';
import * as webImpl from './firebase.web';

const impl = Platform.OS === 'web' ? webImpl : nativeImpl;

// Re-export named exports so TypeScript / the editor can resolve them.
export const auth = (impl as any).auth;
export const db = (impl as any).db;
export const googleProvider = (impl as any).googleProvider;
export default (impl as any).default;

