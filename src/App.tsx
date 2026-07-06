import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppDataProvider } from './lib/AppDataContext'
import { AppShell } from './components/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { AddTransaction } from './pages/AddTransaction'
import { Settings } from './pages/Settings'

function App() {
  return (
    <AppDataProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppDataProvider>
  )
}

export default App
