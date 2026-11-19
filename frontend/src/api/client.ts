import axios from 'axios';

export const api = axios.create({
  baseURL: '/knowledgehub/api',
  withCredentials: true,
});

export const baseApi = axios.create({
  baseURL: '/knowledgehub',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('unauthorized'));
    }
    return Promise.reject(error);
  }
);
