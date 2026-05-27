import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const financialGoalSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    currentProgress: {
      type: Number,
      default: 0,
      min: 0,
    },

    deadline: {
      type: Date,
    },
  },
  { _id: true }
);

const financialProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    persona: {
      type: String,
      enum: ["Student", "Salaried", "Freelancer"],
      required: true,
    },

    monthlyIncome: {
      type: Number,
      required: true,
      min: 0,
    },

    currentBankBalance: {
      type: Number,
      required: true,
      min: 0,
    },

    riskTolerance: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    // Day of month salary is credited (1–31). Used for auto-income scheduling.
    salaryDay: {
      type: Number,
      min: 1,
      max: 31,
      default: 1,
    },

    // Computed field: monthlyIncome − sum of all active EMI amounts
    // Recalculated whenever a liability is added/removed or income changes
    disposableIncome: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total saved in liquid emergency fund (separate from bank balance)
    emergencySavings: {
      type: Number,
      default: 0,
      min: 0,
    },

    financialGoals: [financialGoalSchema],
  },
  { timestamps: true }
);

export type FinancialProfile = InferSchemaType<typeof financialProfileSchema>;
export const FinancialProfileModel = model("FinancialProfile", financialProfileSchema);