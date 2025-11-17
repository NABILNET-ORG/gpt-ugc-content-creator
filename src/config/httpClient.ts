import axios, { AxiosInstance } from 'axios';

export const httpClient: AxiosInstance = axios.create({
  timeout: 60000, // 60 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
httpClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      return Promise.reject(error);
    } else if (error.request) {
      // No response received
      return Promise.reject(new Error('No response from external service'));
    } else {
      // Other errors
      return Promise.reject(error);
    }
  }
);
