import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, Animated, Dimensions, KeyboardAvoidingView,
  Platform, ActivityIndicator, RefreshControl, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore, Goal } from '../../store/profileStore';
import { GoalCard } from '../../components/GoalCard';
import { EmptyState } from '../../components/EmptyState';

const { height: SCREEN_H } = Dimensions.get('window');

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, fetchProfile, addGoalLocally, isLoading } = useProfileStore();
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Add Goal Sheet state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalProgress, setGoalProgress] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  const goals = profile?.financialGoals ?? [];
  const activeGoals = goals.filter(g => g.currentProgress < g.targetAmount);

  useEffect(() => { fetchProfile(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const openSheet = () => {
    setGoalTitle(''); setGoalTarget(''); setGoalProgress(''); setGoalDeadline('');
    setSheetOpen(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 14 }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 260, useNativeDriver: true }).start(() => setSheetOpen(false));
  };

  const handleSaveGoal = async () => {
    if (!goalTitle.trim() || !goalTarget || Number(goalTarget) <= 0) return;
    setSaving(true);
    const newGoal: Goal = {
      title: goalTitle.trim(),
      targetAmount: Number(goalTarget),
      currentProgress: Number(goalProgress || 0),
      deadline: goalDeadline.trim() || undefined,
    };
    await addGoalLocally(newGoal);
    setSaving(false);
    closeSheet();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFBEA' }}>
      {/* ── Header ── */}
      <View style={{ paddingTop: insets.top + 16, paddingBottom: 16 }} className="px-lg flex-row items-center justify-between bg-white border-b border-neutral-100">
        <View>
          <Text className="font-sans-bold text-2xl text-neutral-900">Your Goals</Text>
          <Text className="font-sans text-xs text-neutral-500 mt-[2px]">
            {activeGoals.length} active {activeGoals.length === 1 ? 'goal' : 'goals'}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={openSheet}
          className="flex-row items-center bg-primary px-md py-sm rounded-full border border-primary-dark"
          style={styles.addBtn}
        >
          <Ionicons name="add" size={16} color="#1C1A14" />
          <Text className="font-sans-bold text-xs text-neutral-900 ml-[4px]">Add Goal</Text>
        </TouchableOpacity>
      </View>

      {/* ── Goals List ── */}
      <FlatList
        data={goals}
        keyExtractor={(item, i) => item._id ?? item.id ?? String(i)}
        renderItem={({ item }) => <GoalCard goal={item} isExpanded={true} />}
        contentContainerStyle={{ padding: 24, paddingBottom: 100, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5C518" />
        }
        ListEmptyComponent={
          <View style={{ flex: 1 }}>
            <EmptyState
              title="Dream big."
              subtitle="Add your first financial goal and start tracking your progress."
              icon="flag-outline"
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openSheet}
              className="mx-auto mt-lg bg-primary px-xl py-md rounded-full border border-primary-dark"
            >
              <Text className="font-sans-bold text-sm text-neutral-900">+ Add your first goal</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ── Add Goal Bottom Sheet ── */}
      <Modal visible={sheetOpen} transparent animationType="none" onRequestClose={closeSheet}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeSheet}>
          <View style={{ flex: 1, backgroundColor: 'rgba(28,26,20,0.45)' }} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        >
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            {/* Handle */}
            <View className="items-center pt-sm pb-md">
              <View className="w-10 h-1.5 rounded-full bg-neutral-300" />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <View className="px-lg pb-lg">
                <Text className="font-sans-bold text-xl text-neutral-900 mb-lg">New Goal</Text>

                {/* Title */}
                <View className="mb-md">
                  <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">Goal Name *</Text>
                  <TextInput
                    className="bg-neutral-100 border border-neutral-300 rounded-md px-md h-12 font-sans text-neutral-900 text-sm"
                    placeholder="e.g. Trip to Europe"
                    value={goalTitle}
                    onChangeText={setGoalTitle}
                  />
                </View>

                {/* Target Amount */}
                <View className="mb-md">
                  <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">Target Amount (₹) *</Text>
                  <View className="flex-row items-center bg-neutral-100 border border-neutral-300 rounded-md px-md h-12">
                    <Text className="font-sans-semibold text-base text-neutral-900 mr-xs">₹</Text>
                    <TextInput
                      className="flex-1 font-mono text-neutral-900 text-sm"
                      placeholder="0"
                      keyboardType="numeric"
                      value={goalTarget}
                      onChangeText={setGoalTarget}
                    />
                  </View>
                </View>

                {/* Starting Progress */}
                <View className="mb-md">
                  <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">Already Saved (₹)</Text>
                  <View className="flex-row items-center bg-neutral-100 border border-neutral-300 rounded-md px-md h-12">
                    <Text className="font-sans-semibold text-base text-neutral-900 mr-xs">₹</Text>
                    <TextInput
                      className="flex-1 font-mono text-neutral-900 text-sm"
                      placeholder="0"
                      keyboardType="numeric"
                      value={goalProgress}
                      onChangeText={setGoalProgress}
                    />
                  </View>
                </View>

                {/* Deadline */}
                <View className="mb-xl">
                  <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">Deadline (YYYY-MM-DD)</Text>
                  <View className="flex-row items-center bg-neutral-100 border border-neutral-300 rounded-md px-md h-12">
                    <Ionicons name="calendar-outline" size={18} color="#7A7668" />
                    <TextInput
                      className="flex-1 font-mono text-neutral-900 text-sm ml-sm"
                      placeholder="2026-12-31"
                      value={goalDeadline}
                      onChangeText={setGoalDeadline}
                    />
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSaveGoal}
                  disabled={saving || !goalTitle.trim() || !goalTarget || Number(goalTarget) <= 0}
                  className={`h-14 rounded-md items-center justify-center border border-primary-dark ${
                    !goalTitle.trim() || !goalTarget || Number(goalTarget) <= 0 ? 'bg-primary/40' : 'bg-primary'
                  }`}
                >
                  {saving ? (
                    <ActivityIndicator color="#1C1A14" />
                  ) : (
                    <Text className="font-sans-bold text-neutral-900 text-base">Save Goal</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.88,
    shadowColor: '#1C1A14',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },
});
