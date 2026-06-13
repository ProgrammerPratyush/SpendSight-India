import axios from 'axios';
import { auth } from './firebase';

const apiClient = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 8000, // 8 seconds — if no response by then, fail fast
    headers: { 'Content-Type': 'application/json' },
});

// console.log(
//     "API URL:",
//     process.env.EXPO_PUBLIC_API_URL
// );
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
// apiClient.interceptors.request.use(
//     async (config) => {

//         const user = auth.currentUser;

//         console.log(
//             "Current User:",
//             user?.uid
//         );

//         if (user) {

//             const token =
//                 await user.getIdToken();

//             console.log(
//                 "Token Found:",
//                 !!token
//             );

//             config.headers.Authorization =
//                 `Bearer ${token}`;
//         }

//         return config;
//     }
// );

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