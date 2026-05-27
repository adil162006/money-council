import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Liability } from '../store/profileStore';
import { ProgressBar } from './ProgressBar';
import { formatCurrency } from '../utils/formatCurrency';

interface LiabilityCardProps {
  liability: Liability;
  onPayPress?: () => void;
}

const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  EMI: 'card-outline',
  Loan: 'cash-outline',
  'Credit Card': 'wallet-outline',
  BNPL: 'cart-outline',
  Other: 'help-circle-outline',
};

export const LiabilityCard: React.FC<LiabilityCardProps> = ({
  liability,
}) => {
  const isHighInterest = liability.interestRate >= 20;
  const amountPaid = liability.totalPrincipal - liability.remainingBalance;
  const progressPercent = Math.min(100, Math.max(0, (amountPaid / liability.totalPrincipal) * 100));
  const monthsRemaining = Math.max(0, liability.totalDuration - liability.monthsAlreadyPaid);
  const icon = typeIcons[liability.type] || typeIcons.Other;

  return (
    <View 
      className={`bg-white rounded-md p-md mb-sm shadow-sm overflow-hidden border-l-4 ${
        isHighInterest ? 'border-l-danger' : 'border-l-primary'
      }`}
    >
      {/* Header Row */}
      <View className="flex-row items-center justify-between mb-sm">
        <View className="flex-row items-center flex-1 mr-sm">
          <Ionicons name={icon} size={20} color={isHighInterest ? '#C0392B' : '#7A7668'} />
          <Text className="font-sans-semibold text-base text-neutral-900 ml-sm flex-1" numberOfLines={1}>
            {liability.name}
          </Text>
        </View>
        
        {/* Interest Badge */}
        <View className={`px-sm py-[3px] rounded-sm ${
          isHighInterest ? 'bg-danger-bg' : 'bg-neutral-100'
        }`}>
          <Text className={`font-sans-semibold text-xs ${
            isHighInterest ? 'text-danger' : 'text-neutral-700'
          }`}>
            {liability.interestRate}%{isHighInterest && ' ⚠️'}
          </Text>
        </View>
      </View>

      {/* Progress Section */}
      <View className="my-sm">
        <ProgressBar value={progressPercent} color={isHighInterest ? '#C0392B' : '#F5C518'} />
        <View className="flex-row justify-between items-center mt-xs">
          <Text className="font-sans text-xs text-neutral-500">
            {formatCurrency(amountPaid)} paid
          </Text>
          <Text className="font-sans text-xs text-neutral-500">
            of {formatCurrency(liability.totalPrincipal)}
          </Text>
        </View>
      </View>

      {/* Footer Row */}
      <View className="flex-row items-center justify-between border-t border-neutral-100 pt-sm mt-xs">
        <View>
          <Text className="font-mono-semibold text-xs text-primary-dark">
            {formatCurrency(liability.monthlyEMI)}/mo
          </Text>
          <Text className="font-sans text-[10px] text-neutral-500">
            Monthly EMI
          </Text>
        </View>

        <View className="items-center">
          <Text className="font-sans-semibold text-xs text-neutral-700">
            {monthsRemaining} months
          </Text>
          <Text className="font-sans text-[10px] text-neutral-500">
            Remaining
          </Text>
        </View>

        <View className="items-end">
          <Text className="font-sans-semibold text-xs text-neutral-700">
            Day {liability.emiDueDate}
          </Text>
          <Text className="font-sans text-[10px] text-neutral-500">
            Due Date
          </Text>
        </View>
      </View>

      {/* Danger Banner for Credit Card/High Interest */}
      {isHighInterest && (
        <View className="bg-danger-bg border border-danger/20 rounded-sm p-sm mt-sm flex-row items-center">
          <Ionicons name="alert-circle" size={16} color="#C0392B" className="mr-sm" />
          <Text className="font-sans text-xs text-danger flex-1 ml-xs leading-4">
            High interest drains cash. Prioritize this in your Debt Avalanche.
          </Text>
        </View>
      )}
    </View>
  );
};
