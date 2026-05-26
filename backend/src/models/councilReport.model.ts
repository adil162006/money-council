import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const councilReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // A freeze-frame snapshot of what their finances looked like during this run
  snapshotAtExecution: {
    income: { type: Number, required: true },
    totalEMIs: { type: Number, required: true },
    categoryAggregates: { type: Map, of: Number } // e.g., { "Food": 12000, "Shopping": 4000 }
  },

  // Saved advice from the 4 standard LangChain runs
  agentMemos: {
    budgetAgent: { type: String, required: true },
    savingsAgent: { type: String, required: true },
    debtManager: { type: String, required: true },
    investmentScout: { type: String, required: true }
  },

  // The final consolidated strategy map compiled by the Supervisor
  finalCouncilPlan: { type: String, required: true },
  
  // Numerical projections required by your 3-month comparison charts
  threeMonthChartData: {
    months: [{ type: String }], // ["Month 1", "Month 2", "Month 3"]
    savingsTrend: [{ type: Number }],
    debtTrend: [{ type: Number }]
  }
}, { timestamps: true });

export type CouncilReport = InferSchemaType<typeof councilReportSchema>;
export const CouncilReportModel = model('CouncilReport', councilReportSchema);