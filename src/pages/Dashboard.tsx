import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { useAppData } from '../lib/AppDataContext'
import { formatMoney, localMonthString } from '../lib/format'
import { TransactionRow } from '../components/TransactionRow'

function monthKey(iso: string) {
  return iso.slice(0, 7) // yyyy-mm
}

export function Dashboard() {
  const { transactions, categories, settings, toBaseCurrency } = useAppData()
  const [month, setMonth] = useState(() => localMonthString())

  const monthTx = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === month),
    [transactions, month]
  )

  const income = monthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + toBaseCurrency(t.amount, t.currency), 0)
  const expense = monthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + toBaseCurrency(t.amount, t.currency), 0)
  const net = income - expense

  const owedToMe = transactions
    .filter((t) => t.owedAmount != null && t.owedAmount > 0 && !t.settled)
    .reduce((sum, t) => sum + toBaseCurrency(t.owedAmount!, t.currency), 0)

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of monthTx) {
      if (t.type !== 'expense') continue
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + toBaseCurrency(t.amount, t.currency))
    }
    return [...map.entries()]
      .map(([categoryId, value]) => {
        const cat = categories.find((c) => c.id === categoryId)
        return { categoryId, value, name: cat?.name ?? 'Other', color: cat?.color ?? '#64748b' }
      })
      .sort((a, b) => b.value - a.value)
  }, [monthTx, categories])

  const last6Months = useMemo(() => {
    const months: { key: string; label: string; income: number; expense: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = localMonthString(d)
      const label = d.toLocaleDateString(undefined, { month: 'short' })
      const tx = transactions.filter((t) => monthKey(t.date) === key)
      const inc = tx.filter((t) => t.type === 'income').reduce((s, t) => s + toBaseCurrency(t.amount, t.currency), 0)
      const exp = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + toBaseCurrency(t.amount, t.currency), 0)
      months.push({ key, label, income: inc, expense: exp })
    }
    return months
  }, [transactions])

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200"
        />
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 to-slate-900 border border-slate-800 p-5 mb-4">
        <p className="text-sm text-slate-400">Net this month</p>
        <p className={`text-3xl font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatMoney(net, settings.baseCurrency)}
        </p>
        <div className="mt-4 flex justify-between text-sm">
          <div>
            <p className="text-slate-400">Income</p>
            <p className="font-semibold text-emerald-400">{formatMoney(income, settings.baseCurrency)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400">Expenses</p>
            <p className="font-semibold text-rose-400">{formatMoney(expense, settings.baseCurrency)}</p>
          </div>
        </div>
        {owedToMe > 0 && (
          <p className="mt-3 border-t border-slate-800 pt-2 text-sm text-amber-400">
            Friends owe you ≈ {formatMoney(owedToMe, settings.baseCurrency)}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 mb-4">
        <h2 className="mb-2 text-sm font-medium text-slate-300">Spending by category</h2>
        {byCategory.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No expenses recorded this month.</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {byCategory.map((entry) => (
                      <Cell key={entry.categoryId} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatMoney(Number(v), settings.baseCurrency)}
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2 text-sm">
              {byCategory.slice(0, 5).map((c) => (
                <li key={c.categoryId} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 truncate">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="truncate text-slate-300">{c.name}</span>
                  </span>
                  <span className="shrink-0 font-medium text-slate-200">
                    {formatMoney(c.value, settings.baseCurrency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 mb-4">
        <h2 className="mb-2 text-sm font-medium text-slate-300">Last 6 months</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last6Months}>
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => formatMoney(Number(v), settings.baseCurrency)}
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-2 text-sm font-medium text-slate-300">Recent transactions</h2>
        {monthTx.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Nothing here yet.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {monthTx.slice(0, 5).map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                category={categories.find((c) => c.id === t.categoryId)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
