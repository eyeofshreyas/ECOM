import axios from 'axios';

// Use the VITE_API_URL environment variable in production, fall back to '/api' locally
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const { token } = JSON.parse(userInfo);
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
