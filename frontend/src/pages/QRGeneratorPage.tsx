import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSpreadsheet, Moon, QrCode, ScanLine, Share2, Sun, Zap, LayoutDashboard, LogIn, LogOut, User as UserIcon, Settings as SettingsIcon } from 'lucide-react'
import type QRCodeStyling from 'qr-code-styling'
import { buildQrPayload } from '../features/qr/payload'
import type { DesignOptions, QrContentState, QrType } from '../features/qr/types'
import { QR_PRESETS } from '../features/qr/presets'
import { QrPreview } from '../features/qr/QrPreview'
import { QrTypeSelector } from '../features/qr/QrTypeSelector'
import { ContentForm } from '../features/qr/steps/ContentForm'
import { DesignTabs } from '../features/qr/steps/DesignTabs'
import { QrDecoder } from '../features/qr/QrDecoder'
import { BatchProcessor } from '../features/qr/BatchProcessor'
import { SSLUpload } from '../components/SSLUpload'
import SEOOptimizer from '../components/SEOOptimizer'
import AdModal from '../components/AdModal'
import Dashboard from '../components/Dashboard'
import Settings from '../components/Settings'
import { logout } from '../lib/auth'
import { useAuth } from '../App'

type AppTab = 'generate' | 'decode' | 'batch' | 'dashboard' | 'settings'

const TABS = [
  { id: 'generate' as AppTab, label: 'Generate', icon: QrCode },
  { id: 'decode' as AppTab, label: 'Decode', icon: ScanLine },
  { id: 'batch' as AppTab, label: 'Batch', icon: FileSpreadsheet },
  { id: 'dashboard' as AppTab, label: 'Dashboard', icon: LayoutDashboard, authRequired: true },
  { id: 'settings' as AppTab, label: 'Settings', icon: SettingsIcon, authRequired: true },
]

