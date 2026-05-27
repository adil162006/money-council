import type { Request, Response } from "express";
import mongoose from "mongoose";
import { TransactionModel } from "../models/Transaction.model";
import { LiabilityModel } from "../models/liability.model";
import { FinancialProfileModel } from "../models/financialProfile.model";
import { computeDisposableIncome } from "./user.controller";
import AsyncHandler from "../lib/AsyncHandler";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the UTC midnight Date for a YYYY-MM-DD string or Date object.
 * Every day-boundary comparison must go through this so timezones never bite.
 */
function toUTCDay(input: string | Date): Date {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

/**
 * Mutates the profile's currentBankBalance in memory.
 * Caller is responsible for calling profile.save().
 */
function applyTransactionToBalance(
  profile: NonNullable<
    Awaited<ReturnType<typeof FinancialProfileModel.findOne>>
  >,
  type: "Income" | "Expense",
  amount: number
) {
  if (type === "Income") {
    profile.currentBankBalance += amount;
  } else {
    profile.currentBankBalance = Math.max(
      0,
      profile.currentBankBalance - amount
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET TRANSACTIONS BY DATE  –  GET /api/transactions?date=YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all transactions for the authenticated user on a given calendar date.
 *
 * Query params:
 *   date?  YYYY-MM-DD  (defaults to today)
 *
 * Response:
 *   date         string
 *   message?     present only when no transactions exist
 *   transactions Transaction[]  (liabilityId populated with name/type/interestRate)
 *   summary      { totalIncome, totalExpense, netFlow }
 */
export const getTransactionsByDate = AsyncHandler(
  async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.id);

    const rawDate =
      (req.query.date as string) ||
      new Date().toISOString().split("T")[0];

    const dayStart = toUTCDay(rawDate!);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const transactions = await TransactionModel.find({
      userId,
      dateOf: { $gte: dayStart, $lt: dayEnd },
    })
      .populate("liabilityId", "name type interestRate")
      .sort({ createdAt: -1 });

    if (transactions.length === 0) {
      res.status(200).json({
        date: rawDate,
        message: "There are no transactions on that day.",
        transactions: [],
        summary: { totalIncome: 0, totalExpense: 0, netFlow: 0 },
      });
      return;
    }

    let totalIncome = 0;
    let totalExpense = 0;
    for (const t of transactions) {
      if (t.type === "Income") totalIncome += t.amount;
      else totalExpense += t.amount;
    }

    res.status(200).json({
      date: rawDate,
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        netFlow: totalIncome - totalExpense,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ADD TRANSACTION  –  POST /api/transactions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds a new transaction. Three cases handled atomically via a Mongoose session:
 *
 * CASE 1 – Regular income / expense
 *   Standard manual entry. Bank balance is updated.
 *
 * CASE 2a – New liability + first payment  (category === "EMI / Loan" + newLiability)
 *   Creates the Liability doc, records the opening transaction,
 *   and recalculates disposableIncome.
 *
 * CASE 2b – Payment against existing liability  (category === "EMI / Loan" + liabilityId)
 *   Reduces remainingBalance, increments monthsPaid, advances nextDueDate.
 *   Marks loanStatus "Completed" when fully settled and recalculates
 *   disposableIncome.
 *
 * Body:
 *   type           "Income" | "Expense"
 *   title          string
 *   amount         number
 *   category       TransactionCategory
 *   notes?         string
 *   date?          YYYY-MM-DD  (defaults to today)
 *   source?        "Manual" | "Automated"
 *   liabilityId?   ObjectId string       — existing liability payment
 *   newLiability?  {                     — brand-new liability
 *     name, type?, totalPrincipal, remainingBalance, interestRate,
 *     emiAmount, totalMonthsDuration, dueDate,
 *     minimumMonthlyPayment?, startDate?, autoDebit?
 *   }
 */
export const addTransaction = AsyncHandler(
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = new mongoose.Types.ObjectId(req.id);

      const {
        type,
        title,
        amount,
        category,
        notes,
        date,
        source,
        liabilityId,
        newLiability,
      } = req.body;

      // ── Basic validation ─────────────────────────────────────────────────
      if (!type || !title || amount == null || !category) {
        await session.abortTransaction();
        res.status(400).json({
          message: "type, title, amount and category are required.",
        });
        return;
      }

      if (!["Income", "Expense"].includes(type)) {
        await session.abortTransaction();
        res
          .status(400)
          .json({ message: "type must be 'Income' or 'Expense'." });
        return;
      }

      if (amount <= 0) {
        await session.abortTransaction();
        res.status(400).json({ message: "amount must be greater than 0." });
        return;
      }

      const profile = await FinancialProfileModel.findOne({ userId }).session(
        session
      );
      if (!profile) {
        await session.abortTransaction();
        res.status(404).json({
          message:
            "Financial profile not found. Please complete your profile first.",
        });
        return;
      }

      const transactionDate = date ? toUTCDay(date) : toUTCDay(new Date());
      let resolvedLiabilityId: mongoose.Types.ObjectId | null = null;

      // ── CASE 2a: Create new liability + record first payment ─────────────
      if (category === "EMI / Loan" && newLiability) {
        const {
          name,
          type: lType,
          totalPrincipal,
          remainingBalance,
          interestRate,
          emiAmount,
          totalMonthsDuration,
          dueDate,
          minimumMonthlyPayment,
          startDate,
          autoDebit,
        } = newLiability;

        if (
          !name ||
          totalPrincipal == null ||
          remainingBalance == null ||
          interestRate == null ||
          emiAmount == null ||
          !totalMonthsDuration ||
          !dueDate
        ) {
          await session.abortTransaction();
          res.status(400).json({
            message:
              "newLiability requires: name, totalPrincipal, remainingBalance, " +
              "interestRate, emiAmount, totalMonthsDuration, dueDate.",
          });
          return;
        }

        // Derive nextDueDate from dueDate (day-of-month)
        const now = new Date();
        const nextDue = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() + (now.getUTCDate() > dueDate ? 1 : 0),
            dueDate
          )
        );

        const [createdLiability] = await LiabilityModel.create(
          [
            {
              userId,
              name,
              type: lType ?? "EMI",
              totalPrincipal,
              remainingBalance,
              interestRate,
              emiAmount,
              minimumMonthlyPayment: minimumMonthlyPayment ?? emiAmount,
              totalMonthsDuration,
              dueDate,
              nextDueDate: nextDue,
              startDate: startDate ? new Date(startDate) : new Date(),
              autoDebit: autoDebit ?? true,
              monthsPaid: 0,
              loanStatus: "Active",
            },
          ],
          { session }
        );

        resolvedLiabilityId =
          createdLiability!._id as mongoose.Types.ObjectId;

        // Commit session before computing disposableIncome (needs its own query)
        await session.commitTransaction();

        const [updatedProfile, disposableIncome] = await Promise.all([
          FinancialProfileModel.findOne({ userId }),
          computeDisposableIncome(userId, profile.monthlyIncome),
        ]);

        res.status(201).json({
          message: "Liability created and transaction recorded.",
          liabilityId: resolvedLiabilityId,
          currentBankBalance: updatedProfile?.currentBankBalance,
          disposableIncome,
        });
        return;
      }

      // ── CASE 2b: Payment against an existing liability ───────────────────
      if (category === "EMI / Loan" && liabilityId) {
        if (!mongoose.Types.ObjectId.isValid(liabilityId)) {
          await session.abortTransaction();
          res.status(400).json({ message: "Invalid liabilityId." });
          return;
        }

        const liability = await LiabilityModel.findOne({
          _id: liabilityId,
          userId,
        }).session(session);

        if (!liability) {
          await session.abortTransaction();
          res.status(404).json({ message: "Liability not found." });
          return;
        }

        if (liability.loanStatus === "Completed") {
          await session.abortTransaction();
          res
            .status(400)
            .json({ message: "This liability has already been completed." });
          return;
        }

        liability.remainingBalance = Math.max(
          0,
          liability.remainingBalance - amount
        );
        liability.monthsPaid = (liability.monthsPaid ?? 0) + 1;

        if (liability.nextDueDate) {
          const nd = new Date(liability.nextDueDate);
          nd.setUTCMonth(nd.getUTCMonth() + 1);
          liability.nextDueDate = nd;
        }

        const isNowComplete =
          liability.remainingBalance === 0 ||
          liability.monthsPaid >= liability.totalMonthsDuration;

        if (isNowComplete) {
          liability.loanStatus = "Completed";
        }

        await liability.save({ session });
        resolvedLiabilityId = liability._id as mongoose.Types.ObjectId;

        // If completed, commit then compute disposableIncome fresh
        if (isNowComplete) {
          await session.commitTransaction();

          const [updatedProfile, disposableIncome] = await Promise.all([
            FinancialProfileModel.findOne({ userId }),
            computeDisposableIncome(userId, profile.monthlyIncome),
          ]);

          res.status(201).json({
            message: "EMI payment recorded. Liability fully settled.",
            transaction: { userId, type, title, amount, category },
            currentBankBalance: updatedProfile?.currentBankBalance,
            disposableIncome,
          });
          return;
        }
      }

      // ── Create the transaction document (Cases 1 & 2b ongoing) ───────────
      const [transaction] = await TransactionModel.create(
        [
          {
            userId,
            type,
            title,
            amount,
            category,
            notes: notes ?? null,
            liabilityId: resolvedLiabilityId,
            source: source ?? "Manual",
            dateOf: transactionDate,
          },
        ],
        { session }
      );

      applyTransactionToBalance(profile, type, amount);
      await profile.save({ session });
      await session.commitTransaction();

      const disposableIncome = await computeDisposableIncome(
        userId,
        profile.monthlyIncome
      );

      res.status(201).json({
        message: "Transaction added successfully.",
        transaction,
        currentBankBalance: profile.currentBankBalance,
        disposableIncome,
      });
    } catch (err) {
      await session.abortTransaction();
      throw err; // Re-throw so AsyncHandler forwards it to Express error middleware
    } finally {
      session.endSession();
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULER HELPERS  (plain async — called by cron, not Express routes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auto-credits monthly salary for all Salaried users whose salaryDay === today.
 * Cron: "1 0 * * *"  (00:01 daily)
 *
 * Idempotent — skips users already credited today.
 */
export const scheduleSalaryCredit = async (): Promise<void> => {
  const todayUTC = new Date();
  const todayDay = todayUTC.getUTCDate();
  const dayStart = toUTCDay(todayUTC);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  try {
    const profiles = await FinancialProfileModel.find({
      persona: "Salaried",
      salaryDay: todayDay,
    });

    for (const profile of profiles) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const alreadyCredited = await TransactionModel.findOne({
          userId: profile.userId,
          source: "Automated",
          category: "Salary",
          dateOf: { $gte: dayStart, $lt: dayEnd },
        }).session(session);

        if (alreadyCredited) {
          await session.abortTransaction();
          continue;
        }

        await TransactionModel.create(
          [
            {
              userId: profile.userId,
              type: "Income",
              title: "Monthly Salary",
              amount: profile.monthlyIncome,
              category: "Salary",
              source: "Automated",
              dateOf: dayStart,
            },
          ],
          { session }
        );

        profile.currentBankBalance += profile.monthlyIncome;
        await profile.save({ session });
        await session.commitTransaction();

        console.log(`[Scheduler] Salary credited for user ${profile.userId}`);
      } catch (err) {
        await session.abortTransaction();
        console.error(
          `[Scheduler] Salary credit failed for user ${profile.userId}:`,
          err
        );
      } finally {
        session.endSession();
      }
    }
  } catch (err) {
    console.error("[Scheduler] scheduleSalaryCredit failed:", err);
  }
};

/**
 * Auto-debits active EMI / Loan payments for liabilities whose dueDate === today.
 * Cron: "5 0 * * *"  (00:05 daily)
 *
 * Idempotent — skips liabilities already debited today.
 * Marks loanStatus "Completed" and recalculates disposableIncome when settled.
 */
export const scheduleEMIDebit = async (): Promise<void> => {
  const todayUTC = new Date();
  const todayDay = todayUTC.getUTCDate();
  const dayStart = toUTCDay(todayUTC);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  try {
    const activeLiabilities = await LiabilityModel.find({
      dueDate: todayDay,
      loanStatus: "Active",
      autoDebit: true,
    });

    for (const liability of activeLiabilities) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const alreadyDebited = await TransactionModel.findOne({
          userId: liability.userId,
          liabilityId: liability._id,
          source: "Automated",
          dateOf: { $gte: dayStart, $lt: dayEnd },
        }).session(session);

        if (alreadyDebited) {
          await session.abortTransaction();
          continue;
        }

        const profile = await FinancialProfileModel.findOne({
          userId: liability.userId,
        }).session(session);

        if (!profile) {
          await session.abortTransaction();
          continue;
        }

        await TransactionModel.create(
          [
            {
              userId: liability.userId,
              type: "Expense",
              title: `EMI – ${liability.name}`,
              amount: liability.emiAmount,
              category: "EMI / Loan",
              liabilityId: liability._id,
              source: "Automated",
              dateOf: dayStart,
            },
          ],
          { session }
        );

        profile.currentBankBalance = Math.max(
          0,
          profile.currentBankBalance - liability.emiAmount
        );

        liability.remainingBalance = Math.max(
          0,
          liability.remainingBalance - liability.emiAmount
        );
        liability.monthsPaid = (liability.monthsPaid ?? 0) + 1;

        const nd = liability.nextDueDate
          ? new Date(liability.nextDueDate)
          : new Date(dayStart);
        nd.setUTCMonth(nd.getUTCMonth() + 1);
        liability.nextDueDate = nd;

        const isNowComplete =
          liability.remainingBalance === 0 ||
          liability.monthsPaid >= liability.totalMonthsDuration;

        if (isNowComplete) liability.loanStatus = "Completed";

        await liability.save({ session });
        await profile.save({ session });
        await session.commitTransaction();

        if (isNowComplete) {
          await computeDisposableIncome(liability.userId.toString(), profile.monthlyIncome);
        }

        console.log(
          `[Scheduler] EMI debited: ${liability.name} for user ${liability.userId}`
        );
      } catch (err) {
        await session.abortTransaction();
        console.error(
          `[Scheduler] EMI debit failed for liability ${liability._id}:`,
          err
        );
      } finally {
        session.endSession();
      }
    }
  } catch (err) {
    console.error("[Scheduler] scheduleEMIDebit failed:", err);
  }
};