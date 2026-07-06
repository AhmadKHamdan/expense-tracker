import { ArrowLeftRight, Trash2 } from 'lucide-react'
import type { Category, Transaction } from '../types'
import { formatMoney } from '../lib/format'
import { CategoryIcon } from './CategoryIcon'

interface Props {
  transaction: Transaction
  category?: Category
  onDelete?: (id: string) => void
  onSettle?: (id: string) => void
}

export function TransactionRow({ transaction: t, category: cat, onDelete, onSettle }: Props) {
  const isExchange = t.type === 'exchange'
  const rate = isExchange && t.toAmount ? t.toAmount / t.amount : null

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
