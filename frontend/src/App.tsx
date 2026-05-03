import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { getUser, initAutoLogout, touchActivity, type User } from './lib/auth'
import { applyAccentOverride } from './lib/theme'
import HomePage from './pages/HomePage'
import TinyLinkPage from './pages/TinyLinkPage'
import QRGeneratorPage from './pages/QRGeneratorPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import ContactPage from './pages/ContactPage'
import DashboardPage from './pages/DashboardPage'
import AuthModal from './components/AuthModal'
import GDPRBanner from './components/GDPRBanner'

// ── Theme helpers (shared across all pages) ──────────────────────────────────

function getThemeCookie(): 'dark' | 'light' | null {
  const m = document.cookie.match(/(?:^|;\s*)zapkit-theme=(dark|light)/)
  return m ? (m[1] as 'dark' | 'light') : null
}
function setThemeCookie(isDark: boolean) {
  document.cookie = `zapkit-theme=${isDark ? 'dark' : 'light'}; path=/; SameSite=Lax; max-age=31536000`
}

// ── Auth Context ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null
  setUser: (u: User | null) => void
  showAuthModal: boolean
  setShowAuthModal: (v: boolean) => void
  authMode: 'login' | 'register'
  setAuthMode: (m: 'login' | 'register') => void
  dark: boolean
  setDark: (v: boolean | ((prev: boolean) => boolean)) => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  showAuthModal: false,
  setShowAuthModal: () => {},
  authMode: 'login',
  setAuthMode: () => {},
  dark: false,
  setDark: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

// ── Scroll to top on every route change ──────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [dark, setDarkState] = useState<boolean>(() => {
    const saved = getThemeCookie() ?? localStorage.getItem('zapkit-theme')
    if (saved !== null) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [user, setUser] = useState<User | null>(getUser())
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showIdleWarning, setShowIdleWarning] = useState(false)
  const [idleCountdown, setIdleCountdown] = useState(120)

  // Setter that also persists the theme
  const setDark = (v: boolean | ((prev: boolean) => boolean)) => {
    setDarkState(prev => {
      const next = typeof v === 'function' ? v(prev) : v
      document.documentElement.classList.toggle('dark', next)
      setThemeCookie(next)
      localStorage.setItem('zapkit-theme', next ? 'dark' : 'light')
      return next
    })
  }

  // Apply theme on mount & changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    setThemeCookie(dark)
    localStorage.setItem('zapkit-theme', dark ? 'dark' : 'light')
  }, [dark])

  // Apply accent color kit on mount (CSS var + style override for hardcoded classes)
  useEffect(() => {
    const accent = localStorage.getItem('zapkit-accent') ?? 'teal'
    applyAccentOverride(accent)
  }, [])

  // Cross-tab theme sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'zapkit-theme' && e.newValue) {
        setDarkState(e.newValue === 'dark')
      }
      if (e.key === 'zapkit_auth_token' || e.key === 'zapkit_last_activity') {
        setUser(getUser())
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // System preference — only when no saved preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (!getThemeCookie() && !localStorage.getItem('zapkit-theme')) {
        setDarkState(e.matches)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Auto-logout on idle (single instance for the whole app)
  const handleIdleLogout = useCallback(() => {
    setUser(null)
    setShowIdleWarning(false)
  }, [])

  useEffect(() => {
    return initAutoLogout(handleIdleLogout, () => {
      setShowIdleWarning(true)
      setIdleCountdown(120)
    })
  }, [handleIdleLogout])

  // Idle warning countdown
  useEffect(() => {
    if (!showIdleWarning) return
    if (idleCountdown <= 0) {
      handleIdleLogout()
      return
    }
    const timer = setTimeout(() => setIdleCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [showIdleWarning, idleCountdown, handleIdleLogout])

  // Sync user on focus / visibility change
  useEffect(() => {
    const syncUser = () => setUser(getUser())
    window.addEventListener('focus', syncUser)
    document.addEventListener('visibilitychange', syncUser)
    return () => {
      window.removeEventListener('focus', syncUser)
      document.removeEventListener('visibilitychange', syncUser)
    }
  }, [])

  const handleAuthSuccess = () => {
    setUser(getUser())
    setShowAuthModal(false)
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
    <AuthContext.Provider value={{ user, setUser, showAuthModal, setShowAuthModal, authMode, setAuthMode, dark, setDark }}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tinylink" element={<TinyLinkPage />} />
          <Route path="/qr" element={<QRGeneratorPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Auth Modal — accessible from any page */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          mode={authMode}
        />

        {/* Global GDPR Banner */}
        <GDPRBanner />

        {/* Idle session warning */}
        {showIdleWarning && user && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-[calc(100%-2rem)] max-w-sm">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/80 shadow-2xl backdrop-blur p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-xl">⏱</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Session expiring soon</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    You'll be logged out in <span className="font-bold tabular-nums">{idleCountdown}s</span> due to inactivity.
                  </p>
                  <button
                    onClick={() => { touchActivity(); setShowIdleWarning(false) }}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
                  >
                    Stay logged in
                  </button>
                </div>
                <button
                  onClick={() => setShowIdleWarning(false)}
                  className="text-amber-400 hover:text-amber-600 transition-colors shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </BrowserRouter>
    </AuthContext.Provider>
    </GoogleOAuthProvider>
  )
}
