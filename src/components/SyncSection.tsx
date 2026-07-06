import { useState } from 'react'
import { Cloud, LogOut, RefreshCw } from 'lucide-react'
import { useAppData } from '../lib/AppDataContext'

export function SyncSection() {
  const { session, syncInfo, signIn, signUp, signOut, syncNow } = useAppData()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleAuth(mode: 'in' | 'up') {
    if (!email.trim() || password.length < 6) {
      setMessage({ ok: false, text: 'Enter your email and a password of at least 6 characters.' })
      return
    }
    setBusy(true)
    setMessage(null)
    const err = mode === 'in' ? await signIn(email.trim(), password) : await signUp(email.trim(), password)
    setBusy(false)
    if (err === 'CONFIRM_EMAIL') {
      setMessage({ ok: true, text: 'Account created — check your email for a confirmation link, then log in here.' })
    } else if (err) {
      setMessage({ ok: false, text: err })
    } else {
      setMessage(null)
      setPassword('')
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-300">
        <Cloud size={15} /> Cloud sync
      </h2>

      {session ? (
        <>
          <p className="mb-1 text-xs text-slate-500">
            Signed in as <span className="text-slate-300">{session.user.email}</span>. Changes sync automatically
            across your devices.
          </p>
          <p className="mb-3 text-[11px] text-slate-600">
            {syncInfo.syncing
              ? 'Syncing…'
              : syncInfo.lastSyncedAt
                ? `Last synced ${new Date(syncInfo.lastSyncedAt).toLocaleString()}`
                : 'Not synced yet'}
          </p>
          {syncInfo.error && <p className="mb-2 text-xs text-rose-400">{syncInfo.error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => void syncNow()}
              disabled={syncInfo.syncing}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-500/15 py-2 text-sm font-medium text-sky-300 disabled:opacity-50"
            >
              <RefreshCw size={15} className={syncInfo.syncing ? 'animate-spin' : ''} /> Sync now
            </button>
            <button
              onClick={() => void signOut()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 py-2 text-sm font-medium text-slate-400"
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-xs text-slate-500">
            Log in with the same account on your phone and laptop to keep data in sync. Without an account, data
            stays on this device only.
          </p>
          <div className="space-y-2">
            <input
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            />
            {message && (
              <p className={`text-xs ${message.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{message.text}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => void handleAuth('in')}
                disabled={busy}
                className="flex-1 rounded-lg bg-emerald-500/15 py-2 text-sm font-medium text-emerald-300 disabled:opacity-50"
              >
                {busy ? 'Working…' : 'Log in'}
              </button>
              <button
                onClick={() => void handleAuth('up')}
                disabled={busy}
                className="flex-1 rounded-lg bg-slate-800 py-2 text-sm font-medium text-slate-300 disabled:opacity-50"
              >
                Create account
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
