import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  Animated, Dimensions, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactionStore } from '../store/transactionStore';
import { useProfileStore } from '../store/profileStore';
import { formatDateToYMD } from '../utils/dateUtils';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
}

type TxType = 'expense' | 'income';

const EXPENSE_CATS = ['Food', 'Transport', 'Rent', 'Shopping', 'Entertainment', 'Utilities', 'Education', 'Healthcare', 'EMI / Loan', 'Investment', 'Other'];
const INCOME_CATS  = ['Salary', 'Freelance', 'Other'];

export default function AddTransactionSheet({ visible, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  const addNewTransaction = useTransactionStore(s => s.addNewTransaction);
  const isLoading = useTransactionStore(s => s.isLoading);
  const profile = useProfileStore(s => s.profile);

  const [txType, setTxType] = useState<TxType>('expense');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(formatDateToYMD(new Date()));
  const [liabilityId, setLiabilityId] = useState('');
  const [amountFocused, setAmountFocused] = useState(false);

  const cats = txType === 'income' ? INCOME_CATS : EXPENSE_CATS;

  // Reset state when re-opened
  useEffect(() => {
    if (visible) {
      setTxType('expense'); setCategory('Food'); setAmount('');
      setTitle(''); setNotes(''); setLiabilityId('');
      setDate(formatDateToYMD(new Date()));
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 14 }).start();
    }
  }, [visible]);

  // Reset category when type changes
  useEffect(() => {
    setCategory(txType === 'income' ? 'Salary' : 'Food');
    setLiabilityId('');
  }, [txType]);

  const close = () => {
    Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 280, useNativeDriver: true }).start(() => onClose());
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;
    const finalTitle = title.trim() || category;
    const success = await addNewTransaction({
      title: finalTitle,
      amount: Number(amount),
      type: txType,
      category,
      date,
      isAutomated: false,
      notes: notes.trim() || undefined,
      liabilityId: liabilityId || undefined,
    });
    if (success) close();
  };

  const activeLiabilities = profile?.liabilities?.filter(l => !l.isCompleted) ?? [];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      {/* Backdrop */}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close}>
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

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="px-lg pb-lg">
              {/* Title */}
              <Text className="font-sans-bold text-xl text-neutral-900 mb-md">Add Transaction</Text>

              {/* Type Toggle */}
              <View className="flex-row bg-neutral-100 rounded-full p-[3px] mb-lg h-12 items-center">
                {(['expense', 'income'] as TxType[]).map(t => {
                  const active = txType === t;
                  const bg = active ? (t === 'expense' ? 'bg-danger-bg' : 'bg-success-bg') : 'bg-transparent';
                  const textCls = active ? (t === 'expense' ? 'text-danger font-sans-bold' : 'text-success font-sans-bold') : 'text-neutral-500 font-sans';
                  return (
                    <TouchableOpacity key={t} activeOpacity={0.75} onPress={() => setTxType(t)}
                      className={`flex-1 items-center justify-center h-full rounded-full ${bg}`}>
                      <Text className={`text-sm ${textCls} capitalize`}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Category Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-lg -mx-lg px-lg">
                {cats.map(c => {
                  const active = category === c;
                  return (
                    <TouchableOpacity key={c} onPress={() => setCategory(c)}
                      className={`px-md py-xs rounded-full mr-sm border ${active ? 'bg-primary border-primary-dark' : 'bg-neutral-100 border-neutral-100'}`}>
                      <Text className={`font-sans-semibold text-xs ${active ? 'text-neutral-900' : 'text-neutral-500'}`}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Big Amount Input */}
              <View className="items-center mb-lg">
                <View className="flex-row items-center border-b-2 pb-xs" style={{ borderBottomColor: amountFocused ? '#F5C518' : '#C8C4B8', minWidth: 160 }}>
                  <Text className="font-sans-bold text-3xl text-primary mr-xs">₹</Text>
                  <TextInput
                    style={{ fontFamily: 'DMMono_700Bold', fontSize: 36, color: '#1C1A14', minWidth: 80, textAlign: 'center' }}
                    placeholder="0"
                    placeholderTextColor="#C8C4B8"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    onFocus={() => setAmountFocused(true)}
                    onBlur={() => setAmountFocused(false)}
                  />
                </View>
              </View>

              {/* Title */}
              <View className="mb-md">
                <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">Description</Text>
                <TextInput
                  className="bg-neutral-100 rounded-md px-md h-12 font-sans text-neutral-900 text-sm border border-neutral-300"
                  placeholder="What was this for?"
                  placeholderTextColor="#7A7668"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Date */}
              <View className="mb-md">
                <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">Date (YYYY-MM-DD)</Text>
                <View className="flex-row items-center bg-neutral-100 rounded-md px-md h-12 border border-neutral-300">
                  <Ionicons name="calendar-outline" size={18} color="#7A7668" />
                  <TextInput
                    className="flex-1 font-mono text-neutral-900 text-sm ml-sm"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#7A7668"
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
              </View>

              {/* Notes */}
              <View className="mb-lg">
                <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">Notes (optional)</Text>
                <TextInput
                  className="bg-neutral-100 rounded-md px-md py-sm font-sans text-neutral-900 text-sm border border-neutral-300"
                  placeholder="Add a note..."
                  placeholderTextColor="#7A7668"
                  multiline
                  numberOfLines={2}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* EMI / Loan Picker (conditional) */}
              {category === 'EMI / Loan' && activeLiabilities.length > 0 && (
                <View className="mb-lg bg-primary-pale border border-primary/20 rounded-md p-md">
                  <Text className="font-sans-bold text-xs text-primary-dark mb-sm">Link to existing liability</Text>
                  {activeLiabilities.map(l => {
                    const lid = l._id ?? l.id ?? '';
                    const selected = liabilityId === lid;
                    return (
                      <TouchableOpacity key={lid} onPress={() => setLiabilityId(selected ? '' : lid)}
                        className={`flex-row items-center p-sm rounded-md mb-xs border ${selected ? 'border-primary bg-white' : 'border-neutral-300 bg-white/60'}`}>
                        <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected ? '#F5C518' : '#C8C4B8'} />
                        <View className="ml-sm flex-1">
                          <Text className="font-sans-semibold text-xs text-neutral-900">{l.name}</Text>
                          <Text className="font-mono text-[10px] text-neutral-500">
                            Balance: ₹{l.remainingBalance.toLocaleString('en-IN')} · Due day {l.emiDueDate}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSubmit}
                disabled={isLoading || !amount || Number(amount) <= 0}
                className={`h-14 rounded-md items-center justify-center border border-primary-dark ${
                  !amount || Number(amount) <= 0 ? 'bg-primary/40' : 'bg-primary'
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#1C1A14" />
                ) : (
                  <Text className="font-sans-bold text-neutral-900 text-base">Add Transaction</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.92,
    shadowColor: '#1C1A14',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },
});
