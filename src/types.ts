export type TransactionType = 'expense' | 'income' | 'exchange'

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: TransactionType
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: string
  categoryId: string
  note: string
  date: string // ISO date string (yyyy-mm-dd)
  createdAt: number
  // exchange: amount/currency is what you gave, toAmount/toCurrency is what you received
  toAmount?: number
  toCurrency?: string
  // split bill: `amount` is your share; totalAmount is the full bill you paid
  totalAmount?: number
  owedAmount?: number
  settled?: boolean
}

export interface Settings {
  baseCurrency: string
  currencies: string[]
  rates: Record<string, number> // units of `currency` per 1 unit of baseCurrency
  ratesUpdatedAt?: number
}
