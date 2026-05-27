import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  icon = 'document-text-outline',
}) => {
  return (
    <View className="flex-1 items-center justify-center py-xl px-lg bg-transparent">
      {/* Dynamic Geometric Art Illustration in Yellow */}
      <View className="relative w-28 h-28 items-center justify-center mb-md">
        {/* Background yellow tinted circles representing coins/vault */}
        <View className="absolute w-28 h-28 rounded-full bg-primary-pale border border-primary-light/50 opacity-40 scale-75 animate-pulse" />
        <View className="absolute w-20 h-20 rounded-full bg-primary-light/40 border border-primary-light" />
        <View className="w-14 h-14 rounded-full bg-primary-light/60 items-center justify-center shadow-sm">
          <Ionicons name={icon} size={28} color="#D4A80E" />
        </View>
        
        {/* Sparkles */}
        <View className="absolute top-2 right-4">
          <Ionicons name="sparkles" size={16} color="#F5C518" />
        </View>
        <View className="absolute bottom-4 left-3">
          <Ionicons name="sparkles" size={12} color="#F5C518" />
        </View>
      </View>

      <Text className="font-sans-semibold text-lg text-neutral-900 text-center mb-xs">
        {title}
      </Text>
      <Text className="font-sans text-sm text-neutral-500 text-center max-w-[260px] leading-5">
        {subtitle}
      </Text>
    </View>
  );
};