export default function QRGeneratorPage() {
  const { user, setUser, dark, setDark, setShowAuthModal, setAuthMode } = useAuth()

  const [appTab, setAppTab] = useState<AppTab>('generate')
  const [qrType, setQrType] = useState<QrType>('link')
  const [qrInstance, setQrInstance] = useState<QRCodeStyling | null>(null)
  const [generatedPayload, setGeneratedPayload] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showFormatPicker, setShowFormatPicker] = useState(false)
  const [designOpen, setDesignOpen] = useState(false)
  const [design, setDesign] = useState<DesignOptions>({
    previewSize: 320,
    exportSize: 1024,
    logoDataUrl: null,
    frameStyle: 'none' as const,
    frameText: 'SCAN ME',
    frameColor: '#000000',
    frameBorder: true,
    ...QR_PRESETS[0].options,
  })
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [usageModalTimer, setUsageModalTimer] = useState(5)
  const [showAdModal, setShowAdModal] = useState(false)
  const [pendingQRPayload, setPendingQRPayload] = useState<string | null>(null)
  const [qrCount, setQrCount] = useState(0)
  const [savedPayloads, setSavedPayloads] = useState<Set<string>>(() => new Set())

  const [content, setContent] = useState<QrContentState>({
    linkUrl: new URLSearchParams(window.location.search).get('url') ?? '',
    text: '',
    emailTo: '',
    emailSubject: '',
    emailBody: '',
    phoneNumber: '',
    smsMessage: '',
    whatsappNumber: '',
    whatsappMessage: '',
    wifiSsid: '',
    wifiPassword: '',
    wifiEncryption: 'WPA',
    wifiHidden: false,
    vcardFirstName: '',
    vcardLastName: '',
    vcardEmail: '',
    vcardPhone: '',
    vcardCompany: '',
    vcardTitle: '',
    vcardWebsite: '',
    eventTitle: '',
    eventLocation: '',
    eventStart: '',
    eventEnd: '',
    eventDescription: '',
    mediaUrl: '',
    appStoreUrl: '',
    playStoreUrl: '',
    socialPlatform: 'instagram',
    socialHandle: '',
  })

  // Track usage count
  useEffect(() => {
    const count = parseInt(localStorage.getItem('qr-usage-count') || '0')
    if (count >= 2 && !localStorage.getItem('qr-usage-modal-shown')) {
      setShowUsageModal(true)
      localStorage.setItem('qr-usage-modal-shown', 'true')
    }
  }, [])

  // Usage modal countdown
  useEffect(() => {
    if (showUsageModal && usageModalTimer > 0) {
      const timer = setTimeout(() => setUsageModalTimer(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [showUsageModal, usageModalTimer])

  const payload = useMemo(() => buildQrPayload(qrType, content), [content, qrType])

  // Reset result when content/type changes
  useEffect(() => {
    if (generatedPayload) {
      setGeneratedPayload(null)
      setIsGenerating(false)
      setLoadingProgress(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload])

  function handleGenerate() {
    if (!payload || isGenerating) return
    setIsGenerating(true)
    setLoadingProgress(0)
    setGeneratedPayload(null)

    const loadingInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(loadingInterval)
          const newCount = qrCount + 1
          setQrCount(newCount)
          if (newCount % 2 === 0) {
            setPendingQRPayload(payload)
            setShowAdModal(true)
          } else {
            setGeneratedPayload(payload)
          }
          if (user && !savedPayloads.has(payload)) {
            setSavedPayloads(prev => new Set(prev).add(payload))
          }
          setIsGenerating(false)
          return 100
        }
        return prev + 2
      })
    }, 60)
  }

  const handleAdClose = () => {
    setShowAdModal(false)
    if (pendingQRPayload) {
      setGeneratedPayload(pendingQRPayload)
      setPendingQRPayload(null)
    }
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    setAppTab('generate')
  }

  const handleTabClick = (tabId: AppTab) => {
    const tabConfig = TABS.find(t => t.id === tabId)
    if (tabConfig?.authRequired && !user) {
      setAuthMode('login')
      setShowAuthModal(true)
      return
    }
    setAppTab(tabId)
  }

  const visibleTabs = TABS.filter(t => !t.authRequired || user)

  async function downloadWithSize(extension: 'png' | 'svg') {
    if (!qrInstance || !generatedPayload) return
    const prev = design.previewSize
    const next = design.exportSize
    if (next !== prev) {
      qrInstance.update({ width: next, height: next })
      await new Promise((r) => setTimeout(r, 0))
    }
    await qrInstance.download({ name: 'qr', extension })
    if (next !== prev) {
      qrInstance.update({ width: prev, height: prev })
    }
    setShowDownloadModal(true)
    const count = parseInt(localStorage.getItem('qr-usage-count') || '0')
    localStorage.setItem('qr-usage-count', (count + 1).toString())
  }

  return (
    <div className="min-h-svh bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors duration-200" role="banner">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-14">
          {/* Logo — links back to home */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-[#00C4A7] flex items-center justify-center shadow-sm">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight">QR Generator</span>
              <span className="font-bold text-[#00C4A7] tracking-tight"> Pro</span>
              <span className="hidden sm:inline ml-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-normal">by ZapKit</span>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            {user ? (
              <>
                <button
                  onClick={() => setAppTab('dashboard')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
              type="button"
              onClick={() => { navigator.share ? navigator.share({ title: 'QR Generator Pro', url: window.location.href }) : navigator.clipboard.writeText(window.location.href) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              onClick={() => setDark((d: boolean) => !d)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <nav className="mx-auto max-w-6xl px-2 sm:px-4 overflow-x-auto" role="navigation">
          <div className="flex gap-0.5 sm:gap-1 min-w-max sm:min-w-0" role="tablist">
            {visibleTabs.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTabClick(t.id)}
                  className={[
                    'flex items-center gap-1.5 border-b-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap',
                    appTab === t.id
                      ? 'border-[#00C4A7] text-[#00C4A7]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                  ].join(' ')}
                  role="tab"
                  aria-selected={appTab === t.id}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      {/* Hero banner */}
      {appTab === 'generate' && (
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black py-16 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00C4A7]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00C4A7]/10 border border-[#00C4A7]/20 text-[#00C4A7] text-xs font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C4A7] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C4A7]"></span>
              </span>
              Professional QR Code Generation
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">Create Stunning QR Codes</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Generate custom-branded QR codes with advanced design options. Perfect for marketing, events, and business cards.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-slate-400">
              {['12+ QR Types', 'Custom Branding', 'High Resolution'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00C4A7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Generate Tab */}
      {appTab === 'generate' && (
        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[520px_1fr]" role="tabpanel">
          <section className="space-y-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <header className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">1</span>
                Type
              </header>
              <QrTypeSelector value={qrType} onChange={setQrType} />
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <header className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">2</span>
                Content
              </header>
              <ContentForm qrType={qrType} value={content} onChange={setContent} />
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setDesignOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">3</span>
                  Design your QR Code
                  <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">Optional</span>
                </div>
                <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${designOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {designOpen && (
                <div className="border-t border-slate-200 px-4 pb-4 pt-3 dark:border-slate-700">
                  <DesignTabs value={design} onChange={setDesign} />
                </div>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!payload || isGenerating}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00C4A7] px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#00B096] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isGenerating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <QrCode className="h-4 w-4" />}
                {isGenerating ? 'Generating...' : 'Generate QR Code'}
              </button>
            </article>
          </section>

          <aside className="lg:sticky lg:top-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <header className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">4</span>
                Result
              </header>

              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                {isGenerating ? (
                  <div className="grid min-h-[360px] place-items-center">
                    <div className="w-full max-w-xs text-center">
                      <div className="mx-auto mb-4 w-20 h-20 grid grid-cols-5 gap-0.5 p-1 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div key={i} className="rounded-sm transition-all duration-300"
                            style={{ backgroundColor: Math.random() > (1 - loadingProgress / 100) ? '#00C4A7' : '#e2e8f0', opacity: 0.4 + (loadingProgress / 100) * 0.6, transitionDelay: `${i * 20}ms` }}
                          />
                        ))}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        {loadingProgress < 20 && 'Validating your data…'}
                        {loadingProgress >= 20 && loadingProgress < 45 && 'Building QR matrix…'}
                        {loadingProgress >= 45 && loadingProgress < 68 && 'Adding error correction…'}
                        {loadingProgress >= 68 && loadingProgress < 88 && 'Applying design…'}
                        {loadingProgress >= 88 && 'Almost ready!'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">{loadingProgress}% Complete</div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-4 dark:bg-slate-700 overflow-hidden">
                        <div className="bg-[#00C4A7] h-1.5 rounded-full transition-all duration-200 ease-out" style={{ width: `${loadingProgress}%` }} />
                      </div>
                      <div className="text-left space-y-1.5 text-xs">
                        {[
                          { label: 'Input validated', threshold: 5 },
                          { label: 'Data encoded', threshold: 30 },
                          { label: 'Error correction applied', threshold: 55 },
                          { label: 'Pattern optimized', threshold: 78 },
                          { label: 'Design rendered', threshold: 95 },
                        ].map(({ label, threshold }) => (
                          <div key={label} className="flex items-center gap-2">
                            <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${loadingProgress >= threshold ? 'bg-[#00C4A7] text-white' : 'border border-slate-300 dark:border-slate-600'}`}>
                              {loadingProgress >= threshold && <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={loadingProgress >= threshold ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : generatedPayload ? (
                  <div className="mx-auto max-w-[380px]">
                    {/* Always render QR on white background — ensures scannability in dark mode */}
                    <div className="mx-auto w-fit rounded-xl bg-white p-3 shadow-sm">
                      <QrPreview key={design.margin} data={generatedPayload} design={design} onReady={setQrInstance} />
                    </div>
                  </div>
                ) : (
                  <div className="grid min-h-[360px] place-items-center">
                    <div className="max-w-xs text-center">
                      <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <QrCode className="h-6 w-6" />
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your QR code will appear here</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        👆 Choose a QR type on the left, fill in the details, then click <strong>Generate</strong>.
                      </div>
                      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Advertisement</div>
                        <div className="bg-white dark:bg-slate-900 rounded border min-h-[250px] flex items-center justify-center">
                          <div className="text-center text-slate-400 text-sm">Google Ad<br/>300x250</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Download button */}
              <div className="relative mt-3">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-800 bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow transition-all hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                  disabled={!generatedPayload || !qrInstance}
                  onClick={() => setShowFormatPicker(p => !p)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-auto transition-transform ${showFormatPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showFormatPicker && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 overflow-hidden z-10">
                    {([{ ext: 'png', label: 'PNG', desc: 'Best for web & sharing', icon: '🖼️' }, { ext: 'svg', label: 'SVG', desc: 'Best for print & scaling', icon: '📐' }] as const).map(({ ext, label, desc, icon }) => (
                      <button key={ext} type="button" onClick={() => { setShowFormatPicker(false); downloadWithSize(ext) }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800">
                        <span className="text-xl">{icon}</span>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Track QR button */}
              {generatedPayload && !user && (
                <div className="mt-3">
                  <button type="button" onClick={() => { setAuthMode('register'); setShowAuthModal(true) }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#00C4A7] bg-[#00C4A7]/10 px-4 py-3 text-sm font-bold text-[#00C4A7] shadow transition-all hover:bg-[#00C4A7]/20 active:scale-95"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Track This QR Code
                  </button>
                  <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">Sign up to track scans and view analytics</p>
                </div>
              )}
            </section>
          </aside>
        </main>
      )}

      {/* Decode Tab */}
      {appTab === 'decode' && (
        <main className="mx-auto max-w-2xl px-4 py-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <ScanLine className="h-3.5 w-3.5" />
              </span>
              Decode a QR Code
            </div>
            <QrDecoder />
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">Advertisement</div>
              <div className="bg-white dark:bg-slate-900 rounded border min-h-[280px] flex items-center justify-center">
                <div className="text-center text-slate-400 text-sm">Google Ad<br/>336x280</div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Batch Tab */}
      {appTab === 'batch' && (
        <main className="mx-auto max-w-4xl px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Batch QR Generator</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Upload a CSV file with names and URLs to generate multiple QR codes at once</p>
          </div>
          <BatchProcessor />
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">Advertisement</div>
            <div className="bg-white dark:bg-slate-900 rounded border min-h-[280px] flex items-center justify-center">
              <div className="text-center text-slate-400 text-sm">Google Ad<br/>336x280</div>
            </div>
          </div>
        </main>
      )}

      {/* Dashboard Tab */}
      {appTab === 'dashboard' && user && (
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Dashboard />
        </main>
      )}

      {/* Settings Tab */}
      {appTab === 'settings' && user && (
        <main className="mx-auto max-w-4xl px-4 py-6">
          <Settings />
        </main>
      )}

      {/* Footer */}
      {(appTab === 'generate' || appTab === 'decode' || appTab === 'batch') && (
        <footer className="border-t border-slate-200 dark:border-slate-800 mt-8 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#00C4A7] flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">ZapKit</span>
                  <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">Free digital tools, built to last.</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <Link to="/privacy" className="hover:text-[#00C4A7] transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-[#00C4A7] transition-colors">Terms of Use</Link>
                <Link to="/contact" className="hover:text-[#00C4A7] transition-colors">Contact</Link>
              </div>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <span>Our tools:</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#00C4A7]/10 text-[#00C4A7] font-semibold">QR Generator Pro</span>
                {/* Fixed: was using VITE_TINYLINK_APP_URL env var — now uses React Router Link */}
                <Link
                  to="/tinylink"
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  TinyLink Pro
                </Link>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} ZapKit. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}

      {/* Download Success Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDownloadModal(false)}>
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDownloadModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">QR Code Downloaded! ✓</h3>
              <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">Your QR code has been saved successfully</p>
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">Advertisement</div>
                <div className="bg-white dark:bg-slate-900 rounded border min-h-[200px] flex items-center justify-center">
                  <div className="text-center text-slate-400 text-sm">Google Ad<br/>320x200</div>
                </div>
              </div>
              <button onClick={() => setShowDownloadModal(false)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Modal (forced ad after 2 uses) */}
      {showUsageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="text-center">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">Advertisement</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{usageModalTimer > 0 ? `${usageModalTimer}s` : ''}</div>
              </div>
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800">
                <div className="bg-white dark:bg-slate-900 rounded border min-h-[300px] flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <div className="text-lg mb-2">Google Interstitial Ad</div>
                    <div className="text-sm">468x300</div>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowUsageModal(false)} disabled={usageModalTimer > 0}
                className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {usageModalTimer > 0 ? `Continue in ${usageModalTimer}s` : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad Modal */}
      <AdModal isOpen={showAdModal} onClose={handleAdClose} waitTime={5} />

      {/* SEO Optimizer */}
      <SEOOptimizer activeTab={appTab} />

      {/* SSL Upload Component */}
      <SSLUpload />
    </div>
  )
}
