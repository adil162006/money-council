import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const councilReportSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    executionType: {
      type: String,
      enum: [
        "Manual",
        "Scheduled",
        "Event Triggered",
      ],
      default: "Manual",
    },

    snapshotAtExecution: {
      income: {
        type: Number,
        required: true,
      },

      totalEMIs: {
        type: Number,
        required: true,
      },

      categoryAggregates: {
        type: Map,
        of: Number,
      },

      currentBankBalance: {
        type: Number,
      },

      activeGoals: {
        type: Number,
      },

      activeLiabilities: {
        type: Number,
      },
    },

    agentMemos: {
      type: Map,
      of: String,
      default: {},
    },

    finalCouncilPlan: {
      type: String,
      required: true,
    },

    overallFinancialScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    riskFlags: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export type CouncilReport =
  InferSchemaType<
    typeof councilReportSchema
  >;

export const CouncilReportModel =
  model(
    "CouncilReport",
    councilReportSchema
  );