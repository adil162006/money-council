import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  RefreshControl, StyleSheet, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransactionStore } from '../../store/transactionStore';
import { TransactionRow } from '../../components/TransactionRow';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateToYMD, getWeekDays, formatDayName, formatDayNum } from '../../utils/dateUtils';
import { addDays, subDays } from 'date-fns';
import AddTransactionSheet from '../../components/AddTransactionSheet';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, selectedDate, setSelectedDate, fetchTransactions, getDailySummary, isLoading } = useTransactionStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [weekBase, setWeekBase] = useState(new Date());
  const fabAnim = useRef(new Animated.Value(1)).current;

  const weekDays = getWeekDays(weekBase);
  const daily = getDailySummary();
  const netPositive = daily.netFlow >= 0;

  useEffect(() => {
    fetchTransactions(selectedDate);
  }, []);

  const onSelectDay = (day: Date) => {
    setSelectedDate(day);
  };

  const goWeekBack = () => setWeekBase(d => subDays(d, 7));
  const goWeekForward = () => setWeekBase(d => addDays(d, 7));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(selectedDate);
    setRefreshing(false);
  };

  const handleFabPress = () => {
    Animated.sequence([
      Animated.timing(fabAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(fabAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => setSheetOpen(true));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFBEA' }}>
      {/* ── Date Strip Header ── */}
      <View style={{ paddingTop: insets.top + 16 }} className="bg-white border-b border-neutral-100 pb-md px-lg">
        <Text className="font-sans-bold text-xl text-neutral-900 mb-md">Transactions</Text>

        {/* Week Navigation Row */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={goWeekBack} className="w-8 h-8 rounded-full bg-neutral-100 items-center justify-center">
            <Ionicons name="chevron-back" size={16} color="#3D3A30" />
          </TouchableOpacity>

          <View className="flex-row flex-1 justify-around mx-xs">
            {weekDays.map((day, idx) => {
              const isSelected = formatDateToYMD(day) === formatDateToYMD(selectedDate);
              const isToday = formatDateToYMD(day) === formatDateToYMD(new Date());
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => onSelectDay(day)}
                  className={`items-center px-[6px] py-[6px] rounded-full min-w-[36px] ${
                    isSelected ? 'bg-primary' : 'bg-transparent'
                  }`}
                >
                  <Text className={`font-sans text-[10px] ${isSelected ? 'text-neutral-900' : 'text-neutral-500'}`}>
                    {formatDayName(day)}
                  </Text>
                  <Text className={`font-sans-bold text-sm mt-[2px] ${
                    isSelected ? 'text-neutral-900' : isToday ? 'text-primary-dark' : 'text-neutral-700'
                  }`}>
                    {formatDayNum(day)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={goWeekForward} className="w-8 h-8 rounded-full bg-neutral-100 items-center justify-center">
            <Ionicons name="chevron-forward" size={16} color="#3D3A30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Daily Summary Bar ── */}
      <View className="flex-row bg-white border-b border-neutral-100 px-lg py-sm">
        <View className="flex-1 items-center">
          <Text className="font-sans text-[10px] text-neutral-500">IN ↑</Text>
          <Text className="font-mono-semibold text-xs text-success">{formatCurrency(daily.totalIncome)}</Text>
        </View>
        <View style={{ width: 1, backgroundColor: '#F5F3EE', marginHorizontal: 8 }} />
        <View className="flex-1 items-center">
          <Text className="font-sans text-[10px] text-neutral-500">OUT ↓</Text>
          <Text className="font-mono-semibold text-xs text-danger">{formatCurrency(daily.totalExpense)}</Text>
        </View>
        <View style={{ width: 1, backgroundColor: '#F5F3EE', marginHorizontal: 8 }} />
        <View className="flex-1 items-center">
          <Text className="font-sans text-[10px] text-neutral-500">NET</Text>
          <Text className={`font-mono-bold text-xs ${netPositive ? 'text-success' : 'text-danger'}`}>
            {netPositive ? '+' : ''}{formatCurrency(daily.netFlow)}
          </Text>
        </View>
      </View>

      {/* ── Transaction List ── */}
      <FlatList
        data={transactions}
        keyExtractor={item => item._id ?? item.id ?? String(Math.random())}
        renderItem={({ item }) => <TransactionRow transaction={item} isFlat />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 100, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5C518" />
        }
        ListEmptyComponent={
          <View className="flex-1">
            <EmptyState
              title="Quiet day!"
              subtitle={`No transactions on ${formatDayName(selectedDate)} ${formatDayNum(selectedDate)}`}
              icon="receipt-outline"
            />
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-[1px] bg-neutral-100" />}
      />

      {/* ── FAB ── */}
      <Animated.View
        style={[styles.fab, { transform: [{ scale: fabAnim }] }, { bottom: 24 + insets.bottom }]}
      >
        <TouchableOpacity activeOpacity={1} onPress={handleFabPress} style={styles.fabBtn}>
          <Ionicons name="add" size={30} color="#1C1A14" />
        </TouchableOpacity>
      </Animated.View>

      <AddTransactionSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
  },
  fabBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C1A14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
});
