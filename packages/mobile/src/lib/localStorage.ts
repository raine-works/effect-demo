import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const storage = {
	local: {
		get: async (key: string) => {
			if (Platform.OS === 'web') {
				return localStorage.getItem(key);
			}
			return await SecureStore.getItemAsync(key);
		},
		set: async (key: string, value: string) => {
			if (Platform.OS === 'web') {
				return localStorage.setItem(key, value);
			}
			return await SecureStore.setItemAsync(key, value);
		},
		delete: async (key: string) => {
			if (Platform.OS === 'web') {
				return localStorage.removeItem(key);
			}
			return await SecureStore.deleteItemAsync(key);
		}
	},
	session: {
		get: async (key: string) => {
			if (Platform.OS === 'web') {
				return sessionStorage.getItem(key);
			}
			return await SecureStore.getItemAsync(key);
		},
		set: async (key: string, value: string) => {
			if (Platform.OS === 'web') {
				return sessionStorage.setItem(key, value);
			}
			return await SecureStore.setItemAsync(key, value);
		},
		delete: async (key: string) => {
			if (Platform.OS === 'web') {
				return sessionStorage.removeItem(key);
			}
			return await SecureStore.deleteItemAsync(key);
		}
	}
};
