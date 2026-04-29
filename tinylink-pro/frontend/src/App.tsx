import { useEffect, useState } from 'react'
import { Moon, Sun, Link2, LayoutDashboard, Zap, Share2, LogIn, LogOut, User as UserIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import GDPRBanner from './components/GDPRBanner'
import SEOOptimizer from './components/SEOOptimizer'
import UsageModal from './components/UsageModal'
import AuthModal from './components/AuthModal'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import ShortenForm from './features/links/ShortenForm'
import ResultCard from './features/links/ResultCard'
import { getUser, initAutoLogout, logout, type User } from './lib/auth'
import type { ShortenResponse } from './features/links/types'

type Tab = 'shorten' | 'dashboard' | 'settings'

const TABS = [
  { id: 'shorten' as Tab, label: 'Shorten', icon: Link2 },
  { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard, authRequired: true },
  { id: 'settings' as Tab, label: 'Settings', icon: UserIcon, authRequired: true },
]

const COMPANY = 'ZapKit'
const COMPANY_TAGLINE = 'Free digital tools, built to last.'

// Cookies are shared across all ports on the same hostname — the only reliable
// cross-origin sync mechanism for localhost:8080, :5173, :5175.
function getThemeCookie(): 'dark' | 'light' | null {
  const m = document.cookie.match(/(?:^|;\s*)zapkit-theme=(dark|light)/)
  return m ? (m[1] as 'dark' | 'light') : null
}
function setThemeCookie(isDark: boolean) {
  document.cookie = `zapkit-theme=${isDark ? 'dark' : 'light'}; path=/; SameSite=Lax; max-age=31536000`
}

export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = getThemeCookie() ?? localStorage.getItem('zapkit-theme')
    if (saved !== null) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [tab, setTab] = useState<Tab>('shorten')
  const [result, setResult] = useState<ShortenResponse | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [isShortening, setIsShortening] = useState(false)
  
  // Auth state
  const [user, setUser] = useState<User | null>(getUser())
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    return initAutoLogout(() => {
      setUser(null)
      setTab('shorten')
    })
  }, [])

  useEffect(() => {
    const syncUser = () => setUser(getUser())
    window.addEventListener('focus', syncUser)
    document.addEventListener('visibilitychange', syncUser)
    return () => {
      window.removeEventListener('focus', syncUser)
      document.removeEventListener('visibilitychange', syncUser)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    setThemeCookie(dark)
    localStorage.setItem('zapkit-theme', dark ? 'dark' : 'light')
  }, [dark])

  // Same-origin tab sync via StorageEvent
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'zapkit-theme' && e.newValue) setDark(e.newValue === 'dark')
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // System preference — only when user has no saved preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (!getThemeCookie() && !localStorage.getItem('zapkit-theme')) setDark(e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Check URL parameters for login modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('showLogin') === 'true' && !user) {
      setAuthMode('login')
      setShowAuthModal(true)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [user])

  // Auto-logout on idle
  useEffect(() => {
    const cleanup = initAutoLogout(() => {
      setUser(null)
      setTab('shorten')
    })
    return cleanup
  }, [])

  const handleAuthSuccess = () => {
    setUser(getUser())
    setTab('dashboard')
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    setTab('shorten')
  }

  const handleTabClick = (tabId: Tab) => {
    const tabConfig = TABS.find(t => t.id === tabId)
    if (tabConfig?.authRequired && !user) {
      setAuthMode('login')
      setShowAuthModal(true)
      return
    }
    setTab(tabId)
  }

  const shareApp = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: 'TinyLink Pro', text: 'Free URL shortener & link tracker', url })
    } else {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  // Filter tabs based on auth
  const visibleTabs = TABS.filter(t => !t.authRequired || user)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <SEOOptimizer activeTab={tab} />
      <UsageModal />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">

          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-[#00C4A7] flex items-center justify-center shadow-sm">
              <Zap size={16} className="text-white" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight">TinyLink</span>
              <span className="font-bold text-[#00C4A7] tracking-tight"> Pro</span>
              <span className="hidden sm:inline ml-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-normal">by {COMPANY}</span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 flex-1 justify-center">
            {visibleTabs.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabClick(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.id
                      ? 'bg-[#00C4A7]/10 text-[#00C4A7]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            {user ? (
              <>
                <button
                  onClick={() => setTab('dashboard')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="My Dashboard"
                >
                  <UserIcon size={15} />
                  <span className="hidden sm:inline">{user.name || user.email.split('@')[0]}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LogIn size={15} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
            <button
              onClick={shareApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Share this app"
            >
              <Share2 size={15} />
              <span className="hidden sm:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden flex border-t border-slate-100 dark:border-slate-800">
          {visibleTabs.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => handleTabClick(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                  tab === t.id ? 'text-[#00C4A7]' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* Hero banner */}
      {tab === 'shorten' && (
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black py-16 px-4 text-center overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          {/* Gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00C4A7]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00C4A7]/10 border border-[#00C4A7]/20 text-[#00C4A7] text-xs font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C4A7] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C4A7]"></span>
              </span>
              Trusted by thousands worldwide
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Professional Link Management
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Transform long URLs into powerful branded links. Track performance, analyze engagement, and optimize your digital presence with enterprise-grade analytics.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00C4A7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Instant Generation</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00C4A7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00C4A7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Secure & Private</span>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {tab === 'shorten' && (
            <motion.div key="shorten" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <ShortenForm 
                onResult={setResult} 
                onRefreshLinks={() => {}} 
                onLoadingChange={setIsShortening}
                onTrackClick={() => {
                  if (!user) {
                    setAuthMode('register')
                    setShowAuthModal(true)
                  }
                }}
              />
              
              {result && (
                <>
                  <ResultCard 
                    result={result}
                    showTrackButton={!user}
                    onTrackClick={() => {
                      setAuthMode('register')
                      setShowAuthModal(true)
                    }}
                  />
                  
                  {/* Ad after result */}
                  <div className="card p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">Advertisement</div>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[200px] flex items-center justify-center">
                      <div className="text-center text-slate-400 text-sm">
                        Google Ad<br/>
                        728x90
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!result && !isShortening && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                    {[
                      { icon: '⚡', label: 'Instant', desc: 'Links ready in milliseconds' },
                      { icon: '📊', label: 'Analytics', desc: 'Real-time click tracking' },
                      { icon: '📱', label: 'QR Code', desc: 'One click via QR Generator Pro' },
                      { icon: '🌍', label: 'Global', desc: 'Country & device insights' },
                    ].map((f, i) => (
                      <div key={i} className="card p-4 text-center">
                        <div className="text-2xl mb-2">{f.icon}</div>
                        <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{f.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{f.desc}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Ad Space */}
                  <div className="card p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">Advertisement</div>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[250px] flex items-center justify-center">
                      <div className="text-center text-slate-400 text-sm">
                        Google Ad<br/>
                        728x90 or 300x250
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {tab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">My Dashboard</h2>
                <p className="text-slate-600 dark:text-slate-400">Track all your links and QR codes in one place</p>
              </div>
              <Dashboard />
            </motion.div>
          )}

          {tab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Settings />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        mode={authMode}
      />

      {/* Footer - Only show on Shorten tab */}
      {tab === 'shorten' && (
        <footer className="border-t border-slate-200 dark:border-slate-800 mt-12 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Brand row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#00C4A7] flex items-center justify-center">
                  <Zap size={13} className="text-white" />
                </div>
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{COMPANY}</span>
                  <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{COMPANY_TAGLINE}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <a href="#" className="hover:text-[#00C4A7] transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-[#00C4A7] transition-colors">Terms of Use</a>
                <a href="#" className="hover:text-[#00C4A7] transition-colors">Contact</a>
              </div>
            </div>

            {/* Products row */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <span>Our tools:</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#00C4A7]/10 text-[#00C4A7] font-semibold">TinyLink Pro</span>
                <a
                  href={import.meta.env.VITE_QR_APP_URL ?? 'http://localhost:5173'}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  QR Generator Pro
                </a>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} {COMPANY}. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}

      <GDPRBanner />
    </div>
  )
}
