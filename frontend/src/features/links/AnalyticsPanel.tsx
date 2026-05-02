import { useEffect, useState, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { BarChart2, Globe, Monitor, Smartphone, Tablet, Wifi, X } from 'lucide-react'
import type { StatsResponse } from './types'

const COLORS = ['#00C4A7', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
const DEVICE_ICON: Record<string, React.ReactNode> = {
  desktop: <Monitor size={14} />,
  mobile: <Smartphone size={14} />,
  tablet: <Tablet size={14} />,
  unknown: <Wifi size={14} />,
}

interface Props {
  shortCode: string
  shortUrl: string
  onClose: () => void
}

export default function AnalyticsPanel({ shortCode, shortUrl, onClose }: Props) {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [liveCount, setLiveCount] = useState(0)
  const sseRef = useRef<EventSource | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/links/${shortCode}/stats`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))

    // SSE live counter
    const es = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/links/${shortCode}/live`)
    sseRef.current = es
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (!data.connected) {
        setLiveCount(c => c + 1)
        setStats(s => s ? { ...s, total_clicks: s.total_clicks + 1 } : s)
      }
    }
    return () => { es.close() }
  }, [shortCode])

  return (
    <div className="card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BarChart2 size={18} className="text-[#00C4A7]" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Analytics</h3>
            {liveCount > 0 && (
              <span className="relative flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-ring" />
                +{liveCount} live
              </span>
            )}
          </div>
          <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#00C4A7] hover:underline">
            {shortUrl}
          </a>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-[#00C4A7] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !stats ? (
        <p className="text-sm text-center text-slate-400 py-8">No data yet</p>
      ) : (
        <>
          {/* Total */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Total Clicks" value={stats.total_clicks} />
            <StatBox label="Countries" value={stats.countries.length} />
            <StatBox label="Referrers" value={stats.referrers.length} />
            <StatBox label="Device Types" value={stats.devices.length} />
          </div>

          {/* Daily clicks chart */}
          {stats.daily_clicks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Daily Clicks</h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats.daily_clicks} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#00C4A7' }}
                  />
                  <Bar dataKey="count" fill="#00C4A7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Devices */}
            {stats.devices.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Devices</h4>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={stats.devices} dataKey="count" nameKey="device_type" cx="50%" cy="50%" outerRadius={50} label={({ device_type, percent }) => `${device_type} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {stats.devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-1">
                  {stats.devices.map((d, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {DEVICE_ICON[d.device_type]} {d.device_type} ({d.count})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Countries */}
            {stats.countries.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Globe size={12} /> Top Countries
                </h4>
                <div className="space-y-1.5">
                  {stats.countries.slice(0, 6).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-700 dark:text-slate-300 min-w-[120px] truncate">{c.country}</span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#00C4A7]"
                          style={{ width: `${Math.round((c.count / stats.total_clicks) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Referrers */}
          {stats.referrers.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Top Referrers</h4>
              <div className="space-y-1.5">
                {stats.referrers.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-700 dark:text-slate-300 min-w-[120px] truncate">{r.referrer}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.round((r.count / stats.total_clicks) * 100)}%`, background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Google Ad */}
        </>
      )}
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}
