import { useEffect, useRef, useState } from 'react'

export const COUNTRY_CODES = [
  { code: '+1',   flag: '🇺🇸', name: 'United States / Canada' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+30',  flag: '🇬🇷', name: 'Greece' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgium' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+36',  flag: '🇭🇺', name: 'Hungary' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+40',  flag: '🇷🇴', name: 'Romania' },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43',  flag: '🇦🇹', name: 'Austria' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+45',  flag: '🇩🇰', name: 'Denmark' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+51',  flag: '🇵🇪', name: 'Peru' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+84',  flag: '🇻🇳', name: 'Vietnam' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+93',  flag: '🇦🇫', name: 'Afghanistan' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+98',  flag: '🇮🇷', name: 'Iran' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+218', flag: '🇱🇾', name: 'Libya' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: '+354', flag: '🇮🇸', name: 'Iceland' },
  { code: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+381', flag: '🇷🇸', name: 'Serbia' },
  { code: '+385', flag: '🇭🇷', name: 'Croatia' },
  { code: '+386', flag: '🇸🇮', name: 'Slovenia' },
  { code: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+421', flag: '🇸🇰', name: 'Slovakia' },
  { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
]

export function PhoneInput({
  value,
  onChange,
  placeholder = 'Phone number',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const matchedCode = COUNTRY_CODES.find(c => value.startsWith(c.code))
  const selectedCode = matchedCode?.code ?? ''
  const selectedEntry = matchedCode ?? null
  const localNumber = matchedCode ? value.slice(matchedCode.code.length) : value.replace(/^\+\d{1,4}/, '')

  const filtered = COUNTRY_CODES
    .filter((c, i, arr) => arr.findIndex(x => x.code === c.code) === i)
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search) ||
      (search.startsWith('+') && c.code.startsWith(search))
    )

  const handleCodeSelect = (newCode: string) => {
    onChange(newCode + localNumber)
    setSearch('')
    setOpen(false)
  }

  const handleNumberChange = (num: string) => {
    onChange(selectedCode + num.replace(/[^0-9\s\-()]/g, ''))
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="flex gap-2">
      {/* Country code button */}
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => { setOpen(o => !o); setSearch('') }}
          className="flex items-center gap-1.5 h-full min-w-[88px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none hover:border-[#00C4A7] focus:ring-2 focus:ring-[#00C4A7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
        >
          <span className="text-base leading-none">{selectedEntry ? selectedEntry.flag : '🌍'}</span>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{selectedEntry ? selectedEntry.code : ''}</span>
          <svg className="text-slate-400 shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type country or +code…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#00C4A7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">No results</div>
              ) : filtered.map(c => (
                <button
                  key={`${c.code}-${c.name}`}
                  type="button"
                  onClick={() => handleCodeSelect(c.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    c.code === selectedCode ? 'bg-[#00C4A7]/10 text-[#00C4A7]' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 w-10 shrink-0">{c.code}</span>
                  <span className="truncate text-xs">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Local number */}
      <input
        type="tel"
        value={localNumber}
        onChange={e => handleNumberChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#00C4A7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </div>
  )
}
