import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BarChart3, Calendar, Check, Edit2, Eye, Link2, QrCode, TrendingUp, X } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getDashboard, getLinkStats, getQRStats, updateLink, updateQR, type LinkStats, type QRStats } from '../lib/auth'
import QRCodeStylingLib from 'qr-code-styling'

// ── Mini QR renderer ─────────────────────────────────────────────────────────
function MiniQR({ data, size = 120 }: { data: string; size?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current || !data) return
    ref.current.innerHTML = ''
    const qr = new QRCodeStylingLib({
      width: size, height: size, data,
      dotsOptions: { color: '#1e293b', type: 'rounded' },
      backgroundOptions: { color: '#ffffff' },
      qrOptions: { errorCorrectionLevel: 'M' },
    })
    qr.append(ref.current)
  }, [data, size])
  return <div ref={ref} className="rounded-lg overflow-hidden bg-white p-1 shadow-sm" />
}

interface DashboardData {
  links: Array<{
    id: string
    short_code: string
    short_url: string
    original_url: string
    click_count: number
    created_at: string
    expires_at: string | null
  }>
  qr_codes: Array<{
    id: string
    qr_code: string
    qr_type: string
    content: string
    scan_count: number
    created_at: string
  }>
  total_links: number
  total_qr_codes: number
  total_clicks: number
  total_scans: number
}

type SelectedItem =
  | { type: 'link'; code: string; label: string; subtitle: string }
  | { type: 'qr'; code: string; label: string; subtitle: string }

