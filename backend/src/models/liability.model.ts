import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const liabilitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["EMI", "Loan", "Credit Card", "BNPL", "Other"],
      default: "EMI",
    },

    totalPrincipal: {
      type: Number,
      required: true,
      min: 0,
    },

    remainingBalance: {
      type: Number,
      required: true,
      min: 0,
    },

    interestRate: {
      type: Number,
      required: true,
      min: 0,
    },

    emiAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    minimumMonthlyPayment: {
      type: Number,
      min: 0,
    },

    monthsPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalMonthsDuration: {
      type: Number,
      required: true,
      min: 1,
    },

    dueDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },

    nextDueDate: {
      type: Date,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    loanStatus: {
      type: String,
      enum: ["Active", "Completed"],
      default: "Active",
      index: true,
    },

    autoDebit: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export type Liability = InferSchemaType<
  typeof liabilitySchema
>;

export const LiabilityModel = model(
  "Liability",
  liabilitySchema
);