import { useState } from 'react'
import { ExternalLink, Trash2, BarChart2, Search, Copy, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { LinkItem } from './types'
import AdUnit from '../../components/AdUnit'

interface Props {
  links: LinkItem[]
  loading: boolean
  onDelete: (code: string) => void
  onSelect: (code: string) => void
  selectedCode: string | null
}

export default function LinkDashboard({ links, loading, onDelete, onSelect, selectedCode }: Props) {
  const [search, setSearch] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copy = async (url: string, code: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filtered = links.filter(l =>
    l.short_url.toLowerCase().includes(search.toLowerCase()) ||
    l.original_url.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="card p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00C4A7] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="card overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search links…"
            className="input-field pl-9 text-sm py-2"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-slate-400 dark:text-slate-500">
          <ExternalLink size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'No links match your search.' : 'No links yet. Start by shortening one!'}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {filtered.map(link => (
            <div
              key={link.short_code}
              className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${selectedCode === link.short_code ? 'bg-[#00C4A7]/5 dark:bg-[#00C4A7]/10' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <a
                      href={link.short_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00C4A7] font-semibold text-sm hover:underline truncate"
                    >
                      {link.short_url}
                    </a>
                    <button onClick={() => copy(link.short_url, link.short_code)} className="text-slate-400 hover:text-[#00C4A7] transition-colors shrink-0">
                      {copiedCode === link.short_code ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{link.original_url}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <BarChart2 size={11} />
                      {link.click_count} click{link.click_count !== 1 ? 's' : ''}
                    </span>
                    <span>{formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}</span>
                    {link.expires_at && (
                      <span className="text-amber-500">Expires {new Date(link.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onSelect(link.short_code)}
                    title="View Analytics"
                    className={`p-1.5 rounded-lg transition-colors ${
                      selectedCode === link.short_code
                        ? 'bg-[#00C4A7]/20 text-[#00C4A7]'
                        : 'text-slate-400 hover:text-[#00C4A7] hover:bg-[#00C4A7]/10'
                    }`}
                  >
                    <BarChart2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(link.short_code)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Google Ad */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        <AdUnit slot="1122334455" format="rectangle" />
      </div>
    </div>
  )
}
