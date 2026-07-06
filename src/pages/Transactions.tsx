import { useMemo, useState } from 'react'
import { useAppData } from '../lib/AppDataContext'
import { TransactionRow } from '../components/TransactionRow'
import type { TransactionType } from '../types'

export function Transactions() {
  const { transactions, categories, deleteTransaction, updateTransaction } = useAppData()
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => filterType === 'all' || t.type === filterType)
      .filter((t) => filterCategory === 'all' || t.categoryId === filterCategory)
      .filter((t) => !search || t.note.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
  }, [transactions, filterType, filterCategory, search])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const t of filtered) {
      const list = map.get(t.date) ?? []
      list.push(t)
      map.set(t.date, list)
    }
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-4 text-xl font-semibold">History</h1>

      <div className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'expense', 'income', 'exchange'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs capitalize ${
                filterType === t
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-800 text-slate-400'
              }`}
            >
              {t}
            </button>
          ))}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="shrink-0 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">No transactions found.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, list]) => (
            <div key={date}>
              <p className="mb-1.5 text-xs font-medium text-slate-500">{date}</p>
              <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
                {list.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    category={categories.find((c) => c.id === t.categoryId)}
                    onDelete={deleteTransaction}
                    onSettle={(id) => updateTransaction(id, { settled: true })}
                    onSave={updateTransaction}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
