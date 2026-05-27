import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore(state => state.login);
  const isLoading = useAuthStore(state => state.isLoading);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      valid = false;
    }

    return valid;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    const success = await login(email.trim(), password);
    if (success) {
      // Check onboarding state from store and route
      const isCompleted = useAuthStore.getState().isProfileCompleted;
      if (isCompleted) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/onboarding/complete-profile');
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-[#FFFBEA]"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="px-lg py-xl"
      >
        {/* Back Button */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full items-center justify-center bg-white/80 border border-neutral-300 self-start mt-md"
        >
          <Ionicons name="arrow-back" size={20} color="#1C1A14" />
        </TouchableOpacity>

        {/* Title */}
        <View className="my-lg">
          <Text className="font-sans-bold text-3xl text-neutral-900">
            Welcome back
          </Text>
          <Text className="font-sans text-neutral-500 text-sm mt-xs">
            Sign in to your account
          </Text>
        </View>

        {/* Form Fields */}
        <View className="flex-1 justify-start gap-md">
          {/* Email field */}
          <View>
            <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">
              Email Address
            </Text>
            <View 
              className={`flex-row items-center bg-white px-md py-sm rounded-md border-1.5 ${
                emailError ? 'border-danger' : isEmailFocused ? 'border-primary' : 'border-neutral-300'
              }`}
            >
              <TextInput
                className="flex-1 font-sans text-neutral-900 text-sm h-11"
                placeholder="email@example.com"
                placeholderTextColor="#7A7668"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>
            {emailError ? (
              <Text className="font-sans text-[11px] text-danger mt-[6px] ml-sm">
                {emailError}
              </Text>
            ) : null}
          </View>

          {/* Password field */}
          <View>
            <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">
              Password
            </Text>
            <View 
              className={`flex-row items-center bg-white px-md py-sm rounded-md border-1.5 ${
                passwordError ? 'border-danger' : isPasswordFocused ? 'border-primary' : 'border-neutral-300'
              }`}
            >
              <TextInput
                className="flex-1 font-sans text-neutral-900 text-sm h-11"
                placeholder="Enter password"
                placeholderTextColor="#7A7668"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-xs">
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#7A7668" 
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text className="font-sans text-[11px] text-danger mt-[6px] ml-sm">
                {passwordError}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Bottom CTA Actions */}
        <View className="mt-lg">
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleSignIn}
            disabled={isLoading}
            className="w-full bg-primary h-12 rounded-md items-center justify-center border border-primary-dark"
          >
            {isLoading ? (
              <ActivityIndicator color="#1C1A14" />
            ) : (
              <Text className="font-sans-bold text-neutral-900 text-sm">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/auth/register')} 
            className="mt-md py-sm items-center"
          >
            <Text className="font-sans text-xs text-neutral-700">
              Don't have an account? <Text className="font-sans-bold text-primary-dark">Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
