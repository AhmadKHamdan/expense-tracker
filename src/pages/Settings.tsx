import { useRef, useState } from 'react'
import { Download, Plus, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useAppData } from '../lib/AppDataContext'
import { CategoryIcon } from '../components/CategoryIcon'
import { SyncSection } from '../components/SyncSection'
import type { TransactionType } from '../types'

const ICON_CHOICES = [
  'Banknote', 'Laptop', 'Gift', 'PiggyBank', 'UtensilsCrossed', 'ShoppingCart', 'Car', 'Home',
  'ShoppingBag', 'Clapperboard', 'HeartPulse', 'Plane', 'MoreHorizontal', 'Wallet', 'Coffee',
  'Dumbbell', 'GraduationCap', 'Wrench',
]
const COLOR_CHOICES = [
  '#22c55e', '#06b6d4', '#a855f7', '#84cc16', '#f97316', '#eab308', '#3b82f6', '#ef4444',
  '#ec4899', '#8b5cf6', '#f43f5e', '#14b8a6', '#64748b',
]

export function Settings() {
  const { categories, settings, addCategory, deleteCategory, updateSettings, fetchLiveRates, exportData, importData } =
    useAppData()

  const [newCatName, setNewCatName] = useState('')
  const [newCatType, setNewCatType] = useState<TransactionType>('expense')
  const [newCatIcon, setNewCatIcon] = useState(ICON_CHOICES[0])
  const [newCatColor, setNewCatColor] = useState(COLOR_CHOICES[0])
  const [newCurrency, setNewCurrency] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [catFilter, setCatFilter] = useState<TransactionType>('expense')
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text()
      if (!window.confirm('Importing will REPLACE all data on this device with the backup. Continue?')) return
      importData(text)
      setImportStatus({ ok: true, msg: 'Backup imported successfully.' })
    } catch {
      setImportStatus({ ok: false, msg: 'Import failed — that does not look like a valid backup file.' })
    }
  }

  async function handleFetchRates(base?: string) {
    setFetching(true)
    setFetchError('')
    try {
      await fetchLiveRates(base)
    } catch {
      setFetchError('Could not fetch live rates. Check your connection and try again.')
    } finally {
      setFetching(false)
    }
  }

  function handleBaseCurrencyChange(base: string) {
    updateSettings({ baseCurrency: base })
    // rates are stored relative to the base, so refresh them for the new base
    void handleFetchRates(base)
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim()) return
    addCategory({ name: newCatName.trim(), type: newCatType, icon: newCatIcon, color: newCatColor })
    setNewCatName('')
  }

  function handleAddCurrency(e: React.FormEvent) {
    e.preventDefault()
    const code = newCurrency.trim().toUpperCase()
    if (!code || settings.currencies.includes(code)) return
    updateSettings({
      currencies: [...settings.currencies, code],
      rates: { ...settings.rates, [code]: settings.rates[code] ?? 1 },
    })
    setNewCurrency('')
  }

  function handleRateChange(code: string, value: string) {
    const num = parseFloat(value)
    updateSettings({ rates: { ...settings.rates, [code]: Number.isFinite(num) ? num : 0 } })
  }

  function handleRemoveCurrency(code: string) {
    if (code === settings.baseCurrency) return
    const currencies = settings.currencies.filter((c) => c !== code)
    const rates = { ...settings.rates }
    delete rates[code]
    updateSettings({ currencies, rates })
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-4">
      <h1 className="mb-4 text-xl font-semibold">Settings</h1>

      <SyncSection />

      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-300">Base currency</h2>
        <p className="mb-2 text-xs text-slate-500">Dashboard totals are converted into this currency.</p>
        <select
          value={settings.baseCurrency}
          onChange={(e) => handleBaseCurrencyChange(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        >
          {settings.currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">Currencies & exchange rates</h2>
          <button
            onClick={() => handleFetchRates()}
            disabled={fetching}
            className="flex items-center gap-1.5 rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-300 disabled:opacity-50"
          >
            <RefreshCw size={12} className={fetching ? 'animate-spin' : ''} />
            {fetching ? 'Fetching…' : 'Fetch live rates'}
          </button>
        </div>
        <p className="mb-1 text-xs text-slate-500">
          Units of each currency per 1 {settings.baseCurrency}. Edit rates manually as needed.
        </p>
        {settings.ratesUpdatedAt && (
          <p className="mb-2 text-[11px] text-slate-600">
            Live rates last updated {new Date(settings.ratesUpdatedAt).toLocaleString()}
          </p>
        )}
        {fetchError && <p className="mb-2 text-xs text-rose-400">{fetchError}</p>}
        <ul className="mb-3 space-y-2">
          {settings.currencies.map((c) => (
            <li key={c} className="flex items-center gap-2">
              <span className="w-14 text-sm text-slate-300">{c}</span>
              <input
                type="number"
                step="0.0001"
                disabled={c === settings.baseCurrency}
                value={settings.rates[c] ?? 1}
                onChange={(e) => handleRateChange(c, e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 disabled:opacity-40"
              />
              <button
                onClick={() => handleRemoveCurrency(c)}
                disabled={c === settings.baseCurrency}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-800 hover:text-rose-400 disabled:opacity-20"
                aria-label={`Remove ${c}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddCurrency} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. JPY"
            value={newCurrency}
            onChange={(e) => setNewCurrency(e.target.value)}
            maxLength={6}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm uppercase text-slate-100 placeholder:normal-case placeholder:text-slate-600"
          />
          <button type="submit" className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-300">
            <Plus size={14} /> Add
          </button>
        </form>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-1 text-sm font-medium text-slate-300">Backup</h2>
        <p className="mb-3 text-xs text-slate-500">
          Download all your data as a file, or restore from a backup made on another device.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 py-2 text-sm font-medium text-emerald-300"
          >
            <Download size={15} /> Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-500/15 py-2 text-sm font-medium text-sky-300"
          >
            <Upload size={15} /> Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleImportFile(f)
              e.target.value = ''
            }}
          />
        </div>
        {importStatus && (
          <p className={`mt-2 text-xs ${importStatus.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{importStatus.msg}</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">Categories</h2>
          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setCatFilter(t)
                  setNewCatType(t)
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  catFilter === t
                    ? t === 'expense'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                    : 'text-slate-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <ul className="mb-4 space-y-1.5">
          {categories.filter((c) => c.type === catFilter).map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-800/50">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${c.color}22` }}
              >
                <CategoryIcon name={c.icon} size={16} color={c.color} />
              </span>
              <span className="flex-1 text-sm text-slate-200">{c.name}</span>
              <button
                onClick={() => deleteCategory(c.id)}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-800 hover:text-rose-400"
                aria-label={`Delete ${c.name}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddCategory} className="space-y-2 border-t border-slate-800 pt-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600"
            />
            <select
              value={newCatType}
              onChange={(e) => setNewCatType(e.target.value as TransactionType)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ICON_CHOICES.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setNewCatIcon(icon)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                  newCatIcon === icon ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800'
                }`}
              >
                <CategoryIcon name={icon} size={16} color={newCatColor} />
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_CHOICES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewCatColor(color)}
                className={`h-6 w-6 rounded-full ring-2 ${newCatColor === color ? 'ring-slate-100' : 'ring-transparent'}`}
                style={{ background: color }}
              />
            ))}
          </div>
          <button type="submit" className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-500/20 py-2 text-sm text-emerald-300">
            <Plus size={14} /> Add category
          </button>
        </form>
      </section>
    </div>
  )
}
