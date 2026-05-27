import type { Request, Response } from "express";
import mongoose from "mongoose";
import { UserModel } from "../models/user.model";
import { FinancialProfileModel } from "../models/financialProfile.model";
import { LiabilityModel } from "../models/liability.model";
import AsyncHandler from "../lib/AsyncHandler";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — computeDisposableIncome
// ─────────────────────────────────────────────────────────────────────────────

/**
 * disposableIncome = monthlyIncome − Σ(emiAmount of all Active liabilities)
 *
 * Always computed on the fly from live DB data.
 * Never stored — no stale values, no sync bugs.
 */
export async function computeDisposableIncome(
  userId: mongoose.Types.ObjectId | string,
  monthlyIncome: number,
  session?: mongoose.ClientSession
): Promise<number> {
  const query = LiabilityModel.find({ userId, loanStatus: "Active" }).select(
    "emiAmount"
  );
  if (session) query.session(session);

  const activeLiabilities = await query;
  const totalEMI = activeLiabilities.reduce(
    (sum, l) => sum + (l.emiAmount ?? 0),
    0
  );
  return Math.max(0, monthlyIncome - totalEMI);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — buildLiabilityPayload
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches and shapes the full liability picture for a user.
 * Shared by completeProfile and getUserDetails — identical response shape.
 *
 * Per active liability computes:
 *   monthsRemaining   — totalMonthsDuration − monthsPaid
 *   amountPaid        — monthsPaid × emiAmount
 *   progressPercent   — amountPaid / totalPrincipal × 100  (capped 0–100)
 *   totalInterestCost — (emiAmount × totalMonthsDuration) − totalPrincipal
 *   isHighInterest    — interestRate >= 20%  (Debt Manager red flag)
 *   isDangerous       — single EMI > 40% of monthlyIncome  (stress flag)
 *
 * Returns:
 *   active            — enriched list, sorted by interestRate desc
 *   completed         — raw list, sorted by updatedAt desc
 *   byType            — active grouped by liability type
 *   summary           — aggregates + danger flags + disposableIncome
 */
async function buildLiabilityPayload(
  userId: mongoose.Types.ObjectId,
  monthlyIncome: number
) {
  const [activeLiabilities, completedLiabilities] = await Promise.all([
    LiabilityModel.find({ userId, loanStatus: "Active" }).sort({
      interestRate: -1,
    }),
    LiabilityModel.find({ userId, loanStatus: "Completed" }).sort({
      updatedAt: -1,
    }),
  ]);

  // ── Enrich each active liability ─────────────────────────────────────────
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

  // ── Aggregates ───────────────────────────────────────────────────────────
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

  // Computed fresh — no DB field
  const disposableIncome = Math.max(0, monthlyIncome - totalMonthlyEMI);

  const emiToIncomeRatio =
    monthlyIncome > 0
      ? parseFloat(((totalMonthlyEMI / monthlyIncome) * 100).toFixed(1))
      : 0;

  const highestInterestLiability =
    activeEnriched.length > 0
      ? {
          _id: activeEnriched[0]!._id,
          name: activeEnriched[0]!.name,
          type: activeEnriched[0]!.type,
          interestRate: activeEnriched[0]!.interestRate,
          remainingBalance: activeEnriched[0]!.remainingBalance,
          emiAmount: activeEnriched[0]!.emiAmount,
          monthsRemaining: activeEnriched[0]!.monthsRemaining,
        }
      : null;

  // ── Group by type ────────────────────────────────────────────────────────
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
      disposableIncome,
      emiToIncomeRatio: `${emiToIncomeRatio}%`,
      overallProgressPercent:
        totalOriginalDebt > 0
          ? parseFloat(
              ((totalAmountPaid / totalOriginalDebt) * 100).toFixed(1)
            )
          : 0,
      highestInterestLiability,
      hasHighInterestDebt: activeEnriched.some((l) => l.isHighInterest),
      hasDangerousEMI: activeEnriched.some((l) => l.isDangerous),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE PROFILE  –  POST /api/profile/complete
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One-time onboarding. Creates the financial profile and optionally bulk-creates
 * any existing liabilities the user wants to declare upfront.
 * Everything is wrapped in a single session — either all succeeds or all rolls back.
 * Marks isProfileCompleted = true on the User document.
 *
 * Body:
 *  persona              "Student" | "Salaried" | "Freelancer"   (required)
 *  monthlyIncome        number                                   (required)
 *  currentBankBalance   number                                   (required)
 *  riskTolerance?       "Low" | "Medium" | "High"
 *  salaryDay?           1–31
 *  emergencySavings?    number
 *  financialGoals?      { title, targetAmount, currentProgress?, deadline? }[]
 *  liabilities?         {                                        (optional array)
 *    name               string
 *    type?              "EMI" | "Loan" | "Credit Card" | "BNPL" | "Other"
 *    totalPrincipal     number
 *    remainingBalance   number
 *    interestRate       number
 *    emiAmount          number
 *    totalMonthsDuration number
 *    dueDate            1–31
 *    minimumMonthlyPayment? number
 *    monthsPaid?        number
 *    startDate?         ISO date string
 *    autoDebit?         boolean
 *  }[]
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
      liabilities: initialLiabilities,
    } = req.body;

    if (!persona || monthlyIncome == null || currentBankBalance == null) {
      res.status(400).json({
        message: "persona, monthlyIncome and currentBankBalance are required.",
      });
      return;
    }

    // Validate each liability entry before touching the DB
    if (Array.isArray(initialLiabilities) && initialLiabilities.length > 0) {
      for (let i = 0; i < initialLiabilities.length; i++) {
        const l = initialLiabilities[i];
        if (
          !l.name ||
          l.totalPrincipal == null ||
          l.remainingBalance == null ||
          l.interestRate == null ||
          l.emiAmount == null ||
          !l.totalMonthsDuration ||
          !l.dueDate
        ) {
          res.status(400).json({
            message: `liabilities[${i}] is missing required fields: name, totalPrincipal, remainingBalance, interestRate, emiAmount, totalMonthsDuration, dueDate.`,
          });
          return;
        }
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Create financial profile
      const [profile] = await FinancialProfileModel.create(
        [
          {
            userId,
            persona,
            monthlyIncome,
            currentBankBalance,
            riskTolerance: riskTolerance ?? "Medium",
            salaryDay: salaryDay ?? 1,
            emergencySavings: emergencySavings ?? 0,
            financialGoals: financialGoals ?? [],
          },
        ],
        { session }
      );

      // 2. Bulk-insert initial liabilities if provided
      if (Array.isArray(initialLiabilities) && initialLiabilities.length > 0) {
        const liabilityDocs = initialLiabilities.map((l: any) => {
          const now = new Date();
          const nextDue = new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth() + (now.getUTCDate() > l.dueDate ? 1 : 0),
              l.dueDate
            )
          );

          return {
            userId,
            name: l.name,
            type: l.type ?? "EMI",
            totalPrincipal: l.totalPrincipal,
            remainingBalance: l.remainingBalance,
            interestRate: l.interestRate,
            emiAmount: l.emiAmount,
            minimumMonthlyPayment: l.minimumMonthlyPayment ?? l.emiAmount,
            monthsPaid: l.monthsPaid ?? 0,
            totalMonthsDuration: l.totalMonthsDuration,
            dueDate: l.dueDate,
            nextDueDate: nextDue,
            startDate: l.startDate ? new Date(l.startDate) : new Date(),
            autoDebit: l.autoDebit ?? true,
            loanStatus: "Active",
          };
        });

        await LiabilityModel.insertMany(liabilityDocs, { session });
      }

      // 3. Mark user as onboarded
      await UserModel.findByIdAndUpdate(
        userId,
        { isProfileCompleted: true },
        { session }
      );

      await session.commitTransaction();

      // 4. Build response payload (reads committed data)
      const liabilities = await buildLiabilityPayload(userId, monthlyIncome);

      res.status(201).json({
        message: "Profile completed successfully.",
        profile,
        liabilities,
        financialSummary: {
          monthlyIncome,
          currentBankBalance,
          emergencySavings: emergencySavings ?? 0,
          totalFinancialGoals: (financialGoals ?? []).length,
          ...liabilities.summary, // disposableIncome lives here
        },
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE  –  PATCH /api/profile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates any subset of profile fields.
 *
 * Body (all optional):
 *  persona | monthlyIncome | currentBankBalance | riskTolerance |
 *  salaryDay | emergencySavings | financialGoals
 */
export const updateProfile = AsyncHandler(
  async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.id);

    const allowedFields = [
      "persona",
      "monthlyIncome",
      "currentBankBalance",
      "riskTolerance",
      "salaryDay",
      "emergencySavings",
      "financialGoals",
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ message: "No valid fields provided for update." });
      return;
    }

    const profile = await FinancialProfileModel.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!profile) {
      res.status(404).json({ message: "Profile not found." });
      return;
    }

    // Always compute fresh — never stored
    const disposableIncome = await computeDisposableIncome(
      userId,
      profile.monthlyIncome
    );

    res.status(200).json({
      message: "Profile updated.",
      profile,
      disposableIncome,
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET USER DETAILS  –  GET /api/profile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full profile page payload:
 *
 *  user              — name, email (no password)
 *  profile           — financial profile document (no disposableIncome field)
 *  liabilities
 *    .active         — enriched active liabilities (interestRate desc)
 *    .completed      — completed liabilities (most recent first)
 *    .byType         — active grouped by type
 *    .summary        — aggregates + disposableIncome (computed) + danger flags
 *  financialSummary  — flat block for dashboard header cards
 */
export const getUserDetails = AsyncHandler(
  async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.id);

    const [user, profile] = await Promise.all([
      UserModel.findById(userId).select("-password"),
      FinancialProfileModel.findOne({ userId }),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (!profile) {
      res.status(404).json({
        message: "Financial profile not found. Please complete your profile.",
      });
      return;
    }

    const liabilities = await buildLiabilityPayload(
      userId,
      profile.monthlyIncome
    );

    res.status(200).json({
      user,
      profile,
      liabilities,
      financialSummary: {
        monthlyIncome: profile.monthlyIncome,
        currentBankBalance: profile.currentBankBalance,
        emergencySavings: profile.emergencySavings,
        totalFinancialGoals: profile.financialGoals?.length ?? 0,
        goalsProgress: profile.financialGoals?.map((g) => ({
          _id: g._id,
          title: g.title,
          targetAmount: g.targetAmount,
          currentProgress: g.currentProgress ?? 0,
          progressPercent:
            g.targetAmount > 0
              ? parseFloat(
                  (
                    ((g.currentProgress ?? 0) / g.targetAmount) *
                    100
                  ).toFixed(1)
                )
              : 0,
          deadline: g.deadline ?? null,
        })),
        ...liabilities.summary, // disposableIncome + all debt aggregates
      },
    });
  }
);