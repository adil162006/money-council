import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Modal, Animated, Dimensions,
  KeyboardAvoidingView, Platform, TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { formatCurrency } from '../../utils/formatCurrency';

const { height: SCREEN_H } = Dimensions.get('window');

function getInitials(name?: string | null) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function ordinalSuffix(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const isDemoMode = useAuthStore(s => s.isDemoMode);
  const { profile, fetchProfile, patchProfile } = useProfileStore();
  const analytics = useProfileStore(s => s.getAnalytics)();

  // Edit sheet state
  const [editField, setEditField] = useState<'riskTolerance' | 'salaryDay' | null>(null);
  const [editValue, setEditValue] = useState('');
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/welcome');
          },
        },
      ]
    );
  };

  const openEditSheet = (field: 'riskTolerance' | 'salaryDay') => {
    setEditField(field);
    setEditValue(
      field === 'riskTolerance'
        ? profile?.riskTolerance ?? 'Medium'
        : String(profile?.salaryDay ?? 1)
    );
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 14 }).start();
  };

  const closeEditSheet = () => {
    Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 260, useNativeDriver: true }).start(() => setEditField(null));
  };

  const handleSaveEdit = async () => {
    if (!editField) return;
    setSaving(true);
    await patchProfile({ [editField]: editField === 'salaryDay' ? Number(editValue) : editValue });
    setSaving(false);
    closeEditSheet();
  };

  // Summary stat cards data
  const statCards = [
    { label: 'Monthly Income', icon: 'cash-outline', value: formatCurrency(profile?.monthlyIncome ?? 0, true), color: '#2E7D52', bg: '#E8F5EE' },
    { label: 'Bank Balance', icon: 'wallet-outline', value: formatCurrency(profile?.currentBankBalance ?? 0, true), color: '#2980B9', bg: '#EAF4FB' },
    { label: 'Emergency Fund', icon: 'shield-checkmark-outline', value: formatCurrency(profile?.emergencySavings ?? 0, true), color: '#E67E22', bg: '#FEF3E7' },
    { label: 'Disposable', icon: 'trending-up-outline', value: formatCurrency(analytics.disposableIncome, true), color: '#D4A80E', bg: '#FDF3C0' },
  ];

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FFFBEA' }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header Banner ── */}
        <View style={[styles.banner, { paddingTop: insets.top + 24 }]}>
          {/* Avatar */}
          <View className="items-center mb-sm">
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
          </View>
          <Text style={styles.nameText}>{user?.name ?? 'Your Name'}</Text>
          <Text style={styles.emailText}>{user?.email ?? 'email@example.com'}</Text>

          <View className="flex-row items-center gap-sm mt-sm justify-center">
            {profile?.persona && (
              <View style={styles.personaBadge}>
                <Text style={styles.personaBadgeText}>{profile.persona}</Text>
              </View>
            )}
            {isDemoMode && (
              <View style={[styles.personaBadge, { backgroundColor: 'rgba(240,180,0,0.25)', borderColor: 'rgba(240,180,0,0.4)' }]}>
                <Text style={[styles.personaBadgeText, { color: '#F5C518' }]}>Demo Mode</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Financial Overview 2×2 Grid ── */}
        <View className="px-lg mt-lg">
          <Text className="font-sans-bold text-base text-neutral-900 mb-sm">Financial Overview</Text>
          <View className="flex-row flex-wrap gap-md">
            {statCards.map((card) => (
              <View
                key={card.label}
                style={[styles.statCard, styles.cardShadow]}
              >
                <View style={[styles.statIconRing, { backgroundColor: card.bg }]}>
                  <Ionicons name={card.icon as any} size={18} color={card.color} />
                </View>
                <Text className="font-sans text-xs text-neutral-500 mt-sm mb-[2px]">{card.label}</Text>
                <Text style={{ fontFamily: 'DMMono_600SemiBold', fontSize: 16, color: '#1C1A14' }}>
                  {card.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Profile Settings ── */}
        <View className="px-lg mt-xl">
          <Text className="font-sans-bold text-base text-neutral-900 mb-sm">Profile Settings</Text>
          <View className="bg-white rounded-md overflow-hidden" style={styles.cardShadow}>
            {/* Risk Tolerance */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openEditSheet('riskTolerance')}
              className="flex-row items-center justify-between px-md py-md border-b border-neutral-100"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-warning-bg items-center justify-center mr-md">
                  <Ionicons name="speedometer-outline" size={18} color="#E67E22" />
                </View>
                <Text className="font-sans-semibold text-sm text-neutral-900">Risk Tolerance</Text>
              </View>
              <View className="flex-row items-center gap-sm">
                <Text className="font-sans text-xs text-neutral-500">{profile?.riskTolerance ?? '—'}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C8C4B8" />
              </View>
            </TouchableOpacity>

            {/* Salary Day */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openEditSheet('salaryDay')}
              className="flex-row items-center justify-between px-md py-md border-b border-neutral-100"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-info-bg items-center justify-center mr-md">
                  <Ionicons name="calendar-outline" size={18} color="#2980B9" />
                </View>
                <Text className="font-sans-semibold text-sm text-neutral-900">Salary Day</Text>
              </View>
              <View className="flex-row items-center gap-sm">
                <Text className="font-sans text-xs text-neutral-500">
                  {profile?.salaryDay ? ordinalSuffix(profile.salaryDay) + ' of month' : '—'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#C8C4B8" />
              </View>
            </TouchableOpacity>

            {/* Notification Prefs (future) */}
            <View className="flex-row items-center justify-between px-md py-md opacity-40">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-neutral-100 items-center justify-center mr-md">
                  <Ionicons name="notifications-outline" size={18} color="#7A7668" />
                </View>
                <Text className="font-sans-semibold text-sm text-neutral-700">Notifications</Text>
              </View>
              <View className="flex-row items-center gap-sm">
                <Text className="font-sans text-xs text-neutral-500">Coming soon</Text>
                <Ionicons name="chevron-forward" size={16} color="#C8C4B8" />
              </View>
            </View>
          </View>
        </View>

        {/* ── Account / Danger Zone ── */}
        <View className="px-lg mt-xl mb-lg">
          <Text className="font-sans-bold text-base text-neutral-900 mb-sm">Account</Text>
          <View className="bg-white rounded-md overflow-hidden" style={styles.cardShadow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSignOut}
              className="flex-row items-center px-md py-md"
            >
              <View className="w-9 h-9 rounded-full bg-danger-bg items-center justify-center mr-md">
                <Ionicons name="log-out-outline" size={18} color="#C0392B" />
              </View>
              <Text className="font-sans-bold text-sm text-danger">Sign Out</Text>
            </TouchableOpacity>
          </View>

          <Text className="font-sans text-[10px] text-neutral-400 text-center mt-lg">
            Money Council • v1.0.0 {isDemoMode ? '(Demo Mode)' : ''}
          </Text>
        </View>
      </ScrollView>

      {/* ── Edit Field Bottom Sheet ── */}
      <Modal visible={!!editField} transparent animationType="none" onRequestClose={closeEditSheet}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeEditSheet}>
          <View style={{ flex: 1, backgroundColor: 'rgba(28,26,20,0.45)' }} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        >
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View className="items-center pt-sm pb-md">
              <View className="w-10 h-1.5 rounded-full bg-neutral-300" />
            </View>

            <View className="px-lg pb-lg">
              <Text className="font-sans-bold text-xl text-neutral-900 mb-lg">
                Edit {editField === 'riskTolerance' ? 'Risk Tolerance' : 'Salary Day'}
              </Text>

              {editField === 'riskTolerance' && (
                <View className="flex-row gap-md mb-xl">
                  {(['Low', 'Medium', 'High'] as const).map(opt => {
                    const selected = editValue === opt;
                    const colors: Record<string, { bg: string; border: string; text: string }> = {
                      Low:    { bg: '#E8F5EE', border: '#2E7D52', text: '#2E7D52' },
                      Medium: { bg: '#FDF3C0', border: '#F5C518', text: '#D4A80E' },
                      High:   { bg: '#FDECEA', border: '#C0392B', text: '#C0392B' },
                    };
                    const c = colors[opt];
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => setEditValue(opt)}
                        style={{
                          flex: 1,
                          paddingVertical: 14,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: selected ? c.border : '#C8C4B8',
                          backgroundColor: selected ? c.bg : '#FFFFFF',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: selected ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 14, color: selected ? c.text : '#7A7668' }}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {editField === 'salaryDay' && (
                <View className="mb-xl">
                  <Text className="font-sans-semibold text-xs text-neutral-700 mb-sm">Day of month (1–31)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                      const isSelected = String(d) === editValue;
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => setEditValue(String(d))}
                          style={{
                            width: 40, height: 40, borderRadius: 20, marginRight: 8,
                            backgroundColor: isSelected ? '#F5C518' : '#F5F3EE',
                            borderWidth: 1,
                            borderColor: isSelected ? '#D4A80E' : '#C8C4B8',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontFamily: isSelected ? 'DMSans_700Bold' : 'DMSans_400Regular', fontSize: 13, color: '#1C1A14' }}>
                            {d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveEdit}
                disabled={saving}
                className="h-14 rounded-md items-center justify-center bg-primary border border-primary-dark"
              >
                {saving
                  ? <Ionicons name="sync-outline" size={22} color="#1C1A14" />
                  : <Text className="font-sans-bold text-neutral-900 text-base">Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F5C518',
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1C1A14',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#1C1A14', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  avatarText: { fontFamily: 'DMSans_700Bold', fontSize: 26, color: '#F5C518' },
  nameText: { fontFamily: 'DMSans_700Bold', fontSize: 22, color: '#1C1A14', marginTop: 8 },
  emailText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(28,26,20,0.6)', marginTop: 2 },
  personaBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  personaBadgeText: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: '#1C1A14' },
  statCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
  },
  statIconRing: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  cardShadow: {
    shadowColor: '#1C1A14', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.75,
    shadowColor: '#1C1A14', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 16,
  },
});
