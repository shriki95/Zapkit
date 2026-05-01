/**
 * DashboardPage — standalone luxury analytics hub
 * Route: /dashboard
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  ArrowUpRight, BarChart3, Calendar, ExternalLink, Link2,
  QrCode, RefreshCw, TrendingUp, Eye, Zap,
  LogIn, LogOut, Moon, Sun,
} from 'lucide-react'
import { getDashboard, getLinkStats, getQRStats, logout, type LinkStats, type QRStats } from '../lib/auth'
import { useAuth } from '../App'

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
  const [data, setData] = useState<DashboardData | null>(null)
  const [selected, setSelected] = useState<SelectedItem | null>(null)
  const [analytics, setAnalytics] = useState<LinkStats | QRStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'links' | 'qr'>('all')

  useEffect(() => {
    if (!user) { navigate('/') }
  }, [user, navigate])

  useEffect(() => { loadDashboard() }, [])

  useEffect(() => {
    if (!data || selected) return
    const first = data.links[0]
    const firstQr = data.qr_codes[0]
    if (first) setSelected({ type: 'link', code: first.short_code, label: first.short_code, subtitle: first.original_url })
    else if (firstQr) setSelected({ type: 'qr', code: firstQr.qr_code, label: qrTypeLabel(firstQr.qr_type), subtitle: firstQr.qr_code })
  }, [data, selected])

  useEffect(() => {
    if (!selected) return
    loadAnalytics(selected)
  }, [selected])

  async function loadDashboard() {
    try { setLoading(true); setError(''); setData(await getDashboard()) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function loadAnalytics(item: SelectedItem) {
    try {
      setAnalyticsLoading(true)
      setAnalytics(item.type === 'link' ? await getLinkStats(item.code) : await getQRStats(item.code))
    } catch { setAnalytics(null) }
    finally { setAnalyticsLoading(false) }
  }

  const chartData = useMemo(() => {
    if (!analytics) return []
    const pts = 'daily_clicks' in analytics ? analytics.daily_clicks : analytics.daily_scans
    return pts.map(p => ({ date: p.date.slice(5), value: p.count }))
  }, [analytics])

  const deviceData = useMemo(() => analytics?.devices.map(d => ({ name: d.device_type, value: d.count })) ?? [], [analytics])
  const countryData = useMemo(() => analytics?.countries.map(c => ({ name: c.country, value: c.count })) ?? [], [analytics])
  const referrerData = useMemo(() => {
    if (!analytics || !('referrers' in analytics)) return []
    return analytics.referrers.map(r => ({ name: r.referrer, value: r.count }))
  }, [analytics])
  const totalEvents = analytics ? ('total_clicks' in analytics ? analytics.total_clicks : analytics.total_scans) : 0

  const handleLogout = () => { logout(); setUser(null) }

  const filteredLinks = data?.links ?? []
  const filteredQR = data?.qr_codes ?? []

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/90 backdrop-blur-lg">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-[#00C4A7] flex items-center justify-center shadow-md group-hover:shadow-[#00C4A7]/40 transition-shadow">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block">
              Zap<span className="text-[#00C4A7]">Kit</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link to="/tinylink" className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors font-medium flex items-center gap-1.5">
              <Link2 size={14} /> TinyLink
            </Link>
            <Link to="/qr" className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors font-medium flex items-center gap-1.5">
              <QrCode size={14} /> QR Generator
            </Link>
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

      {/* ── Page hero ──────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-screen-xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#00C4A7] mb-1">Analytics Hub</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {user ? `${user.name ?? user.email.split('@')[0]}'s Dashboard` : 'My Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Real-time performance data for all your links and QR codes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Link to="/tinylink" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00C4A7] text-white text-sm font-bold hover:bg-[#00B096] transition-colors shadow-md shadow-[#00C4A7]/20">
              <Link2 size={14} /> Shorten a Link
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 py-8 space-y-8">

        {/* ── Loading / Error ─────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-[#00C4A7] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Loading your analytics…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center">
            <p className="text-red-600 dark:text-red-400 font-semibold mb-3">{error}</p>
            <button onClick={loadDashboard} className="px-4 py-2 rounded-xl bg-[#00C4A7] text-white font-semibold text-sm hover:bg-[#00B096]">Try Again</button>
          </div>
        )}

        {!loading && data && (
          <>
            {/* ── KPI cards ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Link2,      label: 'Shortened Links',    value: data.total_links,  sub: 'total created',         accent: false },
                { icon: QrCode,     label: 'QR Codes',           value: data.total_qr_codes, sub: 'total created',       accent: false },
                { icon: TrendingUp, label: 'Total Clicks',       value: data.total_clicks, sub: 'across all links',      accent: true  },
                { icon: Eye,        label: 'Total QR Scans',     value: data.total_scans,  sub: 'across all QR codes',   accent: true  },
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

            {/* ── Main content ─────────────────────────────────────────────── */}
            {(data.links.length > 0 || data.qr_codes.length > 0) ? (
              <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">

                {/* Left: item list */}
                <aside className="space-y-4">
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
                        {f === 'all' ? 'All Items' : f === 'links' ? 'Links' : 'QR Codes'}
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
                        {filteredLinks.map(link => (
                          <button
                            key={link.id}
                            onClick={() => setSelected({ type: 'link', code: link.short_code, label: link.short_code, subtitle: link.original_url })}
                            className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                              selected?.type === 'link' && selected.code === link.short_code
                                ? 'border-[#00C4A7] bg-[#00C4A7]/8 dark:bg-[#00C4A7]/10 shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#00C4A7]/50 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-mono font-bold text-[#00C4A7] text-sm">{link.short_code}</span>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {link.click_count.toLocaleString()} clicks
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">{shortUrl(link.original_url)}</p>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1"><Calendar size={10} /> {fmt(link.created_at)}</span>
                              <a href={link.short_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#00C4A7] transition-colors" onClick={e => e.stopPropagation()}>
                                <ExternalLink size={10} /> Open
                              </a>
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    {/* QR Codes */}
                    {(filter === 'all' || filter === 'qr') && filteredQR.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 px-1 mt-2">
                          <QrCode size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">QR Codes</span>
                        </div>
                        {filteredQR.map(qr => (
                          <button
                            key={qr.id}
                            onClick={() => setSelected({ type: 'qr', code: qr.qr_code, label: qrTypeLabel(qr.qr_type), subtitle: qr.qr_code })}
                            className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                              selected?.type === 'qr' && selected.code === qr.qr_code
                                ? 'border-[#00C4A7] bg-[#00C4A7]/8 dark:bg-[#00C4A7]/10 shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#00C4A7]/50 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                  {qrTypeLabel(qr.qr_type)}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {qr.scan_count.toLocaleString()} scans
                              </span>
                            </div>
                            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mb-2">{qr.qr_code}</p>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar size={10} /> {fmt(qr.created_at)}
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </aside>

                {/* Right: analytics */}
                <section className="space-y-5">
                  {selected && (
                    <>
                      {/* Selected item header */}
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                              {selected.type === 'link' ? 'Link Analytics' : 'QR Code Analytics'}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                              {selected.type === 'link' ? <Link2 size={18} className="text-[#00C4A7] flex-shrink-0" /> : <QrCode size={18} className="text-indigo-500 flex-shrink-0" />}
                              {selected.label}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{shortUrl(selected.subtitle, 60)}</p>
                          </div>
                          <div className="flex-shrink-0 text-right bg-gradient-to-br from-[#00C4A7]/10 to-[#00C4A7]/5 border border-[#00C4A7]/20 rounded-2xl px-6 py-3">
                            <div className="text-4xl font-black text-[#00C4A7]">{totalEvents.toLocaleString()}</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                              total {selected.type === 'link' ? 'clicks' : 'scans'}
                            </div>
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
                              <span className="text-xs text-slate-400 dark:text-slate-500">— last 30 days</span>
                            </div>
                            {chartData.length > 0 ? (
                              <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 4 }}>
                                  <defs>
                                    <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                                      <stop offset="0%" stopColor="#00C4A7" stopOpacity={0.3} />
                                      <stop offset="100%" stopColor="#00C4A7" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                                  <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                  <Area type="monotone" dataKey="value" stroke="#00C4A7" strokeWidth={2.5} fill="url(#grad)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No activity data yet — share your link to start tracking!</div>
                            )}
                          </div>

                          {/* Device + Geography */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Devices */}
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                              <div className="flex items-center gap-2 mb-4">
                                <BarChart3 size={16} className="text-indigo-500" />
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Devices</span>
                              </div>
                              {deviceData.length > 0 ? (
                                <>
                                  <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                      <Pie data={deviceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
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
                                <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No device data yet</div>
                              )}
                            </div>

                            {/* Referrers or Countries */}
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                              <div className="flex items-center gap-2 mb-4">
                                <BarChart3 size={16} className="text-amber-500" />
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {selected.type === 'link' ? 'Traffic Sources' : 'Countries'}
                                </span>
                              </div>
                              {(selected.type === 'link' ? referrerData : countryData).length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                  <BarChart
                                    data={selected.type === 'link' ? referrerData : countryData}
                                    layout="vertical"
                                    margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                                    <XAxis type="number" allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="name" width={80} fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No geographic data yet</div>
                              )}
                            </div>
                          </div>

                          {/* Country table if link has countries */}
                          {countryData.length > 0 && selected.type === 'link' && (
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                              <div className="flex items-center gap-2 mb-4">
                                <BarChart3 size={16} className="text-emerald-500" />
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Top Countries</span>
                              </div>
                              <div className="space-y-2">
                                {countryData.slice(0, 8).map((c, i) => {
                                  const pct = Math.round((c.value / totalEvents) * 100)
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
                  Shorten a link or create a QR code to start seeing real-time analytics here. All data is tied to your account.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link to="/tinylink" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00C4A7] text-white text-sm font-bold hover:bg-[#00B096]">
                    <Link2 size={14} /> Create a Short Link
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
    </div>
  )
}
