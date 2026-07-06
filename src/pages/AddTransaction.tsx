import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, RefreshCw } from 'lucide-react'
import { useAppData } from '../lib/AppDataContext'
import { localDateString } from '../lib/format'
import type { TransactionType } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'

export function AddTransaction() {
  const { categories, settings, addTransaction } = useAppData()
  const navigate = useNavigate()

  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(settings.baseCurrency)
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => localDateString())

  // exchange fields
  const [toCurrency, setToCurrency] = useState(
    settings.currencies.find((c) => c !== settings.baseCurrency) ?? settings.baseCurrency
  )
  const [rate, setRate] = useState('')
  const [toAmount, setToAmount] = useState('')

  // split bill fields
  const [split, setSplit] = useState(false)
  const [myShare, setMyShare] = useState('')

  const filteredCategories = categories.filter((c) => c.type === type)

  function marketRate(from: string, to: string) {
    return (settings.rates[to] ?? 1) / (settings.rates[from] ?? 1)
  }

  function recompute(amountStr: string, rateStr: string) {
    const a = parseFloat(amountStr)
    const r = parseFloat(rateStr)
    setToAmount(a > 0 && r > 0 ? (a * r).toFixed(2) : '')
  }

  function handleAmountChange(v: string) {
    setAmount(v)
    if (type === 'exchange') recompute(v, rate)
  }

  function handleRateChange(v: string) {
    setRate(v)
    recompute(amount, v)
  }

  function handleToAmountChange(v: string) {
    setToAmount(v)
    const a = parseFloat(amount)
    const ta = parseFloat(v)
    if (a > 0 && ta > 0) setRate((ta / a).toFixed(4))
  }

  function applyMarketRate(from = currency, to = toCurrency) {
    const r = marketRate(from, to)
    setRate(r.toFixed(4))
    recompute(amount, r.toFixed(4))
  }

  function switchType(t: TransactionType) {
    setType(t)
    setCategoryId('')
    setSplit(false)
    if (t === 'exchange' && !rate) applyMarketRate()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!value || value <= 0) return

    if (type === 'exchange') {
      const ta = parseFloat(toAmount)
      if (!ta || ta <= 0 || currency === toCurrency) return
      addTransaction({
        type,
        amount: value,
        currency,
        toAmount: ta,
        toCurrency,
        categoryId: '',
        note,
        date,
      })
      navigate('/transactions')
      return
    }

    const cat = categoryId || filteredCategories[0]?.id
    if (!cat) return

    if (type === 'expense' && split) {
      const share = parseFloat(myShare)
      if (!share || share <= 0 || share > value) return
      addTransaction({
        type,
        amount: share,
        currency,
        categoryId: cat,
        note,
        date,
        totalAmount: value,
        owedAmount: value - share,
        settled: false,
      })
    } else {
      addTransaction({ type, amount: value, currency, categoryId: cat, note, date })
    }
    navigate('/')
  }

  const typeStyles: Record<TransactionType, string> = {
    expense: 'bg-rose-500/20 text-rose-300',
    income: 'bg-emerald-500/20 text-emerald-300',
    exchange: 'bg-sky-500/20 text-sky-300',
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-4 text-xl font-semibold">Add transaction</h1>

      <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-900 p-1">
        {(['expense', 'income', 'exchange'] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchType(t)}
            className={`rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
              type === t ? typeStyles[t] : 'text-slate-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-400">
              {type === 'exchange' ? 'You give' : split ? 'Total paid' : 'Amount'}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-lg text-slate-100 placeholder:text-slate-600"
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs text-slate-400">Currency</label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value)
                if (type === 'exchange') applyMarketRate(e.target.value, toCurrency)
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2.5 text-slate-100"
            >
              {settings.currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {type === 'exchange' && (
          <>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs text-slate-400">
                  Exchange rate (1 {currency} = ? {toCurrency})
                </label>
                <button
                  type="button"
                  onClick={() => applyMarketRate()}
                  className="flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-300"
                >
                  <RefreshCw size={11} /> Use market rate
                </button>
              </div>
              <input
                type="number"
                inputMode="decimal"
                step="0.0001"
                min="0"
                value={rate}
                onChange={(e) => handleRateChange(e.target.value)}
                placeholder="e.g. 3.55"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                Override this with the rate the shop or bank actually gave you.
              </p>
            </div>

            <div className="flex items-center justify-center text-slate-600">
              <ArrowDown size={18} />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-slate-400">You receive</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  value={toAmount}
                  onChange={(e) => handleToAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-lg text-slate-100 placeholder:text-slate-600"
                />
              </div>
              <div className="w-28">
                <label className="mb-1 block text-xs text-slate-400">Currency</label>
                <select
                  value={toCurrency}
                  onChange={(e) => {
                    setToCurrency(e.target.value)
                    applyMarketRate(currency, e.target.value)
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2.5 text-slate-100"
                >
                  {settings.currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {type !== 'exchange' && (
          <div>
            <label className="mb-1 block text-xs text-slate-400">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition-colors ${
                    (categoryId || filteredCategories[0]?.id) === c.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <CategoryIcon name={c.icon} size={18} color={c.color} />
                  <span className="truncate w-full text-center">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {type === 'expense' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <label className="flex items-center justify-between text-sm text-slate-300">
              Split bill (friend pays you back)
              <input
                type="checkbox"
                checked={split}
                onChange={(e) => setSplit(e.target.checked)}
                className="h-4 w-4 accent-emerald-500"
              />
            </label>
            {split && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-slate-400">My share ({currency})</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  value={myShare}
                  onChange={(e) => setMyShare(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600"
                />
                {parseFloat(amount) > 0 && parseFloat(myShare) > 0 && parseFloat(myShare) <= parseFloat(amount) && (
                  <p className="mt-1.5 text-[11px] text-amber-400">
                    Friend will owe you {(parseFloat(amount) - parseFloat(myShare)).toFixed(2)} {currency}. Only
                    your share counts as an expense.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-slate-400">Name (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={type === 'exchange' ? 'e.g. Cash exchange at shop' : 'e.g. Dinner with friends'}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
        >
          Save {type}
        </button>
      </form>
    </div>
  )
}
