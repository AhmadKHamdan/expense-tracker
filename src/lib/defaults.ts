import type { Category, Settings } from '../types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', icon: 'Banknote', color: '#22c55e', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'Laptop', color: '#06b6d4', type: 'income' },
  { id: 'gift', name: 'Gift', icon: 'Gift', color: '#a855f7', type: 'income' },
  { id: 'other-income', name: 'Other', icon: 'PiggyBank', color: '#84cc16', type: 'income' },

  { id: 'food', name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#f97316', type: 'expense' },
  { id: 'groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#eab308', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: 'Car', color: '#3b82f6', type: 'expense' },
  { id: 'housing', name: 'Housing & Bills', icon: 'Home', color: '#ef4444', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Clapperboard', color: '#8b5cf6', type: 'expense' },
  { id: 'health', name: 'Health', icon: 'HeartPulse', color: '#f43f5e', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: 'Plane', color: '#14b8a6', type: 'expense' },
  { id: 'other-expense', name: 'Other', icon: 'MoreHorizontal', color: '#64748b', type: 'expense' },
]

export const DEFAULT_SETTINGS: Settings = {
  baseCurrency: 'USD',
  currencies: ['USD', 'ILS', 'EUR', 'GBP', 'JOD', 'SAR', 'AED'],
  rates: {
    USD: 1,
    ILS: 3.65,
    EUR: 0.92,
    GBP: 0.79,
    JOD: 0.71,
    SAR: 3.75,
    AED: 3.67,
  },
}
