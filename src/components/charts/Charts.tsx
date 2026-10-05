"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export function IncomeExpenseBar({ data }: { data: { month: string; income: number; expense: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><BarChart data={data}><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Bar dataKey="income" fill="#22c55e" /><Bar dataKey="expense" fill="#ef4444" /></BarChart></ResponsiveContainer>;
}
export function MonthlySpendLine({ data }: { data: { month: string; expense: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><LineChart data={data}><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="expense" stroke="#0ea5e9" /></LineChart></ResponsiveContainer>;
}
export function MonthlySavingsLine({ data }: { data: { month: string; savings: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><LineChart data={data}><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="savings" stroke="#22c55e" name="Savings" /></LineChart></ResponsiveContainer>;
}
export function CategorySplitPie({ data }: { data: { name: string; value: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>;
}
export function BudgetUseBar({ data }: { data: { name: string; used: number; limit: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><BarChart data={data}><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="used" fill="#f59e0b" /><Bar dataKey="limit" fill="#cbd5e1" /></BarChart></ResponsiveContainer>;
}
export function AllocationPie({ data }: { data: { name: string; value: number }[] }) {
  return <CategorySplitPie data={data} />;
}
export function MonthlyMultiBar({ data }: { data: { month: string; income: number; expense: number }[] }) {
  return <IncomeExpenseBar data={data} />;
}
