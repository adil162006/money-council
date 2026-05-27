import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const bounceValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle floating illustration animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: -15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Content fade in
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View className="flex-1 bg-primary-pale">
      <StatusBar style="dark" />
      
      {/* Top 55% - Illustration Area */}
      <View className="h-[55%] items-center justify-center relative overflow-hidden">
        {/* Decorative background blobs */}
        <View className="absolute w-[350px] h-[350px] rounded-full bg-primary-light/40 -top-16 -left-16" />
        <View className="absolute w-[200px] h-[200px] rounded-full bg-[#FFF3C3]/50 -bottom-8 -right-8" />
        
        {/* Floating Coin & Card Art */}
        <Animated.View 
          style={{ transform: [{ translateY: bounceValue }] }} 
          className="items-center justify-center"
        >
          {/* Main geometric card shape representing app interface */}
          <View 
            style={styles.heroCard}
            className="w-48 h-64 bg-white rounded-lg p-lg justify-between border border-neutral-300"
          >
            {/* Top row of card */}
            <View className="flex-row justify-between items-center">
              <View className="w-8 h-8 rounded-full bg-primary-pale items-center justify-center">
                <Ionicons name="sparkles" size={16} color="#D4A80E" />
              </View>
              <View className="w-12 h-3 bg-neutral-100 rounded-full" />
            </View>
            
            {/* Middle part - AI chat balloon */}
            <View className="bg-primary-light/30 rounded-md p-sm my-md border-l-2 border-primary">
              <View className="w-8 h-2 bg-neutral-700 rounded-full mb-1" />
              <View className="w-20 h-1.5 bg-neutral-500 rounded-full mb-1" />
              <View className="w-14 h-1.5 bg-neutral-500 rounded-full" />
            </View>
            
            {/* Bottom row - stats outline */}
            <View className="flex-row justify-between items-end">
              <View className="w-8 h-4 bg-success/20 rounded-sm" />
              <View className="w-10 h-8 bg-primary/20 rounded-sm" />
              <View className="w-8 h-6 bg-danger/20 rounded-sm" />
            </View>
          </View>

          {/* Overlapping Floating Gold Coins */}
          <View className="absolute -bottom-4 -left-6 w-16 h-16 rounded-full bg-primary items-center justify-center border-4 border-white shadow-md">
            <Text className="font-mono-bold text-xl text-neutral-900">₹</Text>
          </View>
          <View className="absolute top-8 -right-8 w-12 h-12 rounded-full bg-primary-dark items-center justify-center border-2 border-white shadow-sm">
            <Ionicons name="trending-up" size={20} color="#1C1A14" />
          </View>
        </Animated.View>
      </View>

      {/* Bottom 45% - Typography & Actions */}
      <Animated.View 
        style={{ opacity: fadeValue }} 
        className="h-[45%] bg-white rounded-t-lg p-lg justify-between border-t border-neutral-100 shadow-modal"
      >
        <View className="mt-xs">
          <Text className="font-sans-bold text-4xl text-neutral-900 leading-[44px]">
            Your money,{"\n"}clearly.
          </Text>
          <Text className="font-sans text-neutral-500 text-base mt-sm leading-6">
            Smart budgeting powered by AI advisors.
          </Text>
        </View>

        {/* Buttons */}
        <View className="mb-md">
          {/* Get Started CTA */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/auth/register')}
            className="w-full bg-primary py-md rounded-md items-center justify-center border border-primary-dark mb-sm"
          >
            <Text className="font-sans-bold text-neutral-900 text-base">
              Get Started
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity 
            activeOpacity={0.6}
            onPress={() => router.push('/auth/login')}
            className="w-full py-sm items-center justify-center"
          >
            <Text className="font-sans-semibold text-neutral-700 text-sm">
              I already have an account
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    shadowColor: '#1C1A14',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 6,
  }
});
