import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, List, Plus, Settings as SettingsIcon } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'History', icon: List, end: false },
  { to: '/add', label: 'Add', icon: Plus, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
]

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
      <main className="flex-1 overflow-y-auto pb-24 pt-[env(safe-area-inset-top)]">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-500'
                }`
              }
            >
              <Icon size={22} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
