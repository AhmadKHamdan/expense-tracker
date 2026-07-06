import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Category, Settings, Transaction } from '../types'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './defaults'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './storage'
import { supabase } from './supabase'

export interface SyncInfo {
  syncing: boolean
  lastSyncedAt: number | null
  error: string | null
}

interface AppDataContextValue {
  transactions: Transaction[]
  categories: Category[]
  settings: Settings
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void
  updateTransaction: (id: string, patch: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addCategory: (c: Omit<Category, 'id'>) => void
  deleteCategory: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  toBaseCurrency: (amount: number, currency: string) => number
  fetchLiveRates: (baseCurrency?: string) => Promise<void>
  exportData: () => string
  importData: (json: string) => void
  session: Session | null
  syncInfo: SyncInfo
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

function loadSettings(): Settings {
  const stored = loadFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  // merge in any new default currencies added after the user first saved settings
  const currencies = [...stored.currencies]
  const rates = { ...stored.rates }
  for (const c of DEFAULT_SETTINGS.currencies) {
    if (!currencies.includes(c)) {
      currencies.push(c)
      rates[c] = DEFAULT_SETTINGS.rates[c] ?? 1
    }
  }
  return { ...stored, currencies, rates }
}

// change/sync bookkeeping: a device is "dirty" when it has local edits newer than
// the last successful push/pull. Comparisons are millisecond timestamps.
const markChanged = () => localStorage.setItem(STORAGE_KEYS.lastChangeAt, String(Date.now()))
const lastChangeAt = () => Number(localStorage.getItem(STORAGE_KEYS.lastChangeAt) ?? 0)
const setLastSyncAt = (ms: number) => localStorage.setItem(STORAGE_KEYS.lastSyncAt, String(ms))
const lastSyncAt = () => Number(localStorage.getItem(STORAGE_KEYS.lastSyncAt) ?? 0)
const isDirty = () => lastChangeAt() > lastSyncAt()

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.transactions, [] as Transaction[])
  )
  const [categories, setCategories] = useState<Category[]>(() =>
    loadFromStorage(STORAGE_KEYS.categories, DEFAULT_CATEGORIES)
  )
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [session, setSession] = useState<Session | null>(null)
  const [syncInfo, setSyncInfo] = useState<SyncInfo>({
    syncing: false,
    lastSyncedAt: lastSyncAt() || null,
    error: null,
  })

  useEffect(() => saveToStorage(STORAGE_KEYS.transactions, transactions), [transactions])
  useEffect(() => saveToStorage(STORAGE_KEYS.categories, categories), [categories])
  useEffect(() => saveToStorage(STORAGE_KEYS.settings, settings), [settings])

  // refs so async sync code always sees the latest state
  const stateRef = useRef({ transactions, categories, settings })
  useEffect(() => {
    stateRef.current = { transactions, categories, settings }
  })
  const canPush = useRef(false) // gated until the first pull for this session completes
  const pushTimer = useRef<number | null>(null)

  // --- auth ---

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // --- sync engine ---

  async function pushNow(s: Session) {
    const changeAt = lastChangeAt()
    const { error } = await supabase.from('user_data').upsert({
      user_id: s.user.id,
      payload: stateRef.current,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    setLastSyncAt(Math.max(Date.now(), changeAt))
  }

  async function pullOrPush(s: Session) {
    setSyncInfo((p) => ({ ...p, syncing: true, error: null }))
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('payload, updated_at')
        .eq('user_id', s.user.id)
        .maybeSingle()
      if (error) throw error

      const serverUpdatedAt = data ? new Date(data.updated_at).getTime() : 0
      if (!data || lastChangeAt() > serverUpdatedAt) {
        // no cloud copy yet, or this device has newer edits → upload
        await pushNow(s)
      } else {
        // cloud copy is newer → apply it here
        const p = data.payload as { transactions?: Transaction[]; categories?: Category[]; settings?: Settings }
        if (Array.isArray(p.transactions)) setTransactions(p.transactions)
        if (Array.isArray(p.categories)) setCategories(p.categories)
        if (p.settings) setSettings(p.settings)
        setLastSyncAt(Math.max(serverUpdatedAt, lastChangeAt()))
      }
      canPush.current = true
      setSyncInfo({ syncing: false, lastSyncedAt: Date.now(), error: null })
    } catch {
      setSyncInfo((p) => ({
        ...p,
        syncing: false,
        error: 'Sync failed — check your connection. Your data is safe on this device.',
      }))
    }
  }

  // pull when a session appears, and when the app comes back into focus
  const userId = session?.user.id
  useEffect(() => {
    canPush.current = false
    if (!session) return
    void pullOrPush(session)
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (isDirty()) {
        void pushNow(session).catch(() => {})
      } else {
        void pullOrPush(session)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // debounced push after local edits
  useEffect(() => {
    if (!session || !canPush.current || !isDirty()) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = window.setTimeout(async () => {
      setSyncInfo((p) => ({ ...p, syncing: true }))
      try {
        await pushNow(session)
        setSyncInfo({ syncing: false, lastSyncedAt: Date.now(), error: null })
      } catch {
        setSyncInfo((p) => ({
          ...p,
          syncing: false,
          error: 'Could not save to the cloud — will retry after your next change.',
        }))
      }
    }, 800)
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, categories, settings, session])

  const syncNow: AppDataContextValue['syncNow'] = async () => {
    if (!session) return
    if (isDirty()) {
      setSyncInfo((p) => ({ ...p, syncing: true, error: null }))
      try {
        await pushNow(session)
        setSyncInfo({ syncing: false, lastSyncedAt: Date.now(), error: null })
      } catch {
        setSyncInfo((p) => ({ ...p, syncing: false, error: 'Sync failed — check your connection.' }))
      }
    } else {
      await pullOrPush(session)
    }
  }

  const signIn: AppDataContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }

  const signUp: AppDataContextValue['signUp'] = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return error.message
    if (!data.session) return 'CONFIRM_EMAIL'
    return null
  }

  const signOut: AppDataContextValue['signOut'] = async () => {
    await supabase.auth.signOut()
    // local data stays on the device so the app keeps working offline
  }

  // --- mutations (all mark the device dirty so the sync engine pushes) ---

  const addTransaction: AppDataContextValue['addTransaction'] = (t) => {
    markChanged()
    setTransactions((prev) => [{ ...t, id: crypto.randomUUID(), createdAt: Date.now() }, ...prev])
  }

  const updateTransaction: AppDataContextValue['updateTransaction'] = (id, patch) => {
    markChanged()
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const deleteTransaction: AppDataContextValue['deleteTransaction'] = (id) => {
    markChanged()
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const addCategory: AppDataContextValue['addCategory'] = (c) => {
    markChanged()
    setCategories((prev) => [...prev, { ...c, id: crypto.randomUUID() }])
  }

  const deleteCategory: AppDataContextValue['deleteCategory'] = (id) => {
    markChanged()
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  const updateSettings: AppDataContextValue['updateSettings'] = (patch) => {
    markChanged()
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  // rates are stored as "units of currency per 1 base currency unit"
  const toBaseCurrency: AppDataContextValue['toBaseCurrency'] = (amount, currency) => {
    const rate = settings.rates[currency] ?? 1
    return amount / rate
  }

  const fetchLiveRates: AppDataContextValue['fetchLiveRates'] = async (baseCurrency) => {
    const base = baseCurrency ?? settings.baseCurrency
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`)
    if (!res.ok) throw new Error(`Rate API returned ${res.status}`)
    const data = await res.json()
    if (data?.result !== 'success' || !data.rates) throw new Error('Rate API returned an error')
    markChanged()
    setSettings((prev) => {
      const rates = { ...prev.rates }
      for (const c of prev.currencies) {
        if (typeof data.rates[c] === 'number') rates[c] = data.rates[c]
      }
      rates[base] = 1
      return { ...prev, rates, ratesUpdatedAt: Date.now() }
    })
  }

  const exportData: AppDataContextValue['exportData'] = () =>
    JSON.stringify(
      { app: 'expense-tracker', version: 1, exportedAt: new Date().toISOString(), transactions, categories, settings },
      null,
      2
    )

  const importData: AppDataContextValue['importData'] = (json) => {
    const data = JSON.parse(json)
    if (data?.app !== 'expense-tracker' || !Array.isArray(data.transactions) || !Array.isArray(data.categories) || !data.settings) {
      throw new Error('Not a valid expense-tracker backup file')
    }
    markChanged()
    setTransactions(data.transactions)
    setCategories(data.categories)
    setSettings(data.settings)
  }

  const value = useMemo(
    () => ({
      transactions,
      categories,
      settings,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      deleteCategory,
      updateSettings,
      toBaseCurrency,
      fetchLiveRates,
      exportData,
      importData,
      session,
      syncInfo,
      signIn,
      signUp,
      signOut,
      syncNow,
    }),
    [transactions, categories, settings, session, syncInfo]
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
