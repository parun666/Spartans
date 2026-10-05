import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/[0-9]/)
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(128) });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/[0-9]/) });
export const profileSchema = z.object({ name: z.string().min(2).max(80), email: z.string().email(), currency: z.string().length(3), timezone: z.string().min(1).max(64), preferences: z.record(z.string()).optional() });

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive().finite(),
  currency: z.string().length(3).default("INR"),
  categoryId: z.string().min(1),
  description: z.string().min(1).max(200),
  notes: z.string().max(1000).optional().default(""),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
});
export const categorySchema = z.object({ name: z.string().min(1).max(60), kind: z.enum(["INCOME", "EXPENSE", "BOTH"]), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#64748b") });
export const budgetSchema = z.object({ categoryId: z.string().min(1), limit: z.number().positive().finite(), month: z.string().regex(/^\d{4}-\d{2}$/), currency: z.string().length(3).default("INR") });
export const investmentSchema = z.object({ name: z.string().min(1).max(120), type: z.enum(["EQUITY", "MUTUAL_FUND", "FD", "CRYPTO", "OTHER"]), invested: z.number().min(0).finite(), current: z.number().min(0).finite(), currency: z.string().length(3).default("INR") });
export const sipSchema = z.object({ name: z.string().min(1).max(120), monthly: z.number().positive().finite(), annualRate: z.number().min(0).max(100), years: z.number().int().min(1).max(50), currency: z.string().length(3).default("INR") });
export const goalSchema = z.object({ name: z.string().min(1).max(120), target: z.number().positive().finite(), saved: z.number().min(0).finite().default(0), currency: z.string().length(3).default("INR"), deadline: z.string().optional() });
export const aiKeySchema = z.object({ apiKey: z.string().min(8).max(256), provider: z.string().min(1).max(40).default("openai"), model: z.string().min(1).max(80).default("gpt-4o-mini") });
export const roleSchema = z.object({ role: z.enum(["USER", "ADMIN"]) });
export const deleteAccountSchema = z.object({ password: z.string().min(1) });
