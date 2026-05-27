import React from 'react';
import { Text, TextStyle } from 'react-native';
import { formatCurrency } from '../utils/formatCurrency';

interface AmountTextProps {
  amount: number;
  type?: 'income' | 'expense' | 'neutral';
  style?: TextStyle | TextStyle[];
  compact?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const AmountText: React.FC<AmountTextProps> = ({
  amount,
  type = 'neutral',
  style,
  compact = false,
  size = 'medium',
}) => {
  // Determine color matching colors from specifications
  let colorClass = 'text-neutral-900';
  if (type === 'income') {
    colorClass = 'text-success';
  } else if (type === 'expense') {
    colorClass = 'text-danger';
  }

  // Typography sizing and line heights
  let sizeClass = 'font-mono-semibold text-base leading-6';
  if (size === 'small') {
    sizeClass = 'font-mono text-[13px] leading-5';
  } else if (size === 'large') {
    sizeClass = 'font-mono-bold text-[28px] leading-9';
  }

  const prefix = type === 'income' ? '↑ ' : type === 'expense' ? '↓ ' : '';
  const formatted = formatCurrency(amount, compact);

  return (
    <Text className={`${sizeClass} ${colorClass}`} style={style}>
      {prefix}
      {formatted}
    </Text>
  );
};
