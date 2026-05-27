import type {Request,Response} from 'express';
import mongoose from "mongoose";
import { UserModel } from '../models/user.model';
import { FinancialProfileModel } from '../models/financialProfile.model';
import { TransactionModel } from '../models/Transaction.model';
import { LiabilityModel } from '../models/liability.model';
import AsyncHandler from '../lib/AsyncHandler';








// ─────────────────────────────────────────────────────────────────────────────
// HELPER — buildLiabilityPayload
// ─────────────────────────────────────────────────────────────────────────────
 
/**
 * Fetches and shapes all liability data for a user.
 * Used by both completeProfile and getUserDetails so the response
 * structure is always identical.
 *
 * Per active liability it computes:
 *   monthsRemaining    — totalMonthsDuration − monthsPaid
 *   amountPaid         — monthsPaid × emiAmount
 *   progressPercent    — (amountPaid / totalPrincipal) × 100, capped at 100
 *   totalInterestCost  — (emiAmount × totalMonthsDuration) − totalPrincipal
 *   isHighInterest     — interestRate >= 20 (danger flag for Debt Manager agent)
 *   isDangerous        — emiAmount > 40% of monthlyIncome (stress flag)
 *
 * Also returns:
 *   summary            — aggregated numbers across all active liabilities
 *   byType             — active liabilities grouped by their type field
 */
async function buildLiabilityPayload(
  userId: mongoose.Types.ObjectId,
  monthlyIncome: number
) {
  const [activeLiabilities, completedLiabilities] = await Promise.all([
    LiabilityModel.find({ userId, loanStatus: "Active" }).sort({
      interestRate: -1, // highest interest first — Debt Manager priority order
    }),
    LiabilityModel.find({ userId, loanStatus: "Completed" }).sort({
      updatedAt: -1,
    }),
  ]);
 
  // ── Per-liability computed fields ────────────────────────────────────────
  const activeEnriched = activeLiabilities.map((l) => {
    const monthsRemaining = Math.max(
      0,
      l.totalMonthsDuration - (l.monthsPaid ?? 0)
    );
    const amountPaid = (l.monthsPaid ?? 0) * l.emiAmount;
    const progressPercent = Math.min(
      100,
      l.totalPrincipal > 0
        ? parseFloat(((amountPaid / l.totalPrincipal) * 100).toFixed(1))
        : 0
    );
    const totalInterestCost = parseFloat(
      (l.emiAmount * l.totalMonthsDuration - l.totalPrincipal).toFixed(2)
    );
    const isHighInterest = l.interestRate >= 20;
    const isDangerous =
      monthlyIncome > 0 && l.emiAmount / monthlyIncome > 0.4;
 
    return {
      ...l.toObject(),
      monthsRemaining,
      amountPaid,
      progressPercent,
      totalInterestCost,
      isHighInterest,
      isDangerous,
    };
  });
 
  // ── Aggregate summary ────────────────────────────────────────────────────
  const totalMonthlyEMI = activeLiabilities.reduce(
    (sum, l) => sum + l.emiAmount,
    0
  );
  const totalRemainingDebt = activeLiabilities.reduce(
    (sum, l) => sum + l.remainingBalance,
    0
  );
  const totalOriginalDebt = activeLiabilities.reduce(
    (sum, l) => sum + l.totalPrincipal,
    0
  );
  const totalAmountPaid = activeEnriched.reduce(
    (sum, l) => sum + l.amountPaid,
    0
  );
  const emiToIncomeRatio =
    monthlyIncome > 0
      ? parseFloat(((totalMonthlyEMI / monthlyIncome) * 100).toFixed(1))
      : 0;
 
  // Highest-interest active liability (already sorted desc, just take first)
  const highestInterestLiability =
    activeEnriched.length > 0
      ? {
          _id: activeEnriched[0]?._id,
          name: activeEnriched[0]?.name,
          type: activeEnriched[0]?.type,
          interestRate: activeEnriched[0]?.interestRate,
          remainingBalance: activeEnriched[0]?.remainingBalance,
          emiAmount: activeEnriched[0]?.emiAmount,
          monthsRemaining: activeEnriched[0]?.monthsRemaining,
        }
      : null;
 
  // ── Group active liabilities by type ────────────────────────────────────
  const byType = activeEnriched.reduce<Record<string, typeof activeEnriched>>(
    (acc, l) => {
      const key = l.type ?? "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(l);
      return acc;
    },
    {}
  );
 
  return {
    active: activeEnriched,
    completed: completedLiabilities,
    byType,
    summary: {
      activeCount: activeLiabilities.length,
      completedCount: completedLiabilities.length,
      totalMonthlyEMI,
      totalRemainingDebt,
      totalOriginalDebt,
      totalAmountPaid: parseFloat(totalAmountPaid.toFixed(2)),
      emiToIncomeRatio: `${emiToIncomeRatio}%`,
      // Overall repayment progress across all active loans
      overallProgressPercent:
        totalOriginalDebt > 0
          ? parseFloat(
              ((totalAmountPaid / totalOriginalDebt) * 100).toFixed(1)
            )
          : 0,
      highestInterestLiability,
      // Debt Manager danger flags
      hasHighInterestDebt: activeEnriched.some((l) => l.isHighInterest),
      hasDangerousEMI: activeEnriched.some((l) => l.isDangerous),
    },
  };
}
 
// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE PROFILE  –  POST /api/profile/complete
// ─────────────────────────────────────────────────────────────────────────────
 
/**
 * Called once after registration to fill in the financial profile.
 * Marks isProfileCompleted = true on the User document.
 * Returns the full profile + liability payload so the frontend
 * can render the dashboard immediately without a second request.
 *
 * Body:
 *  persona            "Student" | "Salaried" | "Freelancer"
 *  monthlyIncome      number
 *  currentBankBalance number
 *  riskTolerance?     "Low" | "Medium" | "High"
 *  salaryDay?         1–31
 *  emergencySavings?  number
 *  financialGoals?    { title, targetAmount, currentProgress?, deadline? }[]
 */
export const completeProfile = AsyncHandler(
  async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.id);
 
    const existing = await FinancialProfileModel.findOne({ userId });
    if (existing) {
      res.status(409).json({ message: "Profile already completed." });
      return;
    }
 
    const {
      persona,
      monthlyIncome,
      currentBankBalance,
      riskTolerance,
      salaryDay,
      emergencySavings,
      financialGoals,
    } = req.body;
 
    if (!persona || monthlyIncome == null || currentBankBalance == null) {
      res.status(400).json({
        message: "persona, monthlyIncome and currentBankBalance are required.",
      });
      return;
    }
 
    const profile = await FinancialProfileModel.create({
      userId,
      persona,
      monthlyIncome,
      currentBankBalance,
      riskTolerance: riskTolerance ?? "Medium",
      salaryDay: salaryDay ?? 1,
      emergencySavings: emergencySavings ?? 0,
      disposableIncome: monthlyIncome, // no liabilities yet
      financialGoals: financialGoals ?? [],
    });
 
    await UserModel.findByIdAndUpdate(userId, { isProfileCompleted: true });
 
    // No liabilities on a fresh profile but we return the same shape
    // so the frontend contract never changes
    const liabilities = await buildLiabilityPayload(userId, monthlyIncome);
 
    res.status(201).json({
      message: "Profile completed successfully.",
      profile,
      liabilities,
      financialSummary: {
        monthlyIncome,
        currentBankBalance,
        disposableIncome: monthlyIncome,
        emergencySavings: emergencySavings ?? 0,
        ...liabilities.summary,
        totalFinancialGoals: (financialGoals ?? []).length,
      },
    });
  }
);
