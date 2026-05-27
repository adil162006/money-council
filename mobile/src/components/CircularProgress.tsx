import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  value: number; // 0 to 100
  color?: string;
  fontSize?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 60,
  strokeWidth = 5,
  value,
  color = '#F5C518',
  fontSize = 12,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const clampedValue = Math.min(100, Math.max(0, value));
    Animated.timing(animatedValue, {
      toValue: clampedValue,
      duration: 800,
      useNativeDriver: false, // SVG property interpolations can't run on native driver in all OS versions
    }).start();
  }, [value]);

  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value: currentVal }) => {
      setPercent(Math.round(currentVal));
    });
    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center relative">
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F5F3EE"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animating Foreground Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute items-center justify-center">
        <Text style={{ fontSize }} className="font-mono-bold text-neutral-900">
          {percent}%
        </Text>
      </View>
    </View>
  );
};
