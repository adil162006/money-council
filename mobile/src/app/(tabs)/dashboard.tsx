import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, RefreshControl, StyleSheet, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { useTransactionStore } from '../../store/transactionStore';
import { TransactionRow } from '../../components/TransactionRow';
import { GoalCard } from '../../components/GoalCard';
import { ProgressBar } from '../../components/ProgressBar';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatReadableDate } from '../../utils/dateUtils';
import AddTransactionSheet from '../../components/AddTransactionSheet';

const { width } = Dimensions.get('window');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useAuthStore(s => s.user);
  const { profile, fetchProfile } = useProfileStore();
  const { transactions, fetchTransactions, getDailySummary, getMonthSummary } = useTransactionStore();
  const analytics = useProfileStore(s => s.getAnalytics)();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Count-up animation for balance
  const balanceAnim = useRef(new Animated.Value(0)).current;
  const [displayBalance, setDisplayBalance] = useState(0);

  useEffect(() => {
    fetchProfile();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (profile?.currentBankBalance) {
      Animated.timing(balanceAnim, {
        toValue: profile.currentBankBalance,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }
  }, [profile?.currentBankBalance]);

  useEffect(() => {
    const id = balanceAnim.addListener(({ value }) => setDisplayBalance(Math.round(value)));
    return () => balanceAnim.removeListener(id);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchTransactions()]);
    setRefreshing(false);
  };

  const daily = getDailySummary();
  const monthly = getMonthSummary();
  const todayLabel = formatReadableDate(new Date());
  const goals = profile?.financialGoals?.slice(0, 3) ?? [];
  const todayTxns = transactions.slice(0, 5);

  const emiRatioColor =
    analytics.emiToIncomeRatio >= 50 ? '#C0392B'
    : analytics.emiToIncomeRatio >= 30 ? '#F5C518'
    : '#2E7D52';

  return (
    <>
      <ScrollView
        style={{ backgroundColor: '#FFFBEA' }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5C518" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{ paddingTop: insets.top + 16 }} className="px-lg pb-sm">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-semibold text-xl text-neutral-900">
              {getGreeting()}, {user?.name?.split(' ')[0] ?? 'there'} 👋
            </Text>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-white items-center justify-center border border-neutral-300">
              <Ionicons name="notifications-outline" size={20} color="#3D3A30" />
            </TouchableOpacity>
          </View>
          <Text className="font-sans text-xs text-neutral-500 mt-[2px]">{todayLabel}</Text>
        </View>

        {/* ── Hero Balance Card ── */}
        <View className="mx-lg mb-md">
          <View style={styles.heroCard}>
            <View className="flex-row items-center justify-between mb-xs">
              <Text style={styles.heroLabel}>Current Balance</Text>
              <TouchableOpacity onPress={() => setBalanceVisible(v => !v)}>
                <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroAmount}>
              {balanceVisible ? formatCurrency(displayBalance) : '₹ ••••••'}
            </Text>

            <View style={styles.heroDivider} />

            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text style={styles.heroStatLabel}>Income ↑</Text>
                <Text style={styles.heroStatValue}>{formatCurrency(monthly.totalIncome, true)}</Text>
              </View>
              <View style={styles.heroStatSep} />
              <View className="items-center flex-1">
                <Text style={styles.heroStatLabel}>Expenses ↓</Text>
                <Text style={styles.heroStatValue}>{formatCurrency(monthly.totalExpense, true)}</Text>
              </View>
              <View style={styles.heroStatSep} />
              <View className="items-center flex-1">
                <Text style={styles.heroStatLabel}>Disposable</Text>
                <Text style={styles.heroStatValue}>{formatCurrency(analytics.disposableIncome, true)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View className="mx-lg mb-lg">
          <View className="flex-row justify-between">
            {[
              { icon: 'add-circle-outline', label: 'Add', onPress: () => setSheetOpen(true) },
              { icon: 'bar-chart-outline', label: 'Report', onPress: () => router.push('/(tabs)/transactions') },
              { icon: 'card-outline', label: 'Debts', onPress: () => router.push('/(tabs)/liabilities') },
              { icon: 'flag-outline', label: 'Goals', onPress: () => router.push('/(tabs)/goals') },
            ].map(({ icon, label, onPress }) => (
              <TouchableOpacity key={label} activeOpacity={0.75} onPress={onPress} className="items-center" style={{ width: (width - 48) / 4 }}>
                <View style={styles.quickBtn}>
                  <Ionicons name={icon as any} size={24} color="#D4A80E" />
                </View>
                <Text className="font-sans text-xs text-neutral-700 mt-xs">{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── AI Advisory Banner ── */}
        <View className="mx-lg mb-lg bg-white rounded-md overflow-hidden" style={styles.cardShadow}>
          <View className="flex-row items-center p-md" style={{ borderLeftWidth: 3, borderLeftColor: '#F5C518' }}>
            <Text className="text-2xl mr-md">🧠</Text>
            <View className="flex-1">
              <Text className="font-sans-semibold text-base text-neutral-900">AI Council Report</Text>
              <Text className="font-sans text-xs text-neutral-500 mt-[2px]">Your next advisory report is ready on the 1st.</Text>
            </View>
            <TouchableOpacity>
              <Text className="font-sans-bold text-xs text-primary-dark">View →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Debt Danger Alert (conditional) ── */}
        {analytics.hasHighInterestDebt && analytics.highestInterestLiability && (
          <View className="mx-lg mb-lg bg-danger-bg border border-danger/30 rounded-md p-md" style={styles.cardShadow}>
            <View className="flex-row items-start">
              <Text className="text-xl mr-md mt-[2px]">⚠️</Text>
              <View className="flex-1">
                <Text className="font-sans-bold text-base text-danger mb-xs">High-interest debt detected</Text>
                <Text className="font-sans text-xs text-neutral-700 leading-5">
                  Your <Text className="font-sans-bold">{analytics.highestInterestLiability.name}</Text> is
                  charging {analytics.highestInterestLiability.interestRate}% interest. Pay this off first.
                </Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/liabilities')} className="mt-sm">
                  <Text className="font-sans-bold text-xs text-danger">View Debt Plan →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── Today's Transactions ── */}
        <View className="mx-lg mb-lg">
          <View className="flex-row items-center justify-between mb-sm">
            <Text className="font-sans-bold text-base text-neutral-900">Today</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text className="font-sans-semibold text-xs text-primary-dark">See all →</Text>
            </TouchableOpacity>
          </View>

          {todayTxns.length === 0 ? (
            <View className="bg-white rounded-md py-lg" style={styles.cardShadow}>
              <EmptyState
                title="No transactions today"
                subtitle="Tap + Add to log your first transaction"
                icon="receipt-outline"
              />
            </View>
          ) : (
            <View className="bg-white rounded-md overflow-hidden" style={styles.cardShadow}>
              {todayTxns.map(txn => (
                <TransactionRow key={txn._id ?? txn.id} transaction={txn} isFlat />
              ))}
            </View>
          )}
        </View>

        {/* ── Monthly Snapshot ── */}
        <View className="mx-lg mb-lg">
          <Text className="font-sans-bold text-base text-neutral-900 mb-sm">This month</Text>
          <View className="flex-row gap-md mb-md">
            {/* Income card */}
            <View className="flex-1 bg-white rounded-md p-md" style={styles.cardShadow}>
              <View className="w-9 h-9 rounded-full bg-success-bg items-center justify-center mb-sm">
                <Ionicons name="arrow-up" size={18} color="#2E7D52" />
              </View>
              <Text className="font-sans text-xs text-neutral-500">Total Income</Text>
              <Text className="font-mono-bold text-base text-success mt-[2px]">
                {formatCurrency(monthly.totalIncome)}
              </Text>
            </View>
            {/* Expense card */}
            <View className="flex-1 bg-white rounded-md p-md" style={styles.cardShadow}>
              <View className="w-9 h-9 rounded-full bg-danger-bg items-center justify-center mb-sm">
                <Ionicons name="arrow-down" size={18} color="#C0392B" />
              </View>
              <Text className="font-sans text-xs text-neutral-500">Total Expenses</Text>
              <Text className="font-mono-bold text-base text-danger mt-[2px]">
                {formatCurrency(monthly.totalExpense)}
              </Text>
            </View>
          </View>

          {/* EMI Burden Bar */}
          <View className="bg-white rounded-md p-md" style={styles.cardShadow}>
            <View className="flex-row items-center justify-between mb-sm">
              <Text className="font-sans-semibold text-sm text-neutral-900">EMI Burden</Text>
              <Text className="font-mono-bold text-sm" style={{ color: emiRatioColor }}>
                {analytics.emiToIncomeRatio.toFixed(1)}%
              </Text>
            </View>
            <ProgressBar value={analytics.emiToIncomeRatio} color={emiRatioColor} height={8} />
            <View className="flex-row justify-between mt-xs">
              <Text className="font-sans text-[10px] text-neutral-500">0%</Text>
              <Text className="font-sans text-[10px] text-neutral-500">Healthy &lt;30%</Text>
              <Text className="font-sans text-[10px] text-neutral-500">100%</Text>
            </View>
          </View>
        </View>

        {/* ── Goals Snapshot ── */}
        {goals.length > 0 && (
          <View className="mb-lg">
            <View className="flex-row items-center justify-between mb-sm px-lg">
              <Text className="font-sans-bold text-base text-neutral-900">Goals</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/goals')}>
                <Text className="font-sans-semibold text-xs text-primary-dark">See all →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
              {goals.map((g, i) => (
                <GoalCard key={g._id ?? i} goal={g} isExpanded={false} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Add Transaction Bottom Sheet */}
      <AddTransactionSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#F5C518',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#1C1A14',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
  },
  heroAmount: {
    fontFamily: 'DMMono_700Bold',
    fontSize: 32,
    color: '#1C1A14',
    marginVertical: 8,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginVertical: 12,
  },
  heroStatLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: 'rgba(28,26,20,0.65)',
  },
  heroStatValue: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 13,
    color: '#1C1A14',
    marginTop: 2,
  },
  heroStatSep: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginVertical: 2,
  },
  quickBtn: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C1A14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardShadow: {
    shadowColor: '#1C1A14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
});
