import axiosInstance from './axiosInstance';

export const registerUser = async (data: any) => {
  const response = await axiosInstance.post('/api/auth/register', data);
  return response.data;
};

export const loginUser = async (data: any) => {
  const response = await axiosInstance.post('/api/auth/login', data);
  return response.data;
};
