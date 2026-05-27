import { create } from 'zustand';
import { getTransactionsByDate, addTransaction } from '../api/transaction.api';
import { useAuthStore } from './authStore';
import { useProfileStore } from './profileStore';
import { formatDateToYMD } from '../utils/dateUtils';
import Toast from 'react-native-toast-message';

export interface Transaction {
  id?: string;
  _id?: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // YYYY-MM-DD
  isAutomated: boolean;
  notes?: string;
  liabilityId?: string;
}

interface TransactionState {
  transactions: Transaction[];
  selectedDate: Date;
  isLoading: boolean;
  
  setSelectedDate: (date: Date) => void;
  fetchTransactions: (date?: Date) => Promise<void>;
  addNewTransaction: (data: Omit<Transaction, 'id' | '_id'>) => Promise<boolean>;
  
  // Custom Analytics
  getDailySummary: () => {
    totalIncome: number;
    totalExpense: number;
    netFlow: number;
  };
  
  getMonthSummary: () => {
    totalIncome: number;
    totalExpense: number;
  };
}

// Generate dynamic mock transactions relative to today
const generateMockTransactions = (): Transaction[] => {
  const today = new Date();
  const todayYMD = formatDateToYMD(today);
  
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayYMD = formatDateToYMD(yesterday);
  
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 2);
  const twoDaysAgoYMD = formatDateToYMD(twoDaysAgo);

  return [
    { _id: 't-1', title: 'Salary Credited', amount: 120000, type: 'income', category: 'Salary', date: todayYMD, isAutomated: true, notes: 'Monthly corporate salary.' },
    { _id: 't-2', title: 'HDFC Car Loan EMI', amount: 18500, type: 'expense', category: 'EMI / Loan', date: todayYMD, isAutomated: true, liabilityId: 'l-1', notes: 'Auto-debited HDFC EMI' },
    { _id: 't-3', title: 'Swiggy Dinner Order', amount: 850, type: 'expense', category: 'Food', date: todayYMD, isAutomated: false, notes: 'Truffle Pizza & Mocktail' },
    { _id: 't-4', title: 'Uber Go Ride', amount: 320, type: 'expense', category: 'Transport', date: todayYMD, isAutomated: false },
    { _id: 't-5', title: 'Freelance Logo Project', amount: 15000, type: 'income', category: 'Freelance', date: yesterdayYMD, isAutomated: false },
    { _id: 't-6', title: 'Electricity Bill', amount: 3400, type: 'expense', category: 'Utilities', date: yesterdayYMD, isAutomated: true, notes: 'May Electric Bill' },
    { _id: 't-7', title: 'Nike Shoes Shopping', amount: 7500, type: 'expense', category: 'Shopping', date: twoDaysAgoYMD, isAutomated: false, notes: 'Pegasus 40' },
    { _id: 't-8', title: 'Mutual Fund Sip', amount: 10000, type: 'expense', category: 'Investment', date: twoDaysAgoYMD, isAutomated: true },
  ];
};

