import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const financialProfileSchema = new Schema({
  // Relates directly to your Authentication Schema
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  persona: { 
    type: String, 
    enum: ['Student', 'Salaried', 'Freelancer'], 
    required: true 
  },
  monthlyIncome: { type: Number, required: true, min: 0 },
currentBankBalance: { type: Number, required: true, min: 0 },
  
  // Handled and updated dynamically by your backend calculations
  disposableIncome: { type: Number, default: 0 }, 
  
  riskTolerance: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Medium' 
  },
  
  financialGoals: [{
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentProgress: { type: Number, default: 0 },
    deadline: { type: Date }
  }]
}, { timestamps: true });

export type FinancialProfile = InferSchemaType<typeof financialProfileSchema>;
export const FinancialProfileModel = model('FinancialProfile', financialProfileSchema);