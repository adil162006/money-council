import { create } from 'zustand';
import { getProfile, completeProfile, updateProfile } from '../api/profile.api';
import Toast from 'react-native-toast-message';
import { useAuthStore } from './authStore';

export interface Liability {
  id?: string;
  _id?: string;
  name: string;
  type: 'EMI' | 'Loan' | 'Credit Card' | 'BNPL' | 'Other';
  totalPrincipal: number;
  remainingBalance: number;
  interestRate: number;
  monthlyEMI: number;
  totalDuration: number; // months
  emiDueDate: number; // day of month
  monthsAlreadyPaid: number;
  autoDebit: boolean;
  isCompleted?: boolean;
}

export interface Goal {
  id?: string;
  _id?: string;
  title: string;
  targetAmount: number;
  currentProgress: number;
  deadline?: string; // YYYY-MM-DD
}

export interface ProfileData {
  persona: 'Student' | 'Salaried' | 'Freelancer';
  monthlyIncome: number;
  currentBankBalance: number;
  riskTolerance: 'Low' | 'Medium' | 'High';
  salaryDay: number;
  emergencySavings: number;
  financialGoals: Goal[];
  liabilities: Liability[];
}

interface ProfileState {
  profile: ProfileData | null;
  isLoading: boolean;
  
  fetchProfile: () => Promise<void>;
  saveCompleteProfile: (data: ProfileData) => Promise<boolean>;
  patchProfile: (data: Partial<ProfileData>) => Promise<boolean>;
  addGoalLocally: (goal: Goal) => Promise<void>;
  addLiabilityLocally: (liability: Liability) => Promise<void>;
  payLiabilityEMI: (id: string, amount: number) => void;
  
  // Computed Getters
  getAnalytics: () => {
    totalRemainingDebt: number;
    totalMonthlyEMI: number;
    emiToIncomeRatio: number;
    disposableIncome: number;
    hasHighInterestDebt: boolean;
    highestInterestLiability: Liability | null;
    emergencySavingsTarget: number;
    totalInterestCostEstimate: number;
  };
}

