import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../store/profileStore';
import { CircularProgress } from './CircularProgress';
import { ProgressBar } from './ProgressBar';
import { formatCurrency } from '../utils/formatCurrency';

interface GoalCardProps {
  goal: Goal;
  isExpanded?: boolean;
}

const getGoalIcon = (title: string): keyof typeof Ionicons.glyphMap => {
  const t = title.toLowerCase();
  if (t.includes('emergency') || t.includes('safety') || t.includes('buffer')) return 'shield-checkmark-outline';
  if (t.includes('trip') || t.includes('travel') || t.includes('vacation') || t.includes('europe') || t.includes('ladakh')) return 'airplane-outline';
  if (t.includes('macbook') || t.includes('laptop') || t.includes('phone') || t.includes('ipad') || t.includes('gadget')) return 'laptop-outline';
  if (t.includes('car') || t.includes('bike') || t.includes('vehicle')) return 'car-outline';
  if (t.includes('home') || t.includes('house') || t.includes('rent')) return 'home-outline';
  return 'flag-outline';
};

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  isExpanded = false,
}) => {
  const percent = Math.min(100, Math.max(0, Math.round((goal.currentProgress / goal.targetAmount) * 100)));
  const icon = getGoalIcon(goal.title);
  const remaining = Math.max(0, goal.targetAmount - goal.currentProgress);

  if (isExpanded) {
    return (
      <View className="bg-white rounded-md p-md mb-sm shadow-sm">
        {/* Top Header */}
        <View className="flex-row items-start justify-between mb-sm" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View className="flex-row items-center flex-1 mr-sm">
            <View className="w-10 h-10 rounded-full bg-primary-pale items-center justify-center mr-md">
              <Ionicons name={icon} size={20} color="#D4A80E" />
            </View>
            <View className="flex-1">
              <Text className="font-sans-semibold text-base text-neutral-900" numberOfLines={1}>
                {goal.title}
              </Text>
              {goal.deadline && (
                <Text className="font-sans text-xs text-neutral-500 mt-[2px]">
                  Due {goal.deadline}
                </Text>
              )}
            </View>
          </View>
          
          <CircularProgress size={70} strokeWidth={6} value={percent} fontSize={13} />
        </View>

        {/* Amount Info */}
        <View className="flex-row justify-between items-center mb-sm">
          <View>
            <Text className="font-sans text-xs text-neutral-500">Saved</Text>
            <Text className="font-mono-semibold text-sm text-success">{formatCurrency(goal.currentProgress)}</Text>
          </View>
          <View className="items-end">
            <Text className="font-sans text-xs text-neutral-500">Target</Text>
            <Text className="font-mono-semibold text-sm text-neutral-900">{formatCurrency(goal.targetAmount)}</Text>
          </View>
        </View>

        <ProgressBar value={percent} color="#F5C518" height={6} />
        
        {/* Status / Remaining footer */}
        <View className="flex-row justify-between items-center mt-sm pt-xs border-t border-neutral-100">
          <Text className="font-sans text-xs text-neutral-500">
            {remaining > 0 ? `${formatCurrency(remaining)} to go` : 'Goal achieved! 🎉'}
          </Text>
          <View className={`px-sm py-[2px] rounded-full ${percent >= 50 ? 'bg-success-bg' : 'bg-warning-bg'}`}>
            <Text className={`font-sans-semibold text-[10px] ${percent >= 50 ? 'text-success' : 'text-warning'}`}>
              {percent >= 75 ? 'On Track' : percent >= 40 ? 'Progressing' : 'Needs attention'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Dashboard horizontal list card (180px wide)
  return (
    <View style={{ width: 160 }} className="bg-white rounded-md p-md mr-md shadow-sm items-center justify-between">
      {/* Icon and Title */}
      <View className="items-center mb-sm w-full">
        <View className="w-9 h-9 rounded-full bg-primary-pale items-center justify-center mb-xs">
          <Ionicons name={icon} size={18} color="#D4A80E" />
        </View>
        <Text className="font-sans-semibold text-xs text-neutral-900 text-center w-full" numberOfLines={1}>
          {goal.title}
        </Text>
      </View>

      {/* Progress Circle */}
      <View className="my-sm">
        <CircularProgress size={56} strokeWidth={5} value={percent} fontSize={11} />
      </View>

      {/* Progress Value text */}
      <View className="w-full items-center mt-xs">
        <Text className="font-sans text-[10px] text-neutral-500 text-center" numberOfLines={1}>
          {formatCurrency(goal.currentProgress, true)} of {formatCurrency(goal.targetAmount, true)}
        </Text>
      </View>
    </View>
  );
};
