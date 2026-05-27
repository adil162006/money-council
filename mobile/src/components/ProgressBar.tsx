import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string; // Hex color
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = '#F5C518',
  height = 8,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Keep value bounded between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, value));
    Animated.timing(animatedWidth, {
      toValue: clampedValue,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // width animation doesn't support native driver
    }).start();
  }, [value]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View 
      style={{ height, backgroundColor: '#F5F3EE' }} 
      className="w-full rounded-full overflow-hidden"
    >
      <Animated.View
        style={{
          height: '100%',
          backgroundColor: color,
          width: widthInterpolation,
          borderRadius: 999,
        }}
      />
    </View>
  );
};
