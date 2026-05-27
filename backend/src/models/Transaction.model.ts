import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const transactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["Income", "Expense"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      enum: [
        "Salary",
        "Freelance",
        "Rent",
        "Food",
        "Transport",
        "Entertainment",
        "Utilities",
        "Shopping",
        "Education",
        "Healthcare",
        "EMI / Loan",
        "Investment",
        "Other",
      ],
      required: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    liabilityId: {
      type: Schema.Types.ObjectId,
      ref: "Liability",
      default: null,
    },

    source: {
      type: String,
      enum: ["Manual", "Automated"],
      default: "Manual",
    },

    // Explicit calendar date for this transaction (YYYY-MM-DD at midnight UTC).
    // Allows querying "all transactions on date X" independently of createdAt.
    // Defaults to the day the document is inserted.
    dateOf: {
      type: Date,
      required: true,
      default: () => {
        const now = new Date();
        return new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );
      },
    },
  },
  { timestamps: true }
);

// Compound index for efficient per-user date-range queries
transactionSchema.index({ userId: 1, dateOf: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

export type Transaction = InferSchemaType<typeof transactionSchema>;
export const TransactionModel = model("Transaction", transactionSchema);