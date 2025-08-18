import api from './api';

const userService = {
  getProfile: async () => {
    const res = await api.get('/auth/check-auth');
    return res.data.user;
  },
  updateProfile: async (formData) => {
    const res = await api.put('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  updatePassword: async (passwordData) => {
    const res = await api.put('/auth/password', passwordData);
    return res.data;
  }
};

export default userService; 