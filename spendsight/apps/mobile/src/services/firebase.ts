// import { initializeApp, getApps } from 'firebase/app';
// import { initializeAuth } from 'firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const firebaseConfig = {
//     apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
//     authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
//     projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
//     appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
// };

// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// // Firebase v12 removed getReactNativePersistence from firebase/auth
// // The correct approach is to pass AsyncStorage directly to initializeAuth

// const auth = initializeAuth(app, {
//     persistence: {
//         type: 'LOCAL' as const,
//         _shouldAllowMigration: true,
//         async _get(key: string) {
//             return AsyncStorage.getItem(key);
//         },
//         async _set(key: string, value: string) {
//             return AsyncStorage.setItem(key, value);
//         },
//         async _remove(key: string) {
//             return AsyncStorage.removeItem(key);
//         },
//     } as any,
// });

// export { app, auth };

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);

export { app, auth };