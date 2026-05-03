import { useState } from 'react'
import {
  Link2, ChevronDown, ChevronUp, Wand2, Settings2, Sparkles,
  Phone, MessageSquare, MessageCircle, Mail, Globe, type LucideIcon,
} from 'lucide-react'
import type { ShortenRequest, ShortenResponse } from './types'
import InfoTooltip from '../../components/InfoTooltip'
import { getToken, getUser } from '../../lib/auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Link Types ────────────────────────────────────────────────────────────────
type LinkType = 'url' | 'call' | 'sms' | 'whatsapp' | 'email'

const LINK_TYPES: Array<{ key: LinkType; label: string; icon: LucideIcon; description: string }> = [
  { key: 'url',       label: 'URL',       icon: Globe,         description: 'Website link' },
  { key: 'call',      label: 'Call',      icon: Phone,         description: 'Phone call' },
  { key: 'sms',       label: 'SMS',       icon: MessageSquare, description: 'Text message' },
  { key: 'whatsapp',  label: 'WhatsApp',  icon: MessageCircle, description: 'wa.me' },
  { key: 'email',     label: 'Email',     icon: Mail,          description: 'mailto:' },
]

function LinkTypeButton({
  t, active, onClick,
}: { t: typeof LINK_TYPES[number]; active: boolean; onClick: () => void }) {
  const Icon = t.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border px-3 py-2 text-left transition border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? 'text-[#00C4A7]' : 'text-slate-400 dark:text-slate-500'}`} />
        <span className={`text-sm font-semibold ${active ? 'text-[#00C4A7]' : ''}`}>{t.label}</span>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{t.description}</div>
    </button>
  )
}

function LinkTypeSelector({ value, onChange }: { value: LinkType; onChange: (k: LinkType) => void }) {
  const [showMore, setShowMore] = useState(value !== 'url')
  const selected = LINK_TYPES.find(t => t.key === value) ?? LINK_TYPES[0]
  const rest = LINK_TYPES.filter(t => t.key !== value)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1">
        <LinkTypeButton t={selected} active={true} onClick={() => {}} />
      </div>
      <button
        type="button"
        onClick={() => setShowMore(o => !o)}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-[#00C4A7] transition-colors"
      >
        {showMore ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        More types
      </button>
      {showMore && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {rest.map(t => (
            <LinkTypeButton
              key={t.key} t={t} active={false}
              onClick={() => { onChange(t.key); setShowMore(false) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function buildLinkUrl(type: LinkType, fields: Record<string, string>): string {
  switch (type) {
    case 'url': {
      const u = fields.url?.trim() || ''
      return u.startsWith('http') ? u : `https://${u}`
    }
    case 'call':
      return `tel:${fields.phone?.replace(/\s/g, '') || ''}`
    case 'sms':
      return fields.message
        ? `sms:${fields.phone?.replace(/\s/g, '') || ''}?body=${encodeURIComponent(fields.message)}`
        : `sms:${fields.phone?.replace(/\s/g, '') || ''}`
    case 'whatsapp': {
      const num = (fields.phone || '').replace(/[\s\-+()]/g, '')
      return fields.message
        ? `https://wa.me/${num}?text=${encodeURIComponent(fields.message)}`
        : `https://wa.me/${num}`
    }
    case 'email': {
      let href = `mailto:${fields.email || ''}`
      const params: string[] = []
      if (fields.subject) params.push(`subject=${encodeURIComponent(fields.subject)}`)
      if (fields.body) params.push(`body=${encodeURIComponent(fields.body)}`)
      if (params.length) href += '?' + params.join('&')
      return href
    }
  }
}

interface Props {
  onResult: (r: ShortenResponse) => void
  onRefreshLinks: () => void
  onLoadingChange?: (loading: boolean) => void
  onTrackClick?: () => void
  onSignUpClick?: () => void
}

export default function ShortenForm({ onResult, onRefreshLinks, onLoadingChange, onSignUpClick }: Props) {
  const isLoggedIn = !!getUser()

  const [linkType, setLinkType] = useState<LinkType>('url')
  const [fields, setFields] = useState<Record<string, string>>({
    url: '', phone: '', message: '', email: '', subject: '', body: '',
  })
  const [alias, setAlias] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [utm, setUtm] = useState({ source: '', medium: '', campaign: '', content: '', term: '' })
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState('')

  const f = (k: string, v: string) => setFields(prev => ({ ...prev, [k]: v }))

  const builtUrl = buildLinkUrl(linkType, fields)
  const isValid = builtUrl.length > 4

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) { setError('Please fill in the required fields'); return }
    setError('')
    setLoading(true)
    setLoadingProgress(0)
    onLoadingChange?.(true)

    const progressSteps = [
      { progress: 15, delay: 200 },
      { progress: 35, delay: 300 },
      { progress: 55, delay: 250 },
      { progress: 75, delay: 200 },
      { progress: 90, delay: 150 },
    ]
    for (const step of progressSteps) {
      await new Promise(r => setTimeout(r, step.delay))
      setLoadingProgress(step.progress)
    }

    try {
      // Build final URL with UTM if any
      let finalUrl = builtUrl
      if (linkType === 'url') {
        const utmParams = new URLSearchParams()
        Object.entries(utm).forEach(([k, v]) => { if (v) utmParams.set(`utm_${k}`, v) })
        const utmStr = utmParams.toString()
        if (utmStr) finalUrl += (finalUrl.includes('?') ? '&' : '?') + utmStr
      }

      const body: ShortenRequest = {
        url: finalUrl,
        custom_alias: alias.trim() || undefined,
        expires_at: expiresAt || undefined,
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
      onResult(data)
      onRefreshLinks()
      setFields({ url: '', phone: '', message: '', email: '', subject: '', body: '' })
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

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">

      {/* Link Type Selector */}
      <LinkTypeSelector value={linkType} onChange={(k) => { setLinkType(k); setError('') }} />

      {/* Dynamic input based on type */}
      {linkType === 'url' && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-[#00C4A7] transition">
          <div className="pl-4 shrink-0"><Link2 size={18} className="text-[#00C4A7]" /></div>
          <input
            type="text"
            value={fields.url}
            onChange={e => { f('url', e.target.value); setError('') }}
            placeholder="Paste your long URL here…"
            className="flex-1 py-3 pr-4 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-base"
            autoFocus
          />
        </div>
      )}

      {(linkType === 'call' || linkType === 'sms' || linkType === 'whatsapp') && (
        <div className="space-y-2">
          <input
            type="tel"
            value={fields.phone}
            onChange={e => f('phone', e.target.value)}
            placeholder={linkType === 'whatsapp' ? '+1 234 567 8900' : 'Phone number'}
            className="input-field text-sm py-2.5"
            autoFocus
          />
          {(linkType === 'sms' || linkType === 'whatsapp') && (
            <textarea
              value={fields.message}
              onChange={e => f('message', e.target.value)}
              placeholder="Pre-filled message (optional)"
              rows={3}
              className="input-field text-sm py-2 resize-none"
            />
          )}
        </div>
      )}

      {linkType === 'email' && (
        <div className="space-y-2">
          <input
            type="email"
            value={fields.email}
            onChange={e => f('email', e.target.value)}
            placeholder="recipient@example.com"
            className="input-field text-sm py-2.5"
            autoFocus
          />
          <input
            type="text"
            value={fields.subject}
            onChange={e => f('subject', e.target.value)}
            placeholder="Subject (optional)"
            className="input-field text-sm py-2"
          />
          <textarea
            value={fields.body}
            onChange={e => f('body', e.target.value)}
            placeholder="Message body (optional)"
            rows={3}
            className="input-field text-sm py-2 resize-none"
          />
        </div>
      )}

      {/* Optional Settings */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Custom Alias
                  <InfoTooltip text="Choose a custom ending for your short URL. Leave blank for a random code." />
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 shrink-0">zapkit.link/</span>
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
                  <InfoTooltip text="The link will stop working after this date. Leave blank for permanent." />
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

            {/* UTM only for URL type */}
            {linkType === 'url' && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  <Wand2 size={13} />
                  UTM Parameters
                  <InfoTooltip text="Add UTM tags to track traffic in Google Analytics." />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {loading && (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {loadingProgress < 30 && 'Validating…'}
              {loadingProgress >= 30 && loadingProgress < 60 && 'Generating short link…'}
              {loadingProgress >= 60 && loadingProgress < 90 && 'Saving…'}
              {loadingProgress >= 90 && 'Almost done…'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{loadingProgress}%</div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700 overflow-hidden">
            <div className="bg-[#00C4A7] h-2 rounded-full transition-all duration-200 ease-out" style={{ width: `${loadingProgress}%` }} />
          </div>
        </div>
      )}

      {isLoggedIn ? (
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3">
          {loading ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Shortening…</>
          ) : (
            <><Wand2 size={18} /> Shorten Link</>
          )}
        </button>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4 text-center space-y-3">
          <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">Sign up free to start shortening links</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Free forever · Analytics included · No credit card</div>
          <button type="button" onClick={onSignUpClick} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5">
            <Sparkles size={16} />
            Get started — it's free
          </button>
        </div>
      )}
    </form>
  )
}
