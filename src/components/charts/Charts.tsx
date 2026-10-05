"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const COLORS = ["#e98b42", "#63d4a0", "#f2b56b", "#cf694a", "#b47a4d", "#85ba91", "#d8995d", "#a95938"];

export function IncomeExpenseBar({ data }: { data: { month: string; income: number; expense: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><BarChart data={data}><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Bar dataKey="income" fill="#63d4a0" radius={[5, 5, 0, 0]} /><Bar dataKey="expense" fill="#e98b42" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>;
}
export function MonthlySpendLine({ data }: { data: { month: string; expense: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><LineChart data={data}><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="expense" stroke="#e98b42" strokeWidth={3} /></LineChart></ResponsiveContainer>;
}
export function MonthlySavingsLine({ data }: { data: { month: string; savings: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><LineChart data={data}><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="savings" stroke="#63d4a0" strokeWidth={3} name="Savings" /></LineChart></ResponsiveContainer>;
}
export function CategorySplitPie({ data }: { data: { name: string; value: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>;
}
export function CategorySpendBar({ data }: { data: { name: string; value: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><BarChart data={data} layout="vertical" margin={{ left: 8, right: 20 }}><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} /><Tooltip /><Bar dataKey="value" name="Amount" fill="#e98b42" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer>;
}
export function BudgetUseBar({ data }: { data: { name: string; used: number; limit: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><BarChart data={data}><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="used" fill="#e98b42" radius={[5, 5, 0, 0]} /><Bar dataKey="limit" fill="#796352" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>;
}
export function AllocationPie({ data }: { data: { name: string; value: number }[] }) {
  return <CategorySpendBar data={data} />;
}
export function MonthlyMultiBar({ data }: { data: { month: string; income: number; expense: number }[] }) {
  return <IncomeExpenseBar data={data} />;
}
