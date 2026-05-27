import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Switch, 
  ActivityIndicator,
  Dimensions,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore, Goal, Liability } from '../../store/profileStore';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

type Persona = 'Student' | 'Salaried' | 'Freelancer';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const saveCompleteProfile = useProfileStore(state => state.saveCompleteProfile);
  const isLoading = useProfileStore(state => state.isLoading);
  
  const [step, setStep] = useState(1);

  // STEP 1 DATA
  const [persona, setPersona] = useState<Persona>('Salaried');

  // STEP 2 DATA
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [currentBankBalance, setCurrentBankBalance] = useState('');
  const [salaryDay, setSalaryDay] = useState(1);
  const [riskTolerance, setRiskTolerance] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // STEP 3 DATA
  const [emergencySavings, setEmergencySavings] = useState('');

  // STEP 4 DATA
  const [goals, setGoals] = useState<Goal[]>([]);

  // STEP 5 DATA
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [activeLiabilityIndex, setActiveLiabilityIndex] = useState<number | null>(null);

  // Field focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Dynamic calculations
  const calculatedFundSuggest = Number(monthlyIncome || 0) * 3;

  // Step Navigations & Valdations
  const validateStep = () => {
    if (step === 2) {
      if (!monthlyIncome || Number(monthlyIncome) <= 0) {
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a valid monthly income' });
        return false;
      }
      if (!currentBankBalance || Number(currentBankBalance) < 0) {
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a valid bank balance' });
        return false;
      }
    }
    if (step === 3) {
      if (emergencySavings === '') {
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter an emergency savings amount (can be 0)' });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSkip = () => {
    setStep(prev => prev + 1);
  };

  const handleFinalSubmit = async () => {
    const payload = {
      persona,
      monthlyIncome: Number(monthlyIncome),
      currentBankBalance: Number(currentBankBalance),
      riskTolerance,
      salaryDay: persona === 'Salaried' ? salaryDay : 1,
      emergencySavings: Number(emergencySavings || 0),
      financialGoals: goals,
      liabilities: liabilities
    };

    const success = await saveCompleteProfile(payload);
    if (success) {
      router.replace('/(tabs)/dashboard');
    }
  };

  // --- Dynamic Goals Methods ---
  const addGoal = () => {
    setGoals(prev => [...prev, { title: '', targetAmount: 0, currentProgress: 0, deadline: '' }]);
  };

  const removeGoal = (index: number) => {
    setGoals(prev => prev.filter((_, i) => i !== index));
  };

  const updateGoalField = (index: number, key: keyof Goal, val: any) => {
    setGoals(prev => prev.map((g, i) => {
      if (i === index) {
        return { ...g, [key]: val };
      }
      return g;
    }));
  };

  // --- Dynamic Liabilities Methods ---
  const addLiability = () => {
    const newLiability: Liability = {
      name: '',
      type: 'EMI',
      totalPrincipal: 0,
      remainingBalance: 0,
      interestRate: 0,
      monthlyEMI: 0,
      totalDuration: 12,
      emiDueDate: 1,
      monthsAlreadyPaid: 0,
      autoDebit: false
    };
    setLiabilities(prev => [...prev, newLiability]);
    setActiveLiabilityIndex(liabilities.length); // Expand the newly added one
  };

  const removeLiability = (index: number) => {
    setLiabilities(prev => prev.filter((_, i) => i !== index));
    if (activeLiabilityIndex === index) {
      setActiveLiabilityIndex(null);
    }
  };

  const updateLiabilityField = (index: number, key: keyof Liability, val: any) => {
    setLiabilities(prev => prev.map((l, i) => {
      if (i === index) {
        return { ...l, [key]: val };
      }
      return l;
    }));
  };

  // --- RENDERING HELPERS ---
  
  // Custom styled Segmented Control for Risk Tolerance
  const renderRiskSegmentControl = () => {
    const options: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
    return (
      <View className="flex-row bg-neutral-100 p-[3px] rounded-md h-12 items-center">
        {options.map((opt) => {
          const isSelected = riskTolerance === opt;
          let selectStyle = 'bg-transparent';
          let textStyle = 'text-neutral-500 font-sans';
          
          if (isSelected) {
            if (opt === 'Low') {
              selectStyle = 'bg-success-bg border border-success/30';
              textStyle = 'text-success font-sans-bold';
            } else if (opt === 'Medium') {
              selectStyle = 'bg-primary-light border border-primary/30';
              textStyle = 'text-primary-dark font-sans-bold';
            } else {
              selectStyle = 'bg-danger-bg border border-danger/30';
              textStyle = 'text-danger font-sans-bold';
            }
          }

          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.7}
              onPress={() => setRiskTolerance(opt)}
              className={`flex-1 items-center justify-center h-full rounded-md ${selectStyle}`}
            >
              <Text className={textStyle}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-white"
    >
      {/* Top Header & Wizard Progress */}
      <View className="pt-xl pb-md px-lg bg-primary-pale border-b border-neutral-100 flex-row items-center justify-between">
        <View className="flex-1 mr-md">
          <Text className="font-sans-bold text-lg text-neutral-900">
            Setup Advisor
          </Text>
          {/* Progress bar fill */}
          <View className="w-full bg-neutral-300 h-2 rounded-full overflow-hidden mt-xs">
            <View 
              style={{ width: `${(step / 5) * 100}%` }}
              className="bg-primary h-full rounded-full"
            />
          </View>
        </View>
        <Text className="font-mono-bold text-sm text-neutral-500 mt-[14px]">
          {step}/5
        </Text>
      </View>

      <ScrollView 
        keyboardShouldPersistTaps="handled" 
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-lg"
      >
        {/* STEP 1: Tell us about yourself */}
        {step === 1 && (
          <View className="flex-1 justify-center py-lg">
            <Text className="font-sans-bold text-2xl text-neutral-900 mb-xs">
              Tell us about yourself
            </Text>
            <Text className="font-sans text-sm text-neutral-500 mb-lg">
              What best describes you?
            </Text>

            {/* Persona radio cards */}
            <View className="gap-md">
              {(['🎓 Student', '💼 Salaried', '💻 Freelancer'] as const).map((label, idx) => {
                const itemPersona = (['Student', 'Salaried', 'Freelancer'] as const)[idx];
                const isSelected = persona === itemPersona;
                
                return (
                  <TouchableOpacity
                    key={itemPersona}
                    activeOpacity={0.85}
                    onPress={() => setPersona(itemPersona)}
                    className={`p-lg rounded-md border-2 flex-row items-center justify-between ${
                      isSelected 
                        ? 'border-primary bg-primary-light/40' 
                        : 'border-neutral-300 bg-white'
                    }`}
                  >
                    <Text className={`font-sans-semibold text-lg ${
                      isSelected ? 'text-primary-dark' : 'text-neutral-700'
                    }`}>
                      {label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#D4A80E" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 2: Your finances */}
        {step === 2 && (
          <View className="flex-1 py-lg gap-lg">
            <View>
              <Text className="font-sans-bold text-2xl text-neutral-900 mb-xs">
                Your finances
              </Text>
              <Text className="font-sans text-sm text-neutral-500">
                Set up your financial baseline
              </Text>
            </View>

            {/* Monthly Income Input */}
            <View>
              <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">
                Monthly Income (₹)
              </Text>
              <View 
                className={`flex-row items-center bg-[#F5F3EE]/50 px-md rounded-md border-1.5 ${
                  focusedField === 'income' ? 'border-primary bg-white' : 'border-neutral-300'
                }`}
              >
                <Text className="font-sans-semibold text-base text-neutral-900 mr-xs">₹</Text>
                <TextInput
                  className="flex-1 font-mono text-neutral-900 text-sm h-12"
                  placeholder="0"
                  keyboardType="numeric"
                  value={monthlyIncome}
                  onChangeText={setMonthlyIncome}
                  onFocus={() => setFocusedField('income')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Current Balance Input */}
            <View>
              <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">
                Current Bank Balance (₹)
              </Text>
              <View 
                className={`flex-row items-center bg-[#F5F3EE]/50 px-md rounded-md border-1.5 ${
                  focusedField === 'balance' ? 'border-primary bg-white' : 'border-neutral-300'
                }`}
              >
                <Text className="font-sans-semibold text-base text-neutral-900 mr-xs">₹</Text>
                <TextInput
                  className="flex-1 font-mono text-neutral-900 text-sm h-12"
                  placeholder="0"
                  keyboardType="numeric"
                  value={currentBankBalance}
                  onChangeText={setCurrentBankBalance}
                  onFocus={() => setFocusedField('balance')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Salary Day Picker (Only Salaried) */}
            {persona === 'Salaried' && (
              <View>
                <Text className="font-sans-semibold text-xs text-neutral-700 mb-sm">
                  Which day does your salary arrive?
                </Text>
                
                {/* Horizontal Scroll Selector */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  className="py-xs flex-row"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const isSelected = salaryDay === day;
                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => setSalaryDay(day)}
                        className={`w-10 h-10 rounded-full items-center justify-center mr-xs ${
                          isSelected ? 'bg-primary border border-primary-dark' : 'bg-neutral-100 border border-neutral-300'
                        }`}
                      >
                        <Text className={`font-sans-bold text-xs ${isSelected ? 'text-neutral-900' : 'text-neutral-700'}`}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Risk Tolerance Segmented Control */}
            <View>
              <Text className="font-sans-semibold text-xs text-neutral-700 mb-sm">
                Risk Tolerance
              </Text>
              {renderRiskSegmentControl()}
            </View>
          </View>
        )}

        {/* STEP 3: Safety Net */}
        {step === 3 && (
          <View className="flex-1 py-lg gap-lg">
            <View>
              <Text className="font-sans-bold text-2xl text-neutral-900 mb-xs">
                Safety net
              </Text>
              <Text className="font-sans text-sm text-neutral-500">
                Money set aside outside your main balance for emergencies
              </Text>
            </View>

            {/* Emergency savings input */}
            <View>
              <Text className="font-sans-semibold text-xs text-neutral-700 mb-xs">
                Emergency Savings Amount (₹)
              </Text>
              <View 
                className={`flex-row items-center bg-[#F5F3EE]/50 px-md rounded-md border-1.5 ${
                  focusedField === 'emergency' ? 'border-primary bg-white' : 'border-neutral-300'
                }`}
              >
                <Text className="font-sans-semibold text-base text-neutral-900 mr-xs">₹</Text>
                <TextInput
                  className="flex-1 font-mono text-neutral-900 text-sm h-12"
                  placeholder="0"
                  keyboardType="numeric"
                  value={emergencySavings}
                  onChangeText={setEmergencySavings}
                  onFocus={() => setFocusedField('emergency')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Dynamic Advice Card */}
            <View className="bg-primary-pale border-l-4 border-primary rounded-md p-md">
              <Text className="font-sans text-neutral-900 text-sm leading-6">
                💡 Aim for 3× your monthly income (₹{calculatedFundSuggest.toLocaleString()}) as your emergency fund.
              </Text>
            </View>
          </View>
        )}

        {/* STEP 4: Savings Goals (Optional) */}
        {step === 4 && (
          <View className="flex-1 py-lg">
            <View className="flex-row justify-between items-start mb-lg">
              <View className="flex-1 mr-sm">
                <Text className="font-sans-bold text-2xl text-neutral-900 mb-xs">
                  Your financial goals
                </Text>
                <Text className="font-sans text-sm text-neutral-500">
                  Add goals you're working toward. You can add more later.
                </Text>
              </View>
              <TouchableOpacity onPress={handleSkip} className="bg-neutral-100 px-md py-sm rounded-sm">
                <Text className="font-sans-semibold text-xs text-neutral-500">Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Dynamic Goal Forms */}
            <View className="gap-md mb-lg">
              {goals.map((goal, idx) => (
                <View key={idx} className="bg-[#F5F3EE]/50 border border-neutral-300 rounded-md p-md relative">
                  {/* Delete button */}
                  <TouchableOpacity 
                    onPress={() => removeGoal(idx)} 
                    className="absolute right-2 top-2 w-8 h-8 rounded-full items-center justify-center bg-white border border-neutral-300 shadow-sm z-10"
                  >
                    <Ionicons name="close" size={16} color="#C0392B" />
                  </TouchableOpacity>

                  <Text className="font-sans-bold text-xs text-primary-dark mb-sm">Goal #{idx + 1}</Text>
                  
                  {/* Title */}
                  <View className="mb-sm">
                    <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Goal Title</Text>
                    <TextInput
                      className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-sans text-neutral-900 text-sm"
                      placeholder="e.g. New Laptop"
                      value={goal.title}
                      onChangeText={(val) => updateGoalField(idx, 'title', val)}
                    />
                  </View>

                  <View className="flex-row gap-sm mb-sm">
                    {/* Target */}
                    <View className="flex-1">
                      <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Target Amount (₹)</Text>
                      <TextInput
                        className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-mono text-neutral-900 text-sm"
                        placeholder="0"
                        keyboardType="numeric"
                        value={goal.targetAmount ? String(goal.targetAmount) : ''}
                        onChangeText={(val) => updateGoalField(idx, 'targetAmount', Number(val))}
                      />
                    </View>
                    {/* Current */}
                    <View className="flex-1">
                      <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Current Saved (₹)</Text>
                      <TextInput
                        className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-mono text-neutral-900 text-sm"
                        placeholder="0"
                        keyboardType="numeric"
                        value={goal.currentProgress ? String(goal.currentProgress) : ''}
                        onChangeText={(val) => updateGoalField(idx, 'currentProgress', Number(val))}
                      />
                    </View>
                  </View>

                  {/* Deadline Date */}
                  <View>
                    <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Deadline (YYYY-MM-DD)</Text>
                    <TextInput
                      className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-mono text-neutral-900 text-sm"
                      placeholder="YYYY-MM-DD"
                      value={goal.deadline}
                      onChangeText={(val) => updateGoalField(idx, 'deadline', val)}
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={addGoal}
                className="border border-dashed border-primary py-md rounded-md items-center justify-center bg-primary-pale/30"
              >
                <Text className="font-sans-bold text-sm text-primary-dark">
                  + Add another goal
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 5: Existing Debts (Optional) */}
        {step === 5 && (
          <View className="flex-1 py-lg">
            <View className="flex-row justify-between items-start mb-lg">
              <View className="flex-1 mr-sm">
                <Text className="font-sans-bold text-2xl text-neutral-900 mb-xs">
                  Existing liabilities
                </Text>
                <Text className="font-sans text-sm text-neutral-500">
                  Add loans, EMIs or credit cards you're currently paying.
                </Text>
              </View>
              <TouchableOpacity onPress={handleFinalSubmit} className="bg-neutral-100 px-md py-sm rounded-sm">
                <Text className="font-sans-semibold text-xs text-neutral-500">Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Explanation box */}
            <View className="bg-primary-pale border border-primary/20 rounded-md p-md mb-md">
              <Text className="font-sans text-xs text-neutral-700 leading-5">
                These help our AI advisors give you accurate debt advice from day one.
              </Text>
            </View>

            {/* Liabilities forms list */}
            <View className="gap-md mb-lg">
              {liabilities.map((lib, idx) => {
                const isExpanded = activeLiabilityIndex === idx;
                
                return (
                  <View key={idx} className="bg-[#F5F3EE]/50 border border-neutral-300 rounded-md overflow-hidden">
                    {/* Collapsed Header */}
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      onPress={() => setActiveLiabilityIndex(isExpanded ? null : idx)}
                      className="flex-row items-center justify-between p-md bg-white border-b border-neutral-200"
                    >
                      <View className="flex-row items-center flex-1 mr-sm">
                        <Ionicons name={isExpanded ? "chevron-down" : "chevron-forward"} size={20} color="#7A7668" />
                        <Text className="font-sans-bold text-sm text-neutral-900 ml-sm flex-1" numberOfLines={1}>
                          {lib.name || `Liability #${idx + 1}`}
                        </Text>
                        <Text className="font-mono text-xs text-neutral-500 bg-neutral-100 px-sm py-[2px] rounded-full ml-sm">
                          {lib.type}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeLiability(idx)}>
                        <Ionicons name="trash-outline" size={18} color="#C0392B" />
                      </TouchableOpacity>
                    </TouchableOpacity>

                    {/* Expanded Content Form */}
                    {isExpanded && (
                      <View className="p-md gap-sm">
                        {/* Name */}
                        <View>
                          <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Liability Name</Text>
                          <TextInput
                            className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-sans text-neutral-900 text-sm"
                            placeholder="e.g. HDFC Car Loan"
                            value={lib.name}
                            onChangeText={(val) => updateLiabilityField(idx, 'name', val)}
                          />
                        </View>

                        {/* Type Picker & Interest Rate */}
                        <View className="flex-row gap-sm">
                          {/* Type selection as standard picker button style */}
                          <View className="flex-1">
                            <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Type</Text>
                            <View className="flex-row gap-1 bg-white border border-neutral-300 rounded-sm px-[2px] h-10 items-center justify-around">
                              {['EMI', 'Loan', 'Credit Card'].map((t) => (
                                <TouchableOpacity 
                                  key={t}
                                  onPress={() => updateLiabilityField(idx, 'type', t)}
                                  className={`px-sm py-[4px] rounded-[3px] ${lib.type === t ? 'bg-primary' : 'bg-transparent'}`}
                                >
                                  <Text style={{ fontSize: 9 }} className="font-sans-bold text-neutral-900">{t}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                          
                          {/* Interest Rate */}
                          <View className="flex-1">
                            <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Interest Rate (% p.a.)</Text>
                            <TextInput
                              className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-mono text-neutral-900 text-sm"
                              placeholder="e.g. 10.5"
                              keyboardType="numeric"
                              value={lib.interestRate ? String(lib.interestRate) : ''}
                              onChangeText={(val) => updateLiabilityField(idx, 'interestRate', Number(val))}
                            />
                          </View>
                        </View>

                        {/* Balances */}
                        <View className="flex-row gap-sm">
                          {/* Principal */}
                          <View className="flex-1">
                            <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Total Principal (₹)</Text>
                            <TextInput
                              className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-mono text-neutral-900 text-sm"
                              placeholder="0"
                              keyboardType="numeric"
                              value={lib.totalPrincipal ? String(lib.totalPrincipal) : ''}
                              onChangeText={(val) => updateLiabilityField(idx, 'totalPrincipal', Number(val))}
                            />
                          </View>
                          
                          {/* Remaining */}
                          <View className="flex-1">
                            <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Remaining Balance (₹)</Text>
                            <TextInput
                              className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-mono text-neutral-900 text-sm"
                              placeholder="0"
                              keyboardType="numeric"
                              value={lib.remainingBalance ? String(lib.remainingBalance) : ''}
                              onChangeText={(val) => updateLiabilityField(idx, 'remainingBalance', Number(val))}
                            />
                          </View>
                        </View>

                        {/* Monthly EMI & Duration */}
                        <View className="flex-row gap-sm">
                          {/* EMI */}
                          <View className="flex-1">
                            <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Monthly EMI (₹)</Text>
                            <TextInput
                              className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-mono text-neutral-900 text-sm"
                              placeholder="0"
                              keyboardType="numeric"
                              value={lib.monthlyEMI ? String(lib.monthlyEMI) : ''}
                              onChangeText={(val) => updateLiabilityField(idx, 'monthlyEMI', Number(val))}
                            />
                          </View>
                          
                          {/* Duration */}
                          <View className="flex-1">
                            <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Total Duration (mths)</Text>
                            <TextInput
                              className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-mono text-neutral-900 text-sm"
                              placeholder="36"
                              keyboardType="numeric"
                              value={lib.totalDuration ? String(lib.totalDuration) : ''}
                              onChangeText={(val) => updateLiabilityField(idx, 'totalDuration', Number(val))}
                            />
                          </View>
                        </View>

                        {/* Due Date & Months Paid */}
                        <View className="flex-row gap-sm">
                          {/* Due date picker (day of month slider styled) */}
                          <View className="flex-1">
                            <Text className="font-sans text-[11px] text-neutral-700 mb-xs">EMI Due Day (1-31)</Text>
                            <TextInput
                              className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-mono text-neutral-900 text-sm"
                              placeholder="5"
                              keyboardType="numeric"
                              value={lib.emiDueDate ? String(lib.emiDueDate) : ''}
                              onChangeText={(val) => updateLiabilityField(idx, 'emiDueDate', Number(val))}
                            />
                          </View>
                          
                          {/* Paid */}
                          <View className="flex-1">
                            <Text className="font-sans text-[11px] text-neutral-700 mb-xs">Months Already Paid</Text>
                            <TextInput
                              className="bg-white border border-neutral-300 rounded-sm px-sm h-10 font-mono text-neutral-900 text-sm"
                              placeholder="0"
                              keyboardType="numeric"
                              value={lib.monthsAlreadyPaid ? String(lib.monthsAlreadyPaid) : ''}
                              onChangeText={(val) => updateLiabilityField(idx, 'monthsAlreadyPaid', Number(val))}
                            />
                          </View>
                        </View>

                        {/* Auto debit toggle switch */}
                        <View className="flex-row items-center justify-between mt-xs pt-sm border-t border-neutral-200">
                          <Text className="font-sans text-xs text-neutral-700">Auto Debit Enabled</Text>
                          <Switch
                            trackColor={{ false: '#C8C4B8', true: '#F5C518' }}
                            thumbColor={lib.autoDebit ? '#D4A80E' : '#7A7668'}
                            value={lib.autoDebit}
                            onValueChange={(val) => updateLiabilityField(idx, 'autoDebit', val)}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={addLiability}
                className="border border-dashed border-primary py-md rounded-md items-center justify-center bg-primary-pale/30"
              >
                <Text className="font-sans-bold text-sm text-primary-dark">
                  + Add another liability
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Panel */}
      <View className="p-lg bg-white border-t border-neutral-100 flex-row gap-md">
        {step > 1 && (
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleBack}
            className="flex-1 bg-neutral-100 border border-neutral-300 py-md rounded-md items-center justify-center"
          >
            <Text className="font-sans-semibold text-neutral-700 text-sm">
              Back
            </Text>
          </TouchableOpacity>
        )}
        
        {step < 5 ? (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleNext}
            className="flex-2 bg-primary py-md rounded-md items-center justify-center border border-primary-dark"
          >
            <Text className="font-sans-bold text-neutral-900 text-sm">
              Next Step
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleFinalSubmit}
            disabled={isLoading}
            className="flex-2 bg-primary py-md rounded-md items-center justify-center border border-primary-dark"
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="#1C1A14" size="small" className="mr-sm" />
                <Text style={{ fontSize: 13 }} className="font-sans-bold text-neutral-900">Setting up...</Text>
              </View>
            ) : (
              <Text className="font-sans-bold text-neutral-900 text-sm">
                Let's go!
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
