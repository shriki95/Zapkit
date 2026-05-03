import { useEffect, useRef, useState } from 'react'
import type { QrContentState, QrType, SocialPlatform } from '../types'
import { Field, Input, Textarea } from './fields'
import InfoTooltip from '../../../components/InfoTooltip'

// ── Country Code Picker ───────────────────────────────────────────────────────
const COUNTRY_CODES = [
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
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
]

function PhoneInput({ value, onChange, placeholder = 'Phone number' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Split value into countryCode + localNumber
  const matchedCode = COUNTRY_CODES.find(c => value.startsWith(c.code))
  const selectedCode = matchedCode?.code ?? ''
  const selectedEntry = matchedCode ?? null
  const localNumber = matchedCode ? value.slice(matchedCode.code.length) : value.replace(/^\+\d{1,4}/, '')

  const filtered = COUNTRY_CODES
    .filter((c, i, arr) => arr.findIndex(x => x.code === c.code) === i) // unique codes
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

  // Close on outside click
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
          <svg className="text-slate-400 shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
            {/* Search input */}
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
            {/* List */}
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

function RequiredHint({ text }: { text: string }) {
  return <InfoTooltip text={text} />
}

const SOCIAL_PLATFORMS: Array<{ key: SocialPlatform; label: string; placeholder: string; color: string }> = [
  { key: 'instagram', label: 'Instagram', placeholder: 'username',     color: '#E1306C' },
  { key: 'tiktok',    label: 'TikTok',    placeholder: 'username',     color: '#010101' },
  { key: 'youtube',   label: 'YouTube',   placeholder: '@channel',     color: '#FF0000' },
  { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'profile-name', color: '#0A66C2' },
  { key: 'twitter',   label: 'X (Twitter)', placeholder: 'username',   color: '#000000' },
  { key: 'facebook',  label: 'Facebook',  placeholder: 'page-name',    color: '#1877F2' },
  { key: 'snapchat',  label: 'Snapchat',  placeholder: 'username',     color: '#FFFC00' },
]

type Props = {
  qrType: QrType
  value: QrContentState
  onChange: (next: QrContentState) => void
}

export function ContentForm({ qrType, value, onChange }: Props) {
  const patch = (p: Partial<QrContentState>) => onChange({ ...value, ...p })

  if (qrType === 'link') {
    return (
      <div className="space-y-3">
        <Field label="Website URL" required>
          <Input value={value.linkUrl} onChange={(v) => patch({ linkUrl: v })} placeholder="yourwebsite.com" />
        </Field>
      </div>
    )
  }

  if (qrType === 'text') {
    return (
      <div className="space-y-3">
        <RequiredHint text="The text will be displayed when the QR code is scanned" />
        <Field label="Text" required hint="Up to ~1000 chars recommended">
          <Textarea value={value.text} onChange={(v) => patch({ text: v })} placeholder="Enter your text here..." rows={5} />
        </Field>
      </div>
    )
  }

  if (qrType === 'email') {
    return (
      <div className="space-y-3">
        <RequiredHint text="Scanning will open a pre-filled email draft on the user's device" />
        <Field label="Email" required>
          <Input value={value.emailTo} onChange={(v) => patch({ emailTo: v })} placeholder="name@company.com" />
        </Field>
        <Field label="Subject">
          <Input value={value.emailSubject} onChange={(v) => patch({ emailSubject: v })} placeholder="Subject" />
        </Field>
        <Field label="Message">
          <Textarea value={value.emailBody} onChange={(v) => patch({ emailBody: v })} placeholder="Message" rows={4} />
        </Field>
      </div>
    )
  }

  if (qrType === 'call') {
    return (
      <div className="space-y-3">
        <RequiredHint text="Scanning will dial this number directly. Select your country code from the list." />
        <Field label="Phone number" required>
          <PhoneInput value={value.phoneNumber} onChange={(v) => patch({ phoneNumber: v })} placeholder="50 1234567" />
        </Field>
      </div>
    )
  }

  if (qrType === 'sms') {
    return (
      <div className="space-y-3">
        <RequiredHint text="Scanning will open a pre-filled SMS on the user's device" />
        <Field label="Phone number" required>
          <PhoneInput value={value.phoneNumber} onChange={(v) => patch({ phoneNumber: v })} placeholder="50 1234567" />
        </Field>
        <Field label="Message">
          <Textarea value={value.smsMessage} onChange={(v) => patch({ smsMessage: v })} placeholder="Message" rows={4} />
        </Field>
      </div>
    )
  }

  if (qrType === 'whatsapp') {
    return (
      <div className="space-y-3">
        <RequiredHint text="Scanning will open WhatsApp with a pre-filled message. Select your country code." />
        <Field label="WhatsApp number" required>
          <PhoneInput value={value.whatsappNumber} onChange={(v) => patch({ whatsappNumber: v })} placeholder="50 1234567" />
        </Field>
        <Field label="Message (optional)">
          <Textarea value={value.whatsappMessage} onChange={(v) => patch({ whatsappMessage: v })} placeholder="Hi! I scanned your QR code..." rows={4} />
        </Field>
      </div>
    )
  }

  if (qrType === 'wifi') {
    return (
      <div className="space-y-3">
        <RequiredHint text="Scanning will connect the device to this Wi-Fi automatically" />
        <Field label="Network name (SSID)" required>
          <Input value={value.wifiSsid} onChange={(v) => patch({ wifiSsid: v })} placeholder="Wi‑Fi name" />
        </Field>
        <Field label="Password">
          <Input value={value.wifiPassword} onChange={(v) => patch({ wifiPassword: v })} placeholder="Password" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Encryption</div>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={value.wifiEncryption}
              onChange={(e) => patch({ wifiEncryption: e.target.value as QrContentState['wifiEncryption'] })}
            >
              <option value="WPA">WPA / WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No password</option>
            </select>
          </label>
          <label className="flex items-end gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[color:var(--brand)]"
              checked={value.wifiHidden}
              onChange={(e) => patch({ wifiHidden: e.target.checked })}
            />
            Hidden network
          </label>
        </div>
      </div>
    )
  }

  if (qrType === 'vcard') {
    return (
      <div className="space-y-3">
        <RequiredHint text="Scanning will offer to save this person as a contact" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" required>
            <Input value={value.vcardFirstName} onChange={(v) => patch({ vcardFirstName: v })} placeholder="First name" />
          </Field>
          <Field label="Last name">
            <Input value={value.vcardLastName} onChange={(v) => patch({ vcardLastName: v })} placeholder="Last name" />
          </Field>
        </div>
        <Field label="Phone number">
          <PhoneInput value={value.vcardPhone} onChange={(v) => patch({ vcardPhone: v })} placeholder="50 1234567" />
        </Field>
        <Field label="E-mail">
          <Input value={value.vcardEmail} onChange={(v) => patch({ vcardEmail: v })} placeholder="name@company.com" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company">
            <Input value={value.vcardCompany} onChange={(v) => patch({ vcardCompany: v })} placeholder="Company" />
          </Field>
          <Field label="Job title">
            <Input value={value.vcardTitle} onChange={(v) => patch({ vcardTitle: v })} placeholder="Job title" />
          </Field>
        </div>
        <Field label="Website">
          <Input value={value.vcardWebsite} onChange={(v) => patch({ vcardWebsite: v })} placeholder="https://..." />
        </Field>
      </div>
    )
  }

  if (qrType === 'event') {
    return (
      <div className="space-y-3">
        <RequiredHint text="Scanning will add this event to the user's calendar" />
        <Field label="Title" required>
          <Input value={value.eventTitle} onChange={(v) => patch({ eventTitle: v })} placeholder="Event title" />
        </Field>
        <Field label="Location">
          <Input value={value.eventLocation} onChange={(v) => patch({ eventLocation: v })} placeholder="Location" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start" required>
            <Input value={value.eventStart} onChange={(v) => patch({ eventStart: v })} type="datetime-local" />
          </Field>
          <Field label="End">
            <Input value={value.eventEnd} onChange={(v) => patch({ eventEnd: v })} type="datetime-local" />
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={value.eventDescription} onChange={(v) => patch({ eventDescription: v })} placeholder="Description" rows={3} />
        </Field>
      </div>
    )
  }

  if (qrType === 'media') {
    return (
      <div className="space-y-3">
        <RequiredHint text="Scanning will open the file or media in the browser" />
        <Field label="URL" required hint="PDF / Image / Video">
          <Input value={value.mediaUrl} onChange={(v) => patch({ mediaUrl: v })} placeholder="https://..." />
        </Field>
        <InfoTooltip text="Works with any direct link: PDF documents, images (JPG/PNG), videos (MP4), or hosted files." />
      </div>
    )
  }

  if (qrType === 'app') {
    return (
      <div className="space-y-3">
        <RequiredHint text="Scanning will open the app in the correct store for the user's device" />
        <Field label="App Store URL (iOS)" hint="Optional if Play Store provided">
          <Input
            value={value.appStoreUrl}
            onChange={(v) => patch({ appStoreUrl: v })}
            placeholder="https://apps.apple.com/app/..."
          />
        </Field>
        <Field label="Google Play URL (Android)" hint="Optional if App Store provided">
          <Input
            value={value.playStoreUrl}
            onChange={(v) => patch({ playStoreUrl: v })}
            placeholder="https://play.google.com/store/apps/..."
          />
        </Field>
        <InfoTooltip text="Tip: provide both links for the best experience. The QR will use the iOS link, and Android users can still access it." />
      </div>
    )
  }

  if (qrType === 'social') {
    const selected = SOCIAL_PLATFORMS.find(p => p.key === value.socialPlatform) ?? SOCIAL_PLATFORMS[0]
    return (
      <div className="space-y-3">
        <div>
          <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Platform</div>
          <div className="grid grid-cols-2 gap-2">
            {SOCIAL_PLATFORMS.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => patch({ socialPlatform: p.key })}
                className={[
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition',
                  value.socialPlatform === p.key
                    ? 'border-[#00C4A7]/40 bg-[#00C4A7]/5 text-slate-900 dark:bg-[#00C4A7]/10 dark:text-slate-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <Field label={`${selected.label} username`} required>
          <Input
            value={value.socialHandle}
            onChange={v => patch({ socialHandle: v })}
            placeholder={selected.placeholder}
          />
        </Field>
        {value.socialHandle.trim() && (
          <p className="text-xs text-slate-500 dark:text-slate-400 break-all">
            → {buildSocialPreview(value.socialPlatform, value.socialHandle)}
          </p>
        )}
      </div>
    )
  }

  return <div className="text-sm text-slate-400">Unsupported type.</div>
}

function buildSocialPreview(platform: SocialPlatform, handle: string): string {
  const h = handle.trim().replace(/^@/, '')
  switch (platform) {
    case 'instagram': return `instagram.com/${h}`
    case 'tiktok':    return `tiktok.com/@${h}`
    case 'youtube':   return `youtube.com/@${h}`
    case 'linkedin':  return `linkedin.com/in/${h}`
    case 'twitter':   return `x.com/${h}`
    case 'facebook':  return `facebook.com/${h}`
    case 'snapchat':  return `snapchat.com/add/${h}`
    default:          return ''
  }
}
