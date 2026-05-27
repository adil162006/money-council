import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AmountText } from './AmountText';
import { Transaction } from '../store/transactionStore';
import { formatReadableDate } from '../utils/dateUtils';

interface TransactionRowProps {
  transaction: Transaction;
  isFlat?: boolean;
}

const categoryStyles: Record<string, { bg: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Salary: { bg: 'bg-[#E8F5EE]', color: '#2E7D52', icon: 'cash-outline' },
  Freelance: { bg: 'bg-[#EAF4FB]', color: '#2980B9', icon: 'laptop-outline' },
  Food: { bg: 'bg-[#FEF3E7]', color: '#E67E22', icon: 'fast-food-outline' },
  Transport: { bg: 'bg-[#EAF4FB]', color: '#2980B9', icon: 'car-outline' },
  Rent: { bg: 'bg-[#E0F7FA]', color: '#00838F', icon: 'home-outline' },
  Shopping: { bg: 'bg-[#F5EAFB]', color: '#9B59B6', icon: 'cart-outline' },
  Entertainment: { bg: 'bg-[#FDECEA]', color: '#C0392B', icon: 'film-outline' },
  Utilities: { bg: 'bg-[#FFFBEA]', color: '#D4A80E', icon: 'flash-outline' },
  Education: { bg: 'bg-[#E1F5FE]', color: '#0288D1', icon: 'book-outline' },
  Healthcare: { bg: 'bg-[#FFEBEE]', color: '#D32F2F', icon: 'heart-outline' },
  'EMI / Loan': { bg: 'bg-[#FEF3E7]', color: '#E67E22', icon: 'card-outline' },
  Investment: { bg: 'bg-[#E8EAF6]', color: '#3F51B5', icon: 'trending-up-outline' },
  Other: { bg: 'bg-[#F5F3EE]', color: '#7A7668', icon: 'receipt-outline' },
};

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  isFlat = false,
}) => {
  const catStyle = categoryStyles[transaction.category] || categoryStyles.Other;

  return (
    <View 
      className={`flex-row items-center justify-between py-md px-md ${
        isFlat ? 'border-b border-neutral-100' : 'bg-white rounded-md mb-sm shadow-sm'
      }`}
    >
      {/* Left Icon Ring */}
      <View className="flex-row items-center flex-1 mr-sm">
        <View className={`w-10 h-10 rounded-full ${catStyle.bg} items-center justify-center mr-md`}>
          <Ionicons name={catStyle.icon} size={20} color={catStyle.color} />
        </View>

        {/* Center details */}
        <View className="flex-1">
          <Text className="font-sans-semibold text-neutral-900 text-sm" numberOfLines={1}>
            {transaction.title}
          </Text>
          
          <View className="flex-row items-center mt-[2px] flex-wrap">
            <Text className="font-sans text-xs text-neutral-500 mr-sm">
              {transaction.category}
            </Text>
            {transaction.isAutomated && (
              <View className="bg-primary/20 px-sm py-[1px] rounded-full mr-sm">
                <Text className="font-sans-bold text-[9px] text-primary-dark">AUTO</Text>
              </View>
            )}
            <Text className="font-sans text-xs text-neutral-500">
              {formatReadableDate(transaction.date)}
            </Text>
          </View>
        </View>
      </View>

      {/* Right Amount */}
      <View className="items-end">
        <AmountText 
          amount={transaction.amount} 
          type={transaction.type} 
          size="small"
        />
      </View>
    </View>
  );
};
