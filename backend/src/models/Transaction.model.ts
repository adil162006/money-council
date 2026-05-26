import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';
const transactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  category: { 
    type: String, 
    enum: ['Rent', 'Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Education', 'Healthcare', 'EMI / Loan'], 
    required: true 
  },
  
  // True if it's an EMI or structured loan repayment
  isRecurringLiability: { type: Boolean, default: false },
  
  // Specific details for the Debt Manager Agent (Populated if category is 'EMI / Loan')
  liabilityDetails: {
    monthsPaid: { type: Number, default: 0 },
    totalMonthsDuration: { type: Number, required: true }, // e.g., 6 for a 6-month EMI
    loanStatus: { 
  type: String, 
  enum: ['Active', 'Completed'], 
  default: 'Active',
  index: true
},
    totalPrincipal: { type: Number },
    remainingBalance: { type: Number },
    interestRateAPR: { type: Number }, // Essential data point for sorting by Avalanche method
    minimumMonthlyPayment: { type: Number },
    dueDate: { type: Number, min: 1, max: 31 }
  }
}, { timestamps: true });

export type Transaction = InferSchemaType<typeof transactionSchema>;
export const TransactionModel = model('Transaction', transactionSchema);