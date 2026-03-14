// src/api/auth.js
import client from './client';

export const authAPI = {
  login: (username, password) =>
    client.post('/auth/token/', { username, password }),

  refresh: (refreshToken) =>
    client.post('/auth/token/refresh/', { refresh: refreshToken }),

  getMe: () => client.get('/users/me/'),

  register: (userData) =>
    client.post('/users/', userData),
};
