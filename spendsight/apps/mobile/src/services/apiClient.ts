import axios from 'axios';
import { auth } from './firebase';

const apiClient = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 8000, // 8 seconds — if no response by then, fail fast
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (err) {
        // silent
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            error.message = 'Request timed out. Check your connection.';
        }
        if (!error.response) {
            error.message = 'Cannot reach server. Check your WiFi and API.';
        }
        return Promise.reject(error);
    }
);

export default apiClient;