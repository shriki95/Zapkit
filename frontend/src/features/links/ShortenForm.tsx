import { useState } from 'react'
import { Link2, ChevronDown, ChevronUp, Wand2, Settings2 } from 'lucide-react'
import type { ShortenRequest, ShortenResponse } from './types'
import { incrementUsage } from '../../components/UsageModal'
import AdModal from '../../components/AdModal'
import InfoTooltip from '../../components/InfoTooltip'
import { getToken } from '../../lib/auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Props {
  onResult: (r: ShortenResponse) => void
  onRefreshLinks: () => void
  onLoadingChange?: (loading: boolean) => void
  onTrackClick?: () => void
}

export default function ShortenForm({ onResult, onRefreshLinks, onLoadingChange }: Props) {
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [utmOpen, setUtmOpen] = useState(false)
  const [utm, setUtm] = useState({ source: '', medium: '', campaign: '', content: '', term: '' })
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState('')
  const [showAdModal, setShowAdModal] = useState(false)
  const [pendingResult, setPendingResult] = useState<ShortenResponse | null>(null)
  const [linkCount, setLinkCount] = useState(0)

  const isValidUrl = (v: string) => {
    try { new URL(v.startsWith('http') ? v : `https://${v}`); return true } catch { return false }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) { setError('Please enter a URL'); return }
    if (!isValidUrl(url.trim())) { setError('Please enter a valid URL'); return }
    setError('')
    setLoading(true)
    setLoadingProgress(0)
    onLoadingChange?.(true)
    
    // Simulate loading progress with realistic steps
    const progressSteps = [
      { progress: 15, delay: 200, message: 'Validating URL...' },
      { progress: 35, delay: 300, message: 'Checking availability...' },
      { progress: 55, delay: 250, message: 'Generating short code...' },
      { progress: 75, delay: 200, message: 'Saving to database...' },
      { progress: 90, delay: 150, message: 'Finalizing...' },
    ]
    
    for (const step of progressSteps) {
      await new Promise(r => setTimeout(r, step.delay))
      setLoadingProgress(step.progress)
    }
    
    try {
      const body: ShortenRequest = {
        url: url.trim(),
        custom_alias: alias.trim() || undefined,
        expires_at: expiresAt || undefined,
        utm_source: utm.source || undefined,
        utm_medium: utm.medium || undefined,
        utm_campaign: utm.campaign || undefined,
        utm_content: utm.content || undefined,
        utm_term: utm.term || undefined,
      }
      const res = await fetch(`${API}/api/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail ?? 'Failed to shorten URL')
      }
      
      setLoadingProgress(100)
      await new Promise(r => setTimeout(r, 200))
      
      const data: ShortenResponse = await res.json()
      
      // Check if we should show ad (every 2 links)
      const newCount = linkCount + 1
      setLinkCount(newCount)
      
      if (newCount % 2 === 0) {
        // Show ad modal
        setPendingResult(data)
        setShowAdModal(true)
      } else {
        // Show result immediately
        onResult(data)
      }
      
      incrementUsage()
      onRefreshLinks()
      setUrl('')
      setAlias('')
      setExpiresAt('')
      setUtm({ source: '', medium: '', campaign: '', content: '', term: '' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingProgress(0)
      onLoadingChange?.(false)
    }
  }

  const handleAdClose = () => {
    setShowAdModal(false)
    if (pendingResult) {
      onResult(pendingResult)
      setPendingResult(null)
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      {/* Main URL input */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-[#00C4A7] transition">
        <div className="pl-4 shrink-0">
          <Link2 size={18} className="text-[#00C4A7]" />
        </div>
        <input
          type="text"
          value={url}
          onChange={e => { setUrl(e.target.value); setError('') }}
          placeholder="Paste your long URL here…"
          className="flex-1 py-3 pr-4 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-base"
          autoFocus
        />
      </div>

      {/* Optional Settings — collapsed by default */}
      <div>
        <button
          type="button"
          onClick={() => setOptionsOpen(o => !o)}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-[#00C4A7] transition-colors"
        >
          <Settings2 size={13} />
          Optional settings
          {optionsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {optionsOpen && (
          <div className="mt-3 space-y-3">
            {/* Custom Alias + Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Custom Alias
                  <InfoTooltip text="Choose a custom ending for your short URL (e.g. tinylink.pro/my-brand). Leave blank for a random code." />
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 shrink-0">tinylink.pro/</span>
                  <input
                    type="text"
                    value={alias}
                    onChange={e => setAlias(e.target.value.replace(/[^a-z0-9-_]/gi, '').toLowerCase())}
                    placeholder="my-link"
                    className="input-field text-sm py-2"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Expiry Date
                  <InfoTooltip text="The link will stop working after this date. Leave blank for a permanent link." />
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field text-sm py-2 w-full max-w-full"
                  style={{ minWidth: 0 }}
                />
              </div>
            </div>

            {/* UTM Builder */}
            <div>
              <button
                type="button"
                onClick={() => setUtmOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-[#00C4A7] transition-colors"
              >
                <Wand2 size={13} />
                UTM Parameters
                <InfoTooltip text="Add UTM tags to track where your traffic comes from in Google Analytics (source, medium, campaign)." />
                {utmOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {utmOpen && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['source', 'medium', 'campaign', 'content', 'term'] as const).map(key => (
                    <div key={key}>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 capitalize">utm_{key}</label>
                      <input
                        type="text"
                        value={utm[key]}
                        onChange={e => setUtm(u => ({ ...u, [key]: e.target.value }))}
                        placeholder={key === 'source' ? 'e.g. twitter' : key === 'medium' ? 'e.g. social' : ''}
                        className="input-field text-xs py-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {loading && (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {loadingProgress < 30 && 'Validating URL...'}
              {loadingProgress >= 30 && loadingProgress < 60 && 'Generating short code...'}
              {loadingProgress >= 60 && loadingProgress < 90 && 'Saving to database...'}
              {loadingProgress >= 90 && 'Almost done...'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              {loadingProgress}%
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700 overflow-hidden">
            <div
              className="bg-[#00C4A7] h-2 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3">
        {loading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Shortening…
          </>
        ) : (
          <>
            <Wand2 size={18} />
            Shorten Link
          </>
        )}
      </button>

      {/* Ad Modal */}
      <AdModal isOpen={showAdModal} onClose={handleAdClose} waitTime={5} />
    </form>
  )
}
