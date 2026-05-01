import axios from 'axios';

const api = axios.create({
  baseURL: `http://${window.location.hostname}:8000/api/`,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure standard interceptor for handling 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthMe = error.config?.url?.includes('/auth/me/');
    const isPublicPage = ['/', '/payment-success'].includes(window.location.pathname);

    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('befree_auth');
      
      // Do NOT redirect if it's the initial check or if we are on a public page
      if (!isAuthMe && !isPublicPage && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
