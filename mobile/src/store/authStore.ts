import { create } from 'zustand';
import { secureStorage } from '../utils/secureStore';
import { loginUser, registerUser } from '../api/auth.api';
import Toast from 'react-native-toast-message';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isProfileCompleted: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  initialized: boolean;
  
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setProfileCompleted: (completed: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isProfileCompleted: false,
  isLoading: false,
  isDemoMode: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    
    const token = await secureStorage.getItem('jwt_token');
    const userStr = await secureStorage.getItem('user_data');
    const completedStr = await secureStorage.getItem('is_profile_completed');
    const isDemoStr = await secureStorage.getItem('is_demo_mode');
    
    set({
      token,
      user: userStr ? JSON.parse(userStr) : null,
      isProfileCompleted: completedStr === 'true',
      isDemoMode: isDemoStr === 'true',
      initialized: true
    });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      // Try calling the actual API
      const data = await loginUser({ email, password });
      
      const token = data.token;
      const user = data.user;
      const isProfileCompleted = data.user.isProfileCompleted ?? false;
      
      await secureStorage.setItem('jwt_token', token);
      await secureStorage.setItem('user_data', JSON.stringify(user));
      await secureStorage.setItem('is_profile_completed', String(isProfileCompleted));
      await secureStorage.setItem('is_demo_mode', 'false');
      
      set({ token, user, isProfileCompleted, isDemoMode: false, isLoading: false });
      
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: `Logged in as ${user.name}`,
      });
      return true;
    } catch (error: any) {
      console.log('Login API failed or network error:', error.message);
      
      // Check if it's a validation/credentials error vs a network error
      const isNetworkError = error.message?.includes('Network Error') || error.code === 'ERR_NETWORK';
      
      if (isNetworkError) {
        // Fall back to Demo Mode for development
        const mockUser = { id: 'mock-user-123', name: 'Demo User', email };
        const mockToken = 'mock-jwt-token-xyz';
        const isProfileCompleted = true; // Auto-complete for mock user experience
        
        await secureStorage.setItem('jwt_token', mockToken);
        await secureStorage.setItem('user_data', JSON.stringify(mockUser));
        await secureStorage.setItem('is_profile_completed', String(isProfileCompleted));
        await secureStorage.setItem('is_demo_mode', 'true');
        
        set({
          token: mockToken,
          user: mockUser,
          isProfileCompleted,
          isDemoMode: true,
          isLoading: false,
        });
        
        Toast.show({
          type: 'info',
          text1: 'Demo Mode Activated',
          text2: 'Backend offline. Signed in with demo profile.',
        });
        return true;
      }
      
      set({ isLoading: false });
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.response?.data?.message || 'Invalid credentials or connection issue.',
      });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const data = await registerUser({ name, email, password });
      
      const token = data.token;
      const user = data.user;
      const isProfileCompleted = false;
      
      await secureStorage.setItem('jwt_token', token);
      await secureStorage.setItem('user_data', JSON.stringify(user));
      await secureStorage.setItem('is_profile_completed', 'false');
      await secureStorage.setItem('is_demo_mode', 'false');
      
      set({ token, user, isProfileCompleted, isDemoMode: false, isLoading: false });
      
      Toast.show({
        type: 'success',
        text1: 'Account Created',
        text2: 'Please complete your financial profile.',
      });
      return true;
    } catch (error: any) {
      console.log('Register API failed or network error:', error.message);
      const isNetworkError = error.message?.includes('Network Error') || error.code === 'ERR_NETWORK';
      
      if (isNetworkError) {
        // Fall back to Demo Mode
        const mockUser = { id: 'mock-user-123', name, email };
        const mockToken = 'mock-jwt-token-xyz';
        const isProfileCompleted = false;
        
        await secureStorage.setItem('jwt_token', mockToken);
        await secureStorage.setItem('user_data', JSON.stringify(mockUser));
        await secureStorage.setItem('is_profile_completed', 'false');
        await secureStorage.setItem('is_demo_mode', 'true');
        
        set({
          token: mockToken,
          user: mockUser,
          isProfileCompleted,
          isDemoMode: true,
          isLoading: false,
        });
        
        Toast.show({
          type: 'info',
          text1: 'Demo Registration',
          text2: 'Backend offline. Registered in Demo Mode.',
        });
        return true;
      }
      
      set({ isLoading: false });
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.response?.data?.message || 'Could not register user.',
      });
      return false;
    }
  },

  logout: async () => {
    await secureStorage.removeItem('jwt_token');
    await secureStorage.removeItem('user_data');
    await secureStorage.removeItem('is_profile_completed');
    await secureStorage.removeItem('is_demo_mode');
    
    set({
      token: null,
      user: null,
      isProfileCompleted: false,
      isDemoMode: false,
      isLoading: false
    });
    
    Toast.show({
      type: 'success',
      text1: 'Signed Out',
      text2: 'Goodbye!',
    });
  },

  setProfileCompleted: async (completed) => {
    await secureStorage.setItem('is_profile_completed', String(completed));
    set({ isProfileCompleted: completed });
  }
}));
