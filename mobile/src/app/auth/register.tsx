import React, { useState, useEffect } from 'react';
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

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore(state => state.register);
  const isLoading = useAuthStore(state => state.isLoading);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  const [pwStrength, setPwStrength] = useState(0); // 0 to 4

  // Realtime password strength analysis
  useEffect(() => {
    if (!password) {
      setPwStrength(0);
      return;
    }
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    setPwStrength(score || 1); // Minimum score of 1 if password exists
  }, [password]);

  const validate = () => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');

    if (!fullName) {
      setNameError('Name is required');
      valid = false;
    }

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

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    const success = await register(fullName.trim(), email.trim(), password);
    if (success) {
      router.replace('/onboarding/complete-profile');
    }
  };

  // Build password strength bar styles based on score
  const getStrengthBarColor = (index: number) => {
    if (pwStrength <= index) return 'bg-neutral-300';
    switch (pwStrength) {
      case 1: return 'bg-[#FFFBEA] border border-primary-light'; // Pale
      case 2: return 'bg-[#FDF3C0]'; // Light
      case 3: return 'bg-[#F5C518]'; // Primary Yellow
      case 4: return 'bg-[#D4A80E]'; // Primary Yellow Dark
      default: return 'bg-neutral-300';
    }
  };

  const getStrengthLabel = () => {
    switch (pwStrength) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
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
            Create account
          </Text>
          <Text className="font-sans text-neutral-500 text-sm mt-xs">
            Start managing your funds dynamically
          </Text>
        </View>

        {/* Form Fields */}
        <View className="flex-1 justify-start gap-md mb-lg">
          {/* Full Name */}
          <View>
            <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">
              Full Name
            </Text>
            <View 
              className={`flex-row items-center bg-white px-md py-sm rounded-md border-1.5 ${
                nameError ? 'border-danger' : isNameFocused ? 'border-primary' : 'border-neutral-300'
              }`}
            >
              <TextInput
                className="flex-1 font-sans text-neutral-900 text-sm h-11"
                placeholder="John Doe"
                placeholderTextColor="#7A7668"
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
              />
            </View>
            {nameError ? (
              <Text className="font-sans text-[11px] text-danger mt-[6px] ml-sm">
                {nameError}
              </Text>
            ) : null}
          </View>

          {/* Email */}
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

          {/* Password */}
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
                placeholder="At least 8 characters"
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
            
            {/* Strength Bar */}
            {password.length > 0 && (
              <View className="mt-sm">
                <View className="flex-row justify-between items-center mb-xs">
                  <Text className="font-sans text-[10px] text-neutral-500">
                    Password Strength
                  </Text>
                  <Text className="font-sans-bold text-[10px] text-primary-dark">
                    {getStrengthLabel()}
                  </Text>
                </View>
                <View className="flex-row gap-xs">
                  <View className={`flex-1 h-[6px] rounded-full ${getStrengthBarColor(0)}`} />
                  <View className={`flex-1 h-[6px] rounded-full ${getStrengthBarColor(1)}`} />
                  <View className={`flex-1 h-[6px] rounded-full ${getStrengthBarColor(2)}`} />
                  <View className={`flex-1 h-[6px] rounded-full ${getStrengthBarColor(3)}`} />
                </View>
              </View>
            )}
            
            {passwordError ? (
              <Text className="font-sans text-[11px] text-danger mt-[6px] ml-sm">
                {passwordError}
              </Text>
            ) : null}
          </View>

          {/* Confirm Password */}
          <View>
            <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">
              Confirm Password
            </Text>
            <View 
              className={`flex-row items-center bg-white px-md py-sm rounded-md border-1.5 ${
                confirmError ? 'border-danger' : isConfirmFocused ? 'border-primary' : 'border-neutral-300'
              }`}
            >
              <TextInput
                className="flex-1 font-sans text-neutral-900 text-sm h-11"
                placeholder="Confirm password"
                placeholderTextColor="#7A7668"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setIsConfirmFocused(true)}
                onBlur={() => setIsConfirmFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="px-xs">
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#7A7668" 
                />
              </TouchableOpacity>
            </View>
            {confirmError ? (
              <Text className="font-sans text-[11px] text-danger mt-[6px] ml-sm">
                {confirmError}
              </Text>
            ) : null}
          </View>
        </View>

        {/* CTA Buttons */}
        <View className="mt-auto">
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={isLoading}
            className="w-full bg-primary h-12 rounded-md items-center justify-center border border-primary-dark"
          >
            {isLoading ? (
              <ActivityIndicator color="#1C1A14" />
            ) : (
              <Text className="font-sans-bold text-neutral-900 text-sm">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/auth/login')} 
            className="mt-md py-sm items-center"
          >
            <Text className="font-sans text-xs text-neutral-700">
              Already have an account? <Text className="font-sans-bold text-primary-dark">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
