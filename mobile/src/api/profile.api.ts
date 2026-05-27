import axiosInstance from './axiosInstance';

export const completeProfile = async (data: any) => {
  const response = await axiosInstance.post('/api/profile/complete', data);
  return response.data;
};

export const getProfile = async () => {
  const response = await axiosInstance.get('/api/profile');
  return response.data;
};

export const updateProfile = async (data: any) => {
  const response = await axiosInstance.patch('/api/profile', data);
  return response.data;
};