let localLedger: Transaction[] = [];

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  selectedDate: new Date(),
  isLoading: false,

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().fetchTransactions(date);
  },

  fetchTransactions: async (date) => {
    const targetDate = date || get().selectedDate;
    const targetDateYMD = formatDateToYMD(targetDate);
    
    set({ isLoading: true });
    
    try {
      const isDemo = useAuthStore.getState().isDemoMode;
      if (isDemo) {
        if (localLedger.length === 0) {
          localLedger = generateMockTransactions();
        }
        
        // Filter by date
        const filtered = localLedger.filter(t => t.date === targetDateYMD);
        set({ transactions: filtered, isLoading: false });
        return;
      }

      const list = await getTransactionsByDate(targetDateYMD);
      set({ transactions: list, isLoading: false });
    } catch (error: any) {
      console.log('Fetch transactions failed, using mock data:', error.message);
      
      // Fallback
      if (localLedger.length === 0) {
        localLedger = generateMockTransactions();
      }
      const filtered = localLedger.filter(t => t.date === targetDateYMD);
      set({ transactions: filtered, isLoading: false });
    }
  },

  addNewTransaction: async (txData) => {
    set({ isLoading: true });
    try {
      const isDemo = useAuthStore.getState().isDemoMode;
      const formattedTx: Transaction = {
        ...txData,
        _id: `t-${Date.now()}`
      };

      if (isDemo) {
        localLedger.push(formattedTx);
        
        // Fetch to update view
        const currentYMD = formatDateToYMD(get().selectedDate);
        const filtered = localLedger.filter(t => t.date === currentYMD);
        set({ transactions: filtered, isLoading: false });
        
        // Update user balance in profileStore
        const profileStore = useProfileStore.getState();
        if (profileStore.profile) {
          const balanceChange = txData.type === 'income' ? txData.amount : -txData.amount;
          const updatedBalance = profileStore.profile.currentBankBalance + balanceChange;
          
          await profileStore.patchProfile({ currentBankBalance: updatedBalance });
          
          // Check if this was an EMI/Loan transaction paying off a liability
          if (txData.category === 'EMI / Loan' && txData.liabilityId) {
            profileStore.payLiabilityEMI(txData.liabilityId, txData.amount);
          }
        }
        
        Toast.show({
          type: 'success',
          text1: 'Transaction Added',
          text2: `${txData.title} of ₹${txData.amount} saved locally.`,
        });
        return true;
      }

      const apiResult = await addTransaction(txData);
      
      // Refresh current list from API
      await get().fetchTransactions();
      
      // Also refresh profile state
      await useProfileStore.getState().fetchProfile();
      
      set({ isLoading: false });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Transaction added successfully.',
      });
      return true;
    } catch (error: any) {
      console.log('AddTransaction API failed, adding locally:', error.message);
      
      // Failover to local list
      localLedger.push({
        ...txData,
        _id: `t-${Date.now()}`
      });
      
      const currentYMD = formatDateToYMD(get().selectedDate);
      const filtered = localLedger.filter(t => t.date === currentYMD);
      set({ transactions: filtered, isLoading: false });
      
      // Update balance locally
      const profileStore = useProfileStore.getState();
      if (profileStore.profile) {
        const balanceChange = txData.type === 'income' ? txData.amount : -txData.amount;
        const updatedBalance = profileStore.profile.currentBankBalance + balanceChange;
        
        await profileStore.patchProfile({ currentBankBalance: updatedBalance });
        
        if (txData.category === 'EMI / Loan' && txData.liabilityId) {
          profileStore.payLiabilityEMI(txData.liabilityId, txData.amount);
        }
      }
      
      Toast.show({
        type: 'success',
        text1: 'Saved Locally',
        text2: 'Transaction saved in Demo Mode.',
      });
      return true;
    }
  },

  getDailySummary: () => {
    const list = get().transactions;
    const totalIncome = list.filter(t => t.type === 'income').reduce((acc, c) => acc + c.amount, 0);
    const totalExpense = list.filter(t => t.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
    return {
      totalIncome,
      totalExpense,
      netFlow: totalIncome - totalExpense
    };
  },

  getMonthSummary: () => {
    // For demo/simulated summaries, parse localLedger or default
    const isDemo = useAuthStore.getState().isDemoMode;
    const sourceList = isDemo ? localLedger : get().transactions; // If API is up, standard will pull all.
    
    // In demo mode we can sum up the ledger
    const totalIncome = sourceList.filter(t => t.type === 'income').reduce((acc, c) => acc + c.amount, 0);
    const totalExpense = sourceList.filter(t => t.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
    
    // Default fallback to show reasonable stats on Dashboard if lists are small
    const profileStore = useProfileStore.getState();
    const income = profileStore.profile?.monthlyIncome || 120000;
    const emi = profileStore.profile?.liabilities.reduce((acc, curr) => acc + (curr.isCompleted ? 0 : curr.monthlyEMI), 0) || 0;
    
    return {
      totalIncome: totalIncome > 0 ? totalIncome : income,
      totalExpense: totalExpense > 0 ? totalExpense : emi + 15000,
    };
  }
}));