const mockProfile: ProfileData = {
  persona: 'Salaried',
  monthlyIncome: 120000,
  currentBankBalance: 340000,
  riskTolerance: 'Medium',
  salaryDay: 1,
  emergencySavings: 150000,
  financialGoals: [
    { _id: 'g-1', title: 'Emergency Fund', targetAmount: 360000, currentProgress: 150000, deadline: '2026-12-31' },
    { _id: 'g-2', title: 'Trip to Ladakh', targetAmount: 80000, currentProgress: 45000, deadline: '2026-08-15' },
    { _id: 'g-3', title: 'Buy MacBook Pro', targetAmount: 180000, currentProgress: 120000, deadline: '2026-10-01' },
  ],
  liabilities: [
    { _id: 'l-1', name: 'HDFC Car Loan', type: 'EMI', totalPrincipal: 800000, remainingBalance: 520000, interestRate: 9.5, monthlyEMI: 18500, totalDuration: 60, emiDueDate: 5, monthsAlreadyPaid: 18, autoDebit: true, isCompleted: false },
    { _id: 'l-2', name: 'SBI Credit Card', type: 'Credit Card', totalPrincipal: 100000, remainingBalance: 85000, interestRate: 42.0, monthlyEMI: 8500, totalDuration: 12, emiDueDate: 20, monthsAlreadyPaid: 3, autoDebit: false, isCompleted: false },
    { _id: 'l-3', name: 'ICICI Personal Loan', type: 'Loan', totalPrincipal: 300000, remainingBalance: 120000, interestRate: 13.5, monthlyEMI: 10200, totalDuration: 36, emiDueDate: 10, monthsAlreadyPaid: 24, autoDebit: true, isCompleted: false },
  ]
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const isDemo = useAuthStore.getState().isDemoMode;
      if (isDemo) {
        // Run with mock data
        set({ profile: { ...mockProfile }, isLoading: false });
        return;
      }
      
      const data = await getProfile();
      // Format response keys or default values if keys are structured differently
      set({ 
        profile: {
          persona: data.profile?.persona || 'Salaried',
          monthlyIncome: data.profile?.monthlyIncome || 0,
          currentBankBalance: data.profile?.currentBankBalance || 0,
          riskTolerance: data.profile?.riskTolerance || 'Medium',
          salaryDay: data.profile?.salaryDay || 1,
          emergencySavings: data.profile?.emergencySavings || 0,
          financialGoals: data.profile?.financialGoals || [],
          liabilities: data.liabilities || [],
        },
        isLoading: false 
      });
    } catch (error: any) {
      console.log('Fetch profile failed, using mock profile:', error.message);
      // Fallback
      set({ profile: { ...mockProfile }, isLoading: false });
    }
  },

  saveCompleteProfile: async (profileData) => {
    set({ isLoading: true });
    try {
      const isDemo = useAuthStore.getState().isDemoMode;
      if (isDemo) {
        set({ profile: profileData, isLoading: false });
        useAuthStore.getState().setProfileCompleted(true);
        return true;
      }

      await completeProfile(profileData);
      set({ profile: profileData, isLoading: false });
      await useAuthStore.getState().setProfileCompleted(true);
      
      Toast.show({
        type: 'success',
        text1: 'Profile Setup Completed',
        text2: 'Let\'s start managing your budget!',
      });
      return true;
    } catch (error: any) {
      console.log('CompleteProfile API failed, completing locally:', error.message);
      
      // Fallback to local
      set({ profile: profileData, isLoading: false });
      await useAuthStore.getState().setProfileCompleted(true);
      
      Toast.show({
        type: 'info',
        text1: 'Saved Locally',
        text2: 'Profile configured in Demo Mode.',
      });
      return true;
    }
  },

  patchProfile: async (updateData) => {
    const currentProfile = get().profile;
    if (!currentProfile) return false;
    
    const updated = { ...currentProfile, ...updateData };
    set({ isLoading: true });
    
    try {
      const isDemo = useAuthStore.getState().isDemoMode;
      if (isDemo) {
        set({ profile: updated, isLoading: false });
        return true;
      }
      
      await updateProfile(updateData);
      set({ profile: updated, isLoading: false });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully.',
      });
      return true;
    } catch (error: any) {
      console.log('UpdateProfile API failed, saving locally:', error.message);
      set({ profile: updated, isLoading: false });
      Toast.show({
        type: 'success',
        text1: 'Saved Locally',
        text2: 'Profile updated in Demo Mode.',
      });
      return true;
    }
  },

  addGoalLocally: async (newGoal) => {
    const current = get().profile;
    if (!current) return;
    
    const updatedGoals = [...current.financialGoals, { ...newGoal, _id: `g-${Date.now()}` }];
    await get().patchProfile({ financialGoals: updatedGoals });
  },

  addLiabilityLocally: async (newLiability) => {
    const current = get().profile;
    if (!current) return;
    
    const updatedLiabilities = [...current.liabilities, { ...newLiability, _id: `l-${Date.now()}`, isCompleted: false }];
    await get().patchProfile({ liabilities: updatedLiabilities });
  },

  payLiabilityEMI: (id, amount) => {
    const current = get().profile;
    if (!current) return;
    
    const updatedLiabilities = current.liabilities.map(l => {
      const lId = l._id || l.id;
      if (lId === id) {
        const remaining = Math.max(0, l.remainingBalance - amount);
        const paid = l.monthsAlreadyPaid + 1;
        const isCompleted = remaining <= 0;
        return {
          ...l,
          remainingBalance: remaining,
          monthsAlreadyPaid: paid,
          isCompleted,
        };
      }
      return l;
    });

    const isDemo = useAuthStore.getState().isDemoMode;
    if (isDemo) {
      // Just modify local balance
      const liability = current.liabilities.find(l => (l._id || l.id) === id);
      const newBalance = current.currentBankBalance - (liability ? liability.monthlyEMI : amount);
      set({
        profile: {
          ...current,
          currentBankBalance: newBalance,
          liabilities: updatedLiabilities
        }
      });
    } else {
      get().patchProfile({ liabilities: updatedLiabilities });
    }
  },

  getAnalytics: () => {
    const prof = get().profile;
    if (!prof) {
      return {
        totalRemainingDebt: 0,
        totalMonthlyEMI: 0,
        emiToIncomeRatio: 0,
        disposableIncome: 0,
        hasHighInterestDebt: false,
        highestInterestLiability: null,
        emergencySavingsTarget: 0,
        totalInterestCostEstimate: 0,
      };
    }

    const activeLiabilities = prof.liabilities.filter(l => !l.isCompleted && l.remainingBalance > 0);
    const totalRemainingDebt = activeLiabilities.reduce((acc, curr) => acc + curr.remainingBalance, 0);
    const totalMonthlyEMI = activeLiabilities.reduce((acc, curr) => acc + curr.monthlyEMI, 0);
    const emiToIncomeRatio = prof.monthlyIncome > 0 ? (totalMonthlyEMI / prof.monthlyIncome) * 100 : 0;
    const disposableIncome = Math.max(0, prof.monthlyIncome - totalMonthlyEMI);
    
    const highInterestDebtList = activeLiabilities.filter(l => l.interestRate >= 20);
    const hasHighInterestDebt = highInterestDebtList.length > 0;
    
    let highestInterestLiability: Liability | null = null;
    if (activeLiabilities.length > 0) {
      highestInterestLiability = [...activeLiabilities].sort((a, b) => b.interestRate - a.interestRate)[0];
    }

    const emergencySavingsTarget = prof.monthlyIncome * 3;
    
    // Estimate interest cost over remaining months
    const totalInterestCostEstimate = activeLiabilities.reduce((acc, curr) => {
      // Very rough calculation of remaining interest cost = Balance * Rate * (Years Remaining / 2) for amortized debt,
      // or simple calculation:
      const monthsRemaining = curr.totalDuration - curr.monthsAlreadyPaid;
      if (monthsRemaining <= 0) return acc;
      const yearlyRate = curr.interestRate / 100;
      const balance = curr.remainingBalance;
      // Approximate remaining interest = balance * yearlyRate * (monthsRemaining / 12) * 0.55 (reducing balance estimate)
      const approxInterest = balance * yearlyRate * (monthsRemaining / 12) * 0.55;
      return acc + Math.round(approxInterest);
    }, 0);

    return {
      totalRemainingDebt,
      totalMonthlyEMI,
      emiToIncomeRatio,
      disposableIncome,
      hasHighInterestDebt,
      highestInterestLiability,
      emergencySavingsTarget,
      totalInterestCostEstimate,
    };
  }
}));
