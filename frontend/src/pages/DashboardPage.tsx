/**
 * DashboardPage — standalone luxury analytics hub
 * Route: /dashboard  |  Tabs: Analytics · Settings
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  ArrowUpRight, BarChart3, Calendar, ExternalLink, Link2,
  QrCode, RefreshCw, TrendingUp, Eye, Zap,
  LogIn, LogOut, Moon, Sun, Trash2, Settings as SettingsIcon,
  LayoutDashboard, CheckSquare, Square, Copy, Check, Download,
} from 'lucide-react'
import {
  getDashboard, getLinkStats, getQRStats, logout,
  deleteLink, deleteQR,
  type LinkStats, type QRStats,
} from '../lib/auth'
import { useAuth } from '../App'
import Settings from '../components/Settings'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  links: Array<{ id: string; short_code: string; short_url: string; original_url: string; click_count: number; created_at: string; expires_at: string | null }>
  qr_codes: Array<{ id: string; qr_code: string; qr_type: string; content: string; scan_count: number; created_at: string }>
  total_links: number
  total_qr_codes: number
  total_clicks: number
  total_scans: number
}

type SelectedItem = { type: 'link' | 'qr'; code: string; label: string; subtitle: string }
type PageTab = 'analytics' | 'settings'

const CHART_COLORS = ['#00C4A7', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9']

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function shortUrl(url: string, n = 42) {
  return url.length > n ? url.slice(0, n) + '…' : url
}
function qrTypeLabel(t: string) {
  const MAP: Record<string, string> = {
    link: 'URL', text: 'Text', email: 'Email', call: 'Phone', sms: 'SMS',
    whatsapp: 'WhatsApp', wifi: 'Wi-Fi', vcard: 'Contact Card',
    event: 'Calendar Event', media: 'Media', app: 'App Store', social: 'Social',
  }
  return MAP[t] ?? t
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, setUser, dark, setDark, setShowAuthModal, setAuthMode } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [pageTab, setPageTab] = useState<PageTab>(
    searchParams.get('tab') === 'settings' ? 'settings' : 'analytics'
  )
  const [data, setData] = useState<DashboardData | null>(null)
  const [selected, setSelected] = useState<SelectedItem[]>([])
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, LinkStats | QRStats>>({})
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'links' | 'qr'>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'link' | 'qr'; code: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [downloadingQR, setDownloadingQR] = useState<string | null>(null)

  useEffect(() => { if (!user) navigate('/') }, [user, navigate])
  useEffect(() => { loadDashboard() }, [])

  // Auto-select first item after load
  useEffect(() => {
    if (!data || selected.length > 0) return
    const first = data.links[0]
    const firstQr = data.qr_codes[0]
    if (first) setSelected([{ type: 'link', code: first.short_code, label: first.short_code, subtitle: first.original_url }])
    else if (firstQr) setSelected([{ type: 'qr', code: firstQr.qr_code, label: qrTypeLabel(firstQr.qr_type), subtitle: firstQr.qr_code }])
  }, [data])

  // Load analytics for any newly-selected items
  useEffect(() => {
    selected.forEach(item => {
      if (!analyticsMap[item.code]) loadAnalytics(item)
    })
  }, [selected])

  async function loadDashboard() {
    try { setLoading(true); setError(''); setData(await getDashboard()) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function loadAnalytics(item: SelectedItem) {
    try {
      setAnalyticsLoading(true)
      const result = item.type === 'link' ? await getLinkStats(item.code) : await getQRStats(item.code)
      setAnalyticsMap(prev => ({ ...prev, [item.code]: result }))
    } catch { /* silent */ }
    finally { setAnalyticsLoading(false) }
  }

  function toggleSelect(item: SelectedItem) {
    setSelected(prev => {
      const exists = prev.find(s => s.code === item.code)
      if (exists) return prev.filter(s => s.code !== item.code)
      return [...prev, item] // allow multiple
    })
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    try {
      setDeleting(true)
      if (deleteConfirm.type === 'link') await deleteLink(deleteConfirm.code)
      else await deleteQR(deleteConfirm.code)
      setDeleteConfirm(null)
      setSelected(prev => prev.filter(s => s.code !== deleteConfirm.code))
      setAnalyticsMap(prev => { const n = { ...prev }; delete n[deleteConfirm.code]; return n })
      await loadDashboard()
    } catch (e: any) { setError(e.message) }
    finally { setDeleting(false) }
  }

  const handleLogout = () => { logout(); setUser(null) }

  function handleCopy(text: string, code: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }).catch(() => {})
  }

  async function handleQRDownload(content: string, code: string) {
    try {
      setDownloadingQR(code)
      const QRCode = await import('qrcode')
      const dataUrl = await QRCode.default.toDataURL(content, { width: 512, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `qr-${code}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch { /* silent */ }
    finally { setDownloadingQR(null) }
  }

  // ── Aggregate analytics for selected items ────────────────────────────────

  const activeAnalytics = useMemo(() => {
    return selected.map(s => analyticsMap[s.code]).filter(Boolean) as (LinkStats | QRStats)[]
  }, [selected, analyticsMap])

  const mergedChartData = useMemo(() => {
    if (!activeAnalytics.length) return []
    // Build a date-keyed map across all selected items
    const dateMap: Record<string, number[]> = {}
    activeAnalytics.forEach((a, idx) => {
      const pts = 'daily_clicks' in a ? a.daily_clicks : a.daily_scans
      pts.forEach(p => {
        if (!dateMap[p.date]) dateMap[p.date] = new Array(activeAnalytics.length).fill(0)
        dateMap[p.date][idx] = p.count
      })
    })
    return Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, counts]) => ({
      date: date.slice(5),
      ...Object.fromEntries(counts.map((v, i) => [`v${i}`, v])),
    }))
  }, [activeAnalytics])

  const deviceData = useMemo(() => {
    if (!activeAnalytics.length) return []
    const merged: Record<string, number> = {}
    activeAnalytics.forEach(a => a.devices.forEach(d => { merged[d.device_type] = (merged[d.device_type] ?? 0) + d.count }))
    return Object.entries(merged).map(([name, value]) => ({ name, value }))
  }, [activeAnalytics])

  const countryData = useMemo(() => {
    if (!activeAnalytics.length) return []
    const merged: Record<string, number> = {}
    activeAnalytics.forEach(a => a.countries.forEach(c => { merged[c.country] = (merged[c.country] ?? 0) + c.count }))
    return Object.entries(merged).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }))
  }, [activeAnalytics])

  const referrerData = useMemo(() => {
    const merged: Record<string, number> = {}
    activeAnalytics.filter(a => 'referrers' in a).forEach(a => {
      (a as LinkStats).referrers.forEach(r => { merged[r.referrer] = (merged[r.referrer] ?? 0) + r.count })
    })
    return Object.entries(merged).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }))
  }, [activeAnalytics])

  const totalEvents = activeAnalytics.reduce((s, a) => s + ('total_clicks' in a ? a.total_clicks : a.total_scans), 0)

  const filteredLinks = data?.links ?? []
  const filteredQR = data?.qr_codes ?? []

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-[#00C4A7] flex items-center justify-center shadow-md group-hover:shadow-[#00C4A7]/40 transition-shadow">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block">
              Zap<span className="text-[#00C4A7]">Kit</span>
            </span>
          </Link>

          {/* Page tabs */}
          <nav className="flex items-center gap-1 text-sm">
            <button
              onClick={() => setPageTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${pageTab === 'analytics' ? 'bg-[#00C4A7]/10 text-[#00C4A7]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <LayoutDashboard size={14} /> Analytics
            </button>
            <button
              onClick={() => setPageTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${pageTab === 'settings' ? 'bg-[#00C4A7]/10 text-[#00C4A7]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <SettingsIcon size={14} /> Settings
            </button>
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#00C4A7]/10 border border-[#00C4A7]/20">
                  <div className="w-6 h-6 rounded-full bg-[#00C4A7] flex items-center justify-center text-white text-xs font-bold">
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{user.name ?? user.email.split('@')[0]}</span>
                </div>
                <button onClick={handleLogout} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Log out">
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <button onClick={() => { setAuthMode('login'); setShowAuthModal(true) }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <LogIn size={15} /> Sign In
              </button>
            )}
            <button onClick={() => setDark((d: boolean) => !d)} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Toggle theme">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Settings Tab ────────────────────────────────────────────────────── */}
      {pageTab === 'settings' && (
        <main className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[#00C4A7] mb-1">Personal Area</div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Account Settings</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your profile, security, and preferences.</p>
          </div>
          <Settings />
        </main>
      )}

      {/* ── Analytics Tab ────────────────────────────────────────────────────── */}
      {pageTab === 'analytics' && (
        <>
          {/* Page hero */}
          <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="max-w-screen-xl mx-auto px-4 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#00C4A7] mb-1">Analytics Hub</div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {user ? `${user.name ?? user.email.split('@')[0]}'s Dashboard` : 'My Dashboard'}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Real-time performance data for all your links and QR codes.
                  {selected.length > 1 && <span className="ml-2 text-[#00C4A7] font-semibold">{selected.length} items selected</span>}
                </p>
              </div>
              <button
                onClick={loadDashboard}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 self-start sm:self-auto"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          <main className="max-w-screen-xl mx-auto px-4 py-8 space-y-8">
            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 border-4 border-[#00C4A7] border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">Loading your analytics…</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center">
                <p className="text-red-600 dark:text-red-400 font-semibold mb-3">{error}</p>
                <button onClick={loadDashboard} className="px-4 py-2 rounded-xl bg-[#00C4A7] text-white font-semibold text-sm hover:bg-[#00B096]">Try Again</button>
              </div>
            )}

            {!loading && data && (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: Link2,      label: 'Shortened Links',  value: data.total_links,     sub: 'total created',       accent: false },
                    { icon: QrCode,     label: 'QR Codes',         value: data.total_qr_codes,  sub: 'total created',       accent: false },
                    { icon: TrendingUp, label: 'Total Clicks',     value: data.total_clicks,    sub: 'across all links',    accent: true  },
                    { icon: Eye,        label: 'Total QR Scans',   value: data.total_scans,     sub: 'across all QR codes', accent: true  },
                  ].map(({ icon: Icon, label, value, sub, accent }) => (
                    <div key={label} className={`relative rounded-2xl p-5 border overflow-hidden ${
                      accent
                        ? 'bg-gradient-to-br from-[#00C4A7]/10 to-[#00C4A7]/5 border-[#00C4A7]/20 dark:border-[#00C4A7]/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-xl ${accent ? 'bg-[#00C4A7]/15' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          <Icon size={18} className={accent ? 'text-[#00C4A7]' : 'text-slate-600 dark:text-slate-400'} />
                        </div>
                        {accent && <ArrowUpRight size={16} className="text-[#00C4A7]/60" />}
                      </div>
                      <div className={`text-3xl font-black tracking-tight ${accent ? 'text-[#00C4A7]' : 'text-slate-900 dark:text-white'}`}>
                        {value.toLocaleString()}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-600">{sub}</div>
                    </div>
                  ))}
                </div>

                {/* Main content */}
                {(data.links.length > 0 || data.qr_codes.length > 0) ? (
                  <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">

                    {/* Left: item list */}
                    <aside className="space-y-4">
                      {/* Hint */}
                      <div className="flex items-center gap-2 px-1">
                        <CheckSquare size={13} className="text-slate-400" />
                        <span className="text-[11px] text-slate-400">Select one or more items to compare analytics</span>
                      </div>

                      {/* Filter tabs */}
                      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                        {(['all', 'links', 'qr'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              filter === f ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {f === 'all' ? 'All' : f === 'links' ? 'Links' : 'QR Codes'}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        {/* Links */}
                        {(filter === 'all' || filter === 'links') && filteredLinks.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 px-1">
                              <Link2 size={12} className="text-slate-400" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shortened Links</span>
                            </div>
                            {filteredLinks.map(link => {
                              const item: SelectedItem = { type: 'link', code: link.short_code, label: link.short_code, subtitle: link.original_url }
                              const isSelected = selected.some(s => s.code === link.short_code)
                              return (
                                <div key={link.id} className="group relative">
                                  <button
                                    onClick={() => toggleSelect(item)}
                                    className={`w-full text-left rounded-xl border p-3.5 transition-all pr-10 ${
                                      isSelected
                                        ? 'border-[#00C4A7] bg-[#00C4A7]/8 dark:bg-[#00C4A7]/10 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#00C4A7]/50 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      {isSelected ? <CheckSquare size={13} className="text-[#00C4A7] flex-shrink-0" /> : <Square size={13} className="text-slate-300 flex-shrink-0" />}
                                      <span className="font-mono font-bold text-[#00C4A7] text-sm">{link.short_code}</span>
                                      <span className="ml-auto text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                        {link.click_count.toLocaleString()} clicks
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2 pl-5">{shortUrl(link.original_url)}</p>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-400 pl-5 flex-wrap">
                                      <span className="flex items-center gap-1"><Calendar size={10} /> {fmt(link.created_at)}</span>
                                      <a href={link.short_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#00C4A7] transition-colors" onClick={e => e.stopPropagation()}>
                                        <ExternalLink size={10} /> Open
                                      </a>
                                      <button
                                        onClick={e => { e.stopPropagation(); handleCopy(link.short_url, link.short_code) }}
                                        className={`flex items-center gap-1 transition-colors ${copiedCode === link.short_code ? 'text-green-500' : 'hover:text-[#00C4A7]'}`}
                                      >
                                        {copiedCode === link.short_code ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy link</>}
                                      </button>
                                    </div>
                                  </button>
                                  {/* Delete button */}
                                  <button
                                    onClick={() => setDeleteConfirm({ type: 'link', code: link.short_code })}
                                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete link"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )
                            })}
                          </>
                        )}

                        {/* QR Codes */}
                        {(filter === 'all' || filter === 'qr') && filteredQR.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 px-1 mt-2">
                              <QrCode size={12} className="text-slate-400" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">QR Codes</span>
                            </div>
                            {filteredQR.map(qr => {
                              const item: SelectedItem = { type: 'qr', code: qr.qr_code, label: qrTypeLabel(qr.qr_type), subtitle: qr.qr_code }
                              const isSelected = selected.some(s => s.code === qr.qr_code)
                              return (
                                <div key={qr.id} className="group relative">
                                  <button
                                    onClick={() => toggleSelect(item)}
                                    className={`w-full text-left rounded-xl border p-3.5 transition-all pr-10 ${
                                      isSelected
                                        ? 'border-[#00C4A7] bg-[#00C4A7]/8 dark:bg-[#00C4A7]/10 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#00C4A7]/50 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      {isSelected ? <CheckSquare size={13} className="text-[#00C4A7] flex-shrink-0" /> : <Square size={13} className="text-slate-300 flex-shrink-0" />}
                                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                        {qrTypeLabel(qr.qr_type)}
                                      </span>
                                      <span className="ml-auto text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                        {qr.scan_count.toLocaleString()} scans
                                      </span>
                                    </div>
                                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mb-2 pl-5 truncate">{qr.content}</p>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-3 pl-5 flex-wrap">
                                      <span className="flex items-center gap-1"><Calendar size={10} /> {fmt(qr.created_at)}</span>
                                      <button
                                        onClick={e => { e.stopPropagation(); handleCopy(qr.content, qr.qr_code) }}
                                        className={`flex items-center gap-1 transition-colors ${copiedCode === qr.qr_code ? 'text-green-500' : 'hover:text-[#00C4A7]'}`}
                                      >
                                        {copiedCode === qr.qr_code ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy content</>}
                                      </button>
                                      <button
                                        onClick={e => { e.stopPropagation(); handleQRDownload(qr.content, qr.qr_code) }}
                                        className="flex items-center gap-1 hover:text-indigo-500 transition-colors"
                                      >
                                        <Download size={10} /> {downloadingQR === qr.qr_code ? 'Saving…' : 'Download'}
                                      </button>
                                    </div>
                                  </button>
                                  {/* Delete button */}
                                  <button
                                    onClick={() => setDeleteConfirm({ type: 'qr', code: qr.qr_code })}
                                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete QR code"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )
                            })}
                          </>
                        )}
                      </div>
                    </aside>

                    {/* Right: analytics */}
                    <section className="space-y-5">
                      {selected.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-slate-400 text-sm">
                          Select an item from the list to view its analytics.
                        </div>
                      )}

                      {selected.length > 0 && (
                        <>
                          {/* Selected items header */}
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                                  {selected.length === 1 ? 'Item Analytics' : `Comparing ${selected.length} items`}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {selected.map((s, i) => (
                                    <span key={s.code} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}>
                                      {s.type === 'link' ? <Link2 size={10} /> : <QrCode size={10} />}
                                      {s.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-right bg-gradient-to-br from-[#00C4A7]/10 to-[#00C4A7]/5 border border-[#00C4A7]/20 rounded-2xl px-6 py-3">
                                <div className="text-4xl font-black text-[#00C4A7]">{totalEvents.toLocaleString()}</div>
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">total events</div>
                              </div>
                            </div>
                          </div>

                          {analyticsLoading ? (
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-8 h-8 border-2 border-[#00C4A7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-sm text-slate-500">Loading analytics…</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Activity chart */}
                              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                  <BarChart3 size={16} className="text-[#00C4A7]" />
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">Activity over time</span>
                                  <span className="text-xs text-slate-400 ml-1">— last 30 days</span>
                                </div>
                                {mergedChartData.length > 0 ? (
                                  <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={mergedChartData} margin={{ left: -20, right: 8, top: 4 }}>
                                      <defs>
                                        {selected.map((_, i) => (
                                          <linearGradient key={i} id={`grad${i}`} x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                                          </linearGradient>
                                        ))}
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                                      <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                      <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
                                      {selected.map((_, i) => (
                                        <Area key={i} type="monotone" dataKey={`v${i}`} name={selected[i].label}
                                          stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.5}
                                          fill={`url(#grad${i})`} />
                                      ))}
                                    </AreaChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No activity yet — share your link or QR code to start tracking.</div>
                                )}
                              </div>

                              {/* Device + Sources */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                                  <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 size={16} className="text-indigo-500" />
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Devices</span>
                                  </div>
                                  {deviceData.length > 0 ? (
                                    <>
                                      <ResponsiveContainer width="100%" height={160}>
                                        <PieChart>
                                          <Pie data={deviceData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                                            {deviceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                          </Pie>
                                          <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                      </ResponsiveContainer>
                                      <div className="grid grid-cols-2 gap-2 mt-2">
                                        {deviceData.map((d, i) => (
                                          <div key={d.name} className="flex items-center gap-2 text-xs">
                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                            <span className="text-slate-600 dark:text-slate-400 capitalize truncate">{d.name}</span>
                                            <span className="ml-auto font-bold text-slate-900 dark:text-white">{d.value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">No device data yet</div>
                                  )}
                                </div>

                                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                                  <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 size={16} className="text-amber-500" />
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Traffic Sources</span>
                                  </div>
                                  {referrerData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                      <BarChart data={referrerData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                                        <XAxis type="number" allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis type="category" dataKey="name" width={80} fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  ) : (
                                    <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No traffic source data yet</div>
                                  )}
                                </div>
                              </div>

                              {/* Country table */}
                              {countryData.length > 0 && (
                                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                                  <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 size={16} className="text-emerald-500" />
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Top Countries</span>
                                  </div>
                                  <div className="space-y-2">
                                    {countryData.slice(0, 8).map((c, i) => {
                                      const pct = totalEvents > 0 ? Math.round((c.value / totalEvents) * 100) : 0
                                      return (
                                        <div key={c.name} className="flex items-center gap-3">
                                          <span className="text-xs text-slate-400 w-4 text-right">{i + 1}</span>
                                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-28 truncate">{c.name}</span>
                                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                            <div className="h-2 rounded-full bg-[#00C4A7] transition-all" style={{ width: `${pct}%` }} />
                                          </div>
                                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-8 text-right">{c.value}</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </section>
                  </div>
                ) : (
                  /* Empty state */
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp size={28} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No tracked items yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
                      Shorten a link or generate a QR code to start seeing real-time analytics here.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Link to="/tinylink" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00C4A7] text-white text-sm font-bold hover:bg-[#00B096]">
                        <Link2 size={14} /> Shorten a Link
                      </Link>
                      <Link to="/qr" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700">
                        <QrCode size={14} /> Generate a QR Code
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Delete {deleteConfirm.type === 'link' ? 'Link' : 'QR Code'}?</h3>
                <p className="text-xs text-slate-500 font-mono">{deleteConfirm.code}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              This action cannot be undone. The {deleteConfirm.type === 'link' ? 'short link' : 'QR code'} and all its analytics data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
