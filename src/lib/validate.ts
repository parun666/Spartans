import { z } from "zod";
import { MAX_AMOUNT_PAISE, parseAmountToPaise } from "@/lib/money";

const moneyAmountSchema = z.number()
  .finite()
  .min(0)
  .max(MAX_AMOUNT_PAISE / 100)
  .refine((value) => parseAmountToPaise(value) !== null, "Amount must use at most two decimal places");
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");
const dateSchema = z.string().datetime().or(calendarDateSchema);

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/[0-9]/)
}).strict();
export const loginSchema = z.object({ email: z.string().email().transform((value) => value.toLowerCase()), password: z.string().min(1).max(128) }).strict();
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/[0-9]/) }).strict();
export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().transform((value) => value.toLowerCase()),
  currency: z.string().regex(/^[A-Z]{3}$/),
  timezone: z.string().min(1).max(64),
  preferences: z.record(z.string().max(256)).optional()
}).strict();

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: moneyAmountSchema.refine((value) => value > 0),
  currency: z.string().regex(/^[A-Z]{3}$/).default("INR"),
  categoryId: z.string().min(1),
  description: z.string().min(1).max(200),
  notes: z.string().max(1000).optional().default(""),
  date: dateSchema
}).strict();
export const categorySchema = z.object({
  name: z.string().min(1).max(60),
  kind: z.enum(["INCOME", "EXPENSE", "BOTH"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#64748b")
}).strict();
export const budgetSchema = z.object({
  categoryId: z.string().min(1),
  limit: moneyAmountSchema.refine((value) => value > 0),
  month: monthSchema,
  currency: z.string().regex(/^[A-Z]{3}$/).default("INR")
}).strict();
export const investmentSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["EQUITY", "MUTUAL_FUND", "FD", "CRYPTO", "OTHER"]),
  invested: moneyAmountSchema,
  current: moneyAmountSchema,
  currency: z.string().regex(/^[A-Z]{3}$/).default("INR")
}).strict();
export const sipSchema = z.object({
  name: z.string().min(1).max(120),
  monthly: moneyAmountSchema.refine((value) => value > 0),
  annualRate: z.number().finite().min(0).max(100),
  years: z.number().int().min(1).max(50),
  currency: z.string().regex(/^[A-Z]{3}$/).default("INR")
}).strict();
export const goalSchema = z.object({
  name: z.string().min(1).max(120),
  target: moneyAmountSchema.refine((value) => value > 0),
  saved: moneyAmountSchema.default(0),
  currency: z.string().regex(/^[A-Z]{3}$/).default("INR"),
  deadline: dateSchema.optional()
}).strict();
export const aiKeySchema = z.object({
  apiKey: z.string().min(8).max(256),
  provider: z.string().min(1).max(40).default("openai"),
  model: z.string().min(1).max(80).default("gpt-4o-mini")
}).strict();
export const aiChatSchema = z.object({
  message: z.string().min(1).max(2000),
  month: monthSchema.optional()
}).strict();
export const roleSchema = z.object({ role: z.enum(["USER", "ADMIN"]) }).strict();
export const deleteAccountSchema = z.object({ password: z.string().min(1).max(128) }).strict();
export const transactionListQuerySchema = z.object({
  q: z.string().max(200).default(""),
  type: z.enum(["", "INCOME", "EXPENSE"]).default(""),
  categoryId: z.string().max(64).default(""),
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
  minAmount: z.coerce.number().finite().min(0).max(MAX_AMOUNT_PAISE / 100).optional(),
  maxAmount: z.coerce.number().finite().min(0).max(MAX_AMOUNT_PAISE / 100).optional(),
  sort: z.enum(["date_desc", "date_asc", "amount_desc", "amount_asc"]).default("date_desc"),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
}).strict();
export const dashboardQuerySchema = z.object({
  months: z.enum(["1", "3", "6", "12"]).default("12").transform(Number)
}).strict();
export const sampleDataSchema = z.object({}).strict();
