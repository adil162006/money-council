import axiosInstance from './axiosInstance';

export const getTransactionsByDate = async (date: string) => {
  const response = await axiosInstance.get(`/api/transactions?date=${date}`);
  return response.data;
};

export const addTransaction = async (data: any) => {
  const response = await axiosInstance.post('/api/transactions', data);
  return response.data;
};
