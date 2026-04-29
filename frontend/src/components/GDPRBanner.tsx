import { useState, useEffect } from 'react'
import { Cookie, ChevronDown, ChevronUp, X } from 'lucide-react'

interface Prefs { analytics: boolean; ads: boolean; thirdParty: boolean }

const STORAGE_KEY = 'tinylink-gdpr-consent'

export default function GDPRBanner() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>({ analytics: true, ads: true, thirdParty: false })

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  const save = (all: boolean) => {
    const chosen = all ? { analytics: true, ads: true, thirdParty: true } : prefs
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ necessary: true, ...chosen }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto card p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <Cookie className="text-[#00C4A7] shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              We use cookies to improve your experience, measure analytics, and show relevant ads.{' '}
              <button onClick={() => setExpanded(e => !e)} className="text-[#00C4A7] underline text-sm inline-flex items-center gap-0.5">
                Manage preferences {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </p>

            {expanded && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                {([ ['analytics', 'Analytics', 'Page views & click events'],
                    ['ads', 'Advertising', 'Relevant ads based on usage'],
                    ['thirdParty', 'Third-party', 'External services & embeds'],
                ] as const).map(([key, label, desc]) => (
                  <label key={key} className="flex items-start gap-2 cursor-pointer p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <input
                      type="checkbox"
                      checked={prefs[key]}
                      onChange={e => setPrefs(p => ({ ...p, [key]: e.target.checked }))}
                      className="mt-0.5 accent-[#00C4A7]"
                    />
                    <span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => save(true)} className="btn-primary text-sm py-1.5 px-4">Accept All</button>
              <button onClick={() => save(false)} className="text-sm px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                Save Preferences
              </button>
            </div>
          </div>
          <button onClick={() => setVisible(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
