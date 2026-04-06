import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Scout from './pages/Scout'
import RevealPage from './pages/Reveal'
import Dock from './pages/Dock'
import Signal from './pages/Signal'
import Rank from './pages/Rank'
import Validate from './pages/Validate'

function AppInner() {
  const location = useLocation()
  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"         element={<Home />} />
            <Route path="/scout"    element={<Scout />} />
            <Route path="/reveal"   element={<RevealPage />} />
            <Route path="/dock"     element={<Dock />} />
            <Route path="/signal"   element={<Signal />} />
            <Route path="/rank"     element={<Rank />} />
            <Route path="/validate" element={<Validate />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
