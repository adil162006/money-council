import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '../../store/profileStore';
import { LiabilityCard } from '../../components/LiabilityCard';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';

type FilterTab = 'All' | 'EMI' | 'Loan' | 'Credit Card' | 'BNPL';
const FILTER_TABS: FilterTab[] = ['All', 'EMI', 'Loan', 'Credit Card', 'BNPL'];

export default function LiabilitiesScreen() {
  const insets = useSafeAreaInsets();
  const { profile, fetchProfile, isLoading } = useProfileStore();
  const analytics = useProfileStore(s => s.getAnalytics)();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [showCompleted, setShowCompleted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const allLiabilities = profile?.liabilities ?? [];
  const active = allLiabilities
    .filter(l => !l.isCompleted && l.remainingBalance > 0)
    .filter(l => activeFilter === 'All' || l.type === activeFilter)
    .sort((a, b) => b.interestRate - a.interestRate);

  const completed = allLiabilities.filter(l => l.isCompleted || l.remainingBalance <= 0);

  const emiRatioColor =
    analytics.emiToIncomeRatio >= 50 ? '#C0392B'
    : analytics.emiToIncomeRatio >= 30 ? '#E67E22'
    : '#2E7D52';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFBEA' }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5C518" />}
    >
      {/* ── Header & Summary Card ── */}
      <View style={{ paddingTop: insets.top + 16 }} className="px-lg">
        <Text className="font-sans-bold text-2xl text-neutral-900 mb-md">Debts & Liabilities</Text>
      </View>

      {/* Yellow gradient summary card */}
      <View className="mx-lg mb-lg" style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Remaining Debt</Text>
        <Text style={styles.heroAmount}>{formatCurrency(analytics.totalRemainingDebt)}</Text>
        <View style={styles.heroDivider} />
        <View className="flex-row justify-between">
          <View className="items-center flex-1">
            <Text style={styles.heroStatLabel}>Monthly EMI</Text>
            <Text style={styles.heroStatValue}>{formatCurrency(analytics.totalMonthlyEMI, true)}</Text>
          </View>
          <View style={styles.heroStatSep} />
          <View className="items-center flex-1">
            <Text style={styles.heroStatLabel}>EMI Ratio</Text>
            <Text style={[styles.heroStatValue, { color: emiRatioColor }]}>
              {analytics.emiToIncomeRatio.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.heroStatSep} />
          <View className="items-center flex-1">
            <Text style={styles.heroStatLabel}>Active Loans</Text>
            <Text style={styles.heroStatValue}>{active.length}</Text>
          </View>
        </View>
      </View>

      {/* ── Debt Avalanche AI Banner ── */}
      {analytics.hasHighInterestDebt && analytics.highestInterestLiability && (
        <View className="mx-lg mb-lg bg-primary-pale border border-primary/30 rounded-md p-md" style={styles.cardShadow}>
          <View className="flex-row items-start">
            <Text className="text-xl mr-sm mt-[2px]">🧠</Text>
            <Text className="font-sans text-xs text-neutral-800 leading-5 flex-1">
              <Text className="font-sans-bold">AI Advice: </Text>Pay off{' '}
              <Text className="font-sans-bold">{analytics.highestInterestLiability.name}</Text> first.
              At {analytics.highestInterestLiability.interestRate}%, it costs you roughly{' '}
              <Text className="font-sans-bold">{formatCurrency(analytics.totalInterestCostEstimate, true)}</Text> in
              total interest.
            </Text>
          </View>
        </View>
      )}

      {/* ── Filter Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8, gap: 8 }}
        className="mb-md"
      >
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveFilter(tab)}
              style={isActive ? styles.filterTabActive : styles.filterTab}
            >
              <Text style={{ fontFamily: isActive ? 'DMSans_600SemiBold' : 'DMSans_400Regular', fontSize: 13, color: isActive ? '#D4A80E' : '#7A7668' }}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Active Liabilities ── */}
      <View className="px-lg">
        {active.length === 0 ? (
          <View className="bg-white rounded-md" style={styles.cardShadow}>
            <EmptyState
              title="Debt-free! 🎉"
              subtitle="No active liabilities under this filter."
              icon="checkmark-circle-outline"
            />
          </View>
        ) : (
          active.map((liability, i) => (
            <LiabilityCard key={liability._id ?? liability.id ?? i} liability={liability} />
          ))
        )}
      </View>

      {/* ── Completed Section ── */}
      {completed.length > 0 && (
        <View className="px-lg mt-md">
          <TouchableOpacity
            onPress={() => setShowCompleted(v => !v)}
            className="flex-row items-center justify-between bg-white rounded-md px-md py-sm border border-neutral-200 mb-sm"
            style={styles.cardShadow}
          >
            <Text className="font-sans-semibold text-sm text-neutral-700">
              Completed ({completed.length})
            </Text>
            <Ionicons
              name={showCompleted ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#7A7668"
            />
          </TouchableOpacity>

          {showCompleted && completed.map((liability, i) => (
            <View key={liability._id ?? i} className="opacity-50">
              <View className="bg-white rounded-md p-md mb-sm border border-neutral-200 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="card-outline" size={18} color="#7A7668" />
                  <Text className="font-sans-semibold text-sm text-neutral-700 ml-sm flex-1" numberOfLines={1}>
                    {liability.name}
                  </Text>
                </View>
                <View className="bg-success-bg px-sm py-[3px] rounded-full ml-sm">
                  <Text className="font-sans-bold text-[10px] text-success">✓ Paid off</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
  heroLabel: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(28,26,20,0.6)', letterSpacing: 0.3 },
  heroAmount: { fontFamily: 'DMMono_700Bold', fontSize: 28, color: '#1C1A14', marginVertical: 6 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.5)', marginVertical: 12 },
  heroStatLabel: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: 'rgba(28,26,20,0.55)' },
  heroStatValue: { fontFamily: 'DMMono_500Medium', fontSize: 13, color: '#1C1A14', marginTop: 2 },
  heroStatSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.5)', marginVertical: 2 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#F5F3EE', borderWidth: 1, borderColor: '#F5F3EE',
  },
  filterTabActive: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#FFFBEA', borderWidth: 1.5, borderColor: '#F5C518',
    shadowColor: '#F5C518', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  cardShadow: {
    shadowColor: '#1C1A14', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
});
