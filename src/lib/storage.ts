export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const STORAGE_KEYS = {
  transactions: 'expense-tracker:transactions',
  categories: 'expense-tracker:categories',
  settings: 'expense-tracker:settings',
  lastChangeAt: 'expense-tracker:lastChangeAt',
  lastSyncAt: 'expense-tracker:lastSyncAt',
} as const
