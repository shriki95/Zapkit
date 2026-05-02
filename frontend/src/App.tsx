import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { getUser, initAutoLogout, type User } from './lib/auth'
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
  useEffect(() => {
    return initAutoLogout(() => {
      setUser(null)
    })
  }, [])

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
      </BrowserRouter>
    </AuthContext.Provider>
    </GoogleOAuthProvider>
  )
}