const COLORS = ['#00C4A7', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [selected, setSelected] = useState<SelectedItem | null>(null)
  const [analytics, setAnalytics] = useState<LinkStats | QRStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [viewingQR, setViewingQR] = useState<{ content: string; label: string } | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    if (!data || selected) return
    const firstLink = data.links[0]
    const firstQr = data.qr_codes[0]
    if (firstLink) {
      setSelected({ type: 'link', code: firstLink.short_code, label: firstLink.short_code, subtitle: firstLink.original_url })
    } else if (firstQr) {
      setSelected({ type: 'qr', code: firstQr.qr_code, label: getQRTypeLabel(firstQr.qr_type), subtitle: firstQr.qr_code })
    }
  }, [data, selected])

  useEffect(() => {
    if (!selected) return
    loadAnalytics(selected)
  }, [selected])

  const saveEdit = async (type: 'link' | 'qr', code: string) => {
    if (!editValue.trim()) return
    setEditSaving(true)
    try {
      if (type === 'link') {
        await updateLink(code, editValue.trim())
        setData(d => d ? {
          ...d,
          links: d.links.map(l => l.short_code === code ? { ...l, original_url: editValue.trim() } : l)
        } : d)
        if (selected?.type === 'link' && selected.code === code) {
          setSelected(s => s ? { ...s, subtitle: editValue.trim() } : s)
        }
      } else {
        await updateQR(code, editValue.trim())
        setData(d => d ? {
          ...d,
          qr_codes: d.qr_codes.map(q => q.qr_code === code ? { ...q, content: editValue.trim() } : q)
        } : d)
      }
      setEditingCode(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setEditSaving(false)
    }
  }

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await getDashboard()
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async (item: SelectedItem) => {
    try {
      setAnalyticsLoading(true)
      const result = item.type === 'link' ? await getLinkStats(item.code) : await getQRStats(item.code)
      setAnalytics(result)
    } catch (err: any) {
      setError(err.message)
      setAnalytics(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const chartData = useMemo(() => {
    if (!analytics) return []
    const points = 'daily_clicks' in analytics ? analytics.daily_clicks : analytics.daily_scans
    return points.map(point => ({ date: point.date.slice(5), value: point.count }))
  }, [analytics])

  const deviceData = useMemo(() => analytics?.devices.map(item => ({
    name: item.device_type,
    value: item.count,
  })) ?? [], [analytics])

  const countryData = useMemo(() => analytics?.countries.map(item => ({
    name: item.country,
    value: item.count,
  })) ?? [], [analytics])

  const referrerData = useMemo(() => {
    if (!analytics || !('referrers' in analytics)) return []
    return analytics.referrers.map(item => ({ name: item.referrer, value: item.count }))
  }, [analytics])

  const totalSelectedEvents = analytics
    ? 'total_clicks' in analytics ? analytics.total_clicks : analytics.total_scans
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00C4A7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={loadDashboard} className="mt-4 px-4 py-2 bg-[#00C4A7] text-white rounded-lg hover:bg-[#00B096] transition-colors">
          Try Again
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* QR Viewer Modal */}
      {viewingQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setViewingQR(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-xs w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-slate-900 dark:text-white">{viewingQR.label}</span>
              <button onClick={() => setViewingQR(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex justify-center mb-3">
              <MiniQR data={viewingQR.content} size={200} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 break-all">{viewingQR.content}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Link2} label="Links" value={data.total_links} />
        <StatCard icon={QrCode} label="QR Codes" value={data.total_qr_codes} />
        <StatCard icon={TrendingUp} label="Clicks" value={data.total_clicks.toLocaleString()} accent />
        <StatCard icon={Eye} label="Scans" value={data.total_scans.toLocaleString()} accent />
      </div>

      {(data.links.length > 0 || data.qr_codes.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-6">
          <section className="card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tracked items</h3>
              <button onClick={loadDashboard} className="text-xs font-semibold text-[#00C4A7] hover:underline">Refresh</button>
            </div>

            {data.links.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Links</div>
                {data.links.map(link => (
                  <div
                    key={link.id}
                    className={`rounded-lg border transition-colors ${
                      selected?.type === 'link' && selected.code === link.short_code
                        ? 'border-[#00C4A7] bg-[#00C4A7]/10'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => setSelected({ type: 'link', code: link.short_code, label: link.short_code, subtitle: link.original_url })}
                      className="w-full text-left p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-semibold text-[#00C4A7]">{link.short_code}</span>
                        <span className="text-xs text-slate-500">{link.click_count} clicks</span>
                      </div>
                      {editingCode === link.short_code ? (
                        <div className="mt-2 flex gap-1" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit('link', link.short_code); if (e.key === 'Escape') setEditingCode(null) }}
                            className="flex-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#00C4A7]"
                            placeholder="New destination URL"
                          />
                          <button onClick={() => saveEdit('link', link.short_code)} disabled={editSaving} className="rounded bg-[#00C4A7] px-2 py-1 text-white hover:bg-[#00B096] transition-colors">
                            <Check size={12} />
                          </button>
                          <button onClick={() => setEditingCode(null)} className="rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-slate-500 hover:text-slate-700 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-400">{link.original_url}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar size={12} />
                          {formatDate(link.created_at)}
                        </div>
                        {editingCode !== link.short_code && (
                          <button
                            onClick={e => { e.stopPropagation(); setEditingCode(link.short_code); setEditValue(link.original_url) }}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#00C4A7] transition-colors"
                          >
                            <Edit2 size={11} /> Re-route
                          </button>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {data.qr_codes.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">QR Codes</div>
                {data.qr_codes.map(qr => (
                  <div
                    key={qr.id}
                    className={`rounded-lg border transition-colors ${
                      selected?.type === 'qr' && selected.code === qr.qr_code
                        ? 'border-[#00C4A7] bg-[#00C4A7]/10'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => setSelected({ type: 'qr', code: qr.qr_code, label: getQRTypeLabel(qr.qr_type), subtitle: qr.qr_code })}
                      className="w-full text-left p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{getQRTypeLabel(qr.qr_type)}</span>
                        <span className="text-xs text-slate-500">{qr.scan_count} scans</span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-400 truncate">{qr.content || qr.qr_code}</p>
                      {editingCode === qr.qr_code && (
                        <div className="mt-2 flex gap-1" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit('qr', qr.qr_code); if (e.key === 'Escape') setEditingCode(null) }}
                            className="flex-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#00C4A7]"
                            placeholder="New destination"
                          />
                          <button onClick={() => saveEdit('qr', qr.qr_code)} disabled={editSaving} className="rounded bg-[#00C4A7] px-2 py-1 text-white hover:bg-[#00B096] transition-colors">
                            <Check size={12} />
                          </button>
                          <button onClick={() => setEditingCode(null)} className="rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-slate-500 hover:text-slate-700 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar size={12} />
                          {formatDate(qr.created_at)}
                        </div>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setViewingQR({ content: qr.content || qr.qr_code, label: getQRTypeLabel(qr.qr_type) })}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#00C4A7] transition-colors"
                          >
                            <QrCode size={11} /> View
                          </button>
                          {editingCode !== qr.qr_code && (
                            <button
                              onClick={() => { setEditingCode(qr.qr_code); setEditValue(qr.content || '') }}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#00C4A7] transition-colors"
                            >
                              <Edit2 size={11} /> Re-route
                            </button>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-5">
            {selected ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      {selected.type === 'link' ? <Link2 size={16} /> : <QrCode size={16} />}
                      {selected.type === 'link' ? 'Link analytics' : 'QR analytics'}
                    </div>
                    <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white truncate">{selected.label}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 truncate">{selected.subtitle}</p>
                  </div>
                  <div className="rounded-lg bg-[#00C4A7]/10 px-4 py-2 text-right">
                    <div className="text-2xl font-bold text-[#00C4A7]">{totalSelectedEvents.toLocaleString()}</div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {selected.type === 'link' ? 'clicks' : 'scans'}
                    </div>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="grid h-[360px] place-items-center text-sm text-slate-500">Loading analytics...</div>
                ) : (
                  <>
                    <ChartPanel title="Activity over time">
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="5%" stopColor="#00C4A7" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#00C4A7" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                          <Tooltip />
                          <Area type="monotone" dataKey="value" stroke="#00C4A7" strokeWidth={2} fill="url(#activityFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartPanel>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <ChartPanel title="Devices">
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={deviceData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={78} paddingAngle={3}>
                              {deviceData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <Legend items={deviceData} />
                      </ChartPanel>

                      <ChartPanel title={selected.type === 'link' ? 'Top referrers' : 'Top countries'}>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={selected.type === 'link' ? referrerData : countryData} layout="vertical" margin={{ left: 10, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" allowDecimals={false} fontSize={12} />
                            <YAxis type="category" dataKey="name" width={90} fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartPanel>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      )}

      {data.links.length === 0 && data.qr_codes.length === 0 && <EmptyState />}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, accent = false }: { icon: typeof Link2; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm mb-1">
        <Icon size={16} />
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${accent ? 'text-[#00C4A7]' : 'text-slate-900 dark:text-white'}`}>{value}</div>
    </div>
  )
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
        <BarChart3 size={16} className="text-[#00C4A7]" />
        {title}
      </div>
      {children}
    </div>
  )
}

function Legend({ items }: { items: Array<{ name: string; value: number }> }) {
  if (items.length === 0) return <p className="text-center text-sm text-slate-500">No data yet</p>
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      {items.map((item, index) => (
        <div key={item.name} className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 truncate">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="truncate">{item.name}</span>
          </span>
          <span className="font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
        <BarChart3 size={32} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No tracked items yet</h3>
      <p className="text-slate-600 dark:text-slate-400">Create a link or QR code and track it to start seeing analytics.</p>
    </div>
  )
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

function getQRTypeLabel(type: string) {
  const labels: Record<string, string> = {
    link: 'Link',
    wifi: 'WiFi',
    vcard: 'Contact',
    email: 'Email',
    sms: 'SMS',
    phone: 'Phone',
  }
  return labels[type] || type
}
