import { useState } from 'react'
import { ArrowLeftRight, Check, Pencil, Trash2, X } from 'lucide-react'
import type { Category, Transaction } from '../types'
import { formatMoney } from '../lib/format'
import { CategoryIcon } from './CategoryIcon'

interface Props {
  transaction: Transaction
  category?: Category
  onDelete?: (id: string) => void
  onSettle?: (id: string) => void
  onSave?: (id: string, patch: Partial<Transaction>) => void
}

export function TransactionRow({ transaction: t, category: cat, onDelete, onSettle, onSave }: Props) {
  const isExchange = t.type === 'exchange'
  const isSplit = t.totalAmount != null && t.owedAmount != null
  const rate = isExchange && t.toAmount ? t.toAmount / t.amount : null

  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [totalAmount, setTotalAmount] = useState('')

  function startEdit() {
    setNote(t.note)
    setAmount(String(t.amount))
    setToAmount(t.toAmount != null ? String(t.toAmount) : '')
    setTotalAmount(t.totalAmount != null ? String(t.totalAmount) : '')
    setEditing(true)
  }

  function save() {
    const a = parseFloat(amount)
    if (!a || a <= 0) return
    const patch: Partial<Transaction> = { note, amount: a }
    if (isExchange) {
      const ta = parseFloat(toAmount)
      if (!ta || ta <= 0) return
      patch.toAmount = ta
    }
    if (isSplit) {
      const total = parseFloat(totalAmount)
      if (!total || total < a) return
      patch.totalAmount = total
      patch.owedAmount = total - a
    }
    onSave?.(t.id, patch)
    setEditing(false)
  }

  if (editing) {
    const inputCls =
      'w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100 placeholder:text-slate-600'
    return (
      <li className="space-y-2 px-3 py-3">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Name"
          className={inputCls}
        />
        <div className="flex gap-2">
          {isSplit && (
            <div className="flex-1">
              <label className="mb-0.5 block text-[10px] text-slate-500">Total paid ({t.currency})</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className={inputCls}
              />
            </div>
          )}
          <div className="flex-1">
            <label className="mb-0.5 block text-[10px] text-slate-500">
              {isExchange ? `You give (${t.currency})` : isSplit ? `My share (${t.currency})` : `Amount (${t.currency})`}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
            />
          </div>
          {isExchange && (
            <div className="flex-1">
              <label className="mb-0.5 block text-[10px] text-slate-500">You receive ({t.toCurrency})</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                className={inputCls}
              />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500/20 py-1.5 text-xs font-medium text-emerald-300"
          >
            <Check size={13} /> Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-800 py-1.5 text-xs font-medium text-slate-400"
          >
            <X size={13} /> Cancel
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: isExchange ? '#38bdf822' : `${cat?.color ?? '#64748b'}22` }}
      >
        {isExchange ? (
          <ArrowLeftRight size={18} color="#38bdf8" />
        ) : (
          <CategoryIcon name={cat?.icon ?? 'Circle'} size={18} color={cat?.color ?? '#64748b'} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-200">
          {t.note || (isExchange ? 'Currency exchange' : cat?.name)}
        </p>
        <p className="truncate text-xs text-slate-500">
          {isExchange && rate
            ? `1 ${t.currency} = ${rate.toFixed(3)} ${t.toCurrency}`
            : cat?.name}
        </p>
        {t.owedAmount != null && t.owedAmount > 0 && (
          <span className="mt-0.5 inline-flex items-center gap-1.5">
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                t.settled ? 'bg-slate-800 text-slate-500' : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              {t.settled
                ? `Repaid ${formatMoney(t.owedAmount, t.currency)}`
                : `Friend owes ${formatMoney(t.owedAmount, t.currency)}`}
            </span>
            {!t.settled && onSettle && (
              <button
                onClick={() => onSettle(t.id)}
                className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400"
              >
                Mark repaid
              </button>
            )}
          </span>
        )}
      </span>
      <span className="shrink-0 text-right">
        {isExchange ? (
          <>
            <p className="text-sm font-medium text-rose-400">-{formatMoney(t.amount, t.currency)}</p>
            <p className="text-sm font-medium text-emerald-400">
              +{formatMoney(t.toAmount ?? 0, t.toCurrency ?? t.currency)}
            </p>
          </>
        ) : (
          <>
            <p className={`font-medium ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {t.type === 'income' ? '+' : '-'}
              {formatMoney(t.amount, t.currency)}
            </p>
            {t.totalAmount != null && t.totalAmount !== t.amount && (
              <p className="text-[10px] text-slate-500">of {formatMoney(t.totalAmount, t.currency)} paid</p>
            )}
          </>
        )}
      </span>
      {onSave && (
        <button
          onClick={startEdit}
          className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:bg-slate-800 hover:text-sky-400"
          aria-label="Edit transaction"
        >
          <Pencil size={16} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(t.id)}
          className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:bg-slate-800 hover:text-rose-400"
          aria-label="Delete transaction"
        >
          <Trash2 size={16} />
        </button>
      )}
    </li>
  )
}
