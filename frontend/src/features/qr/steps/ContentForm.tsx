import type { QrContentState, QrType, SocialPlatform } from '../types'
import { Field, Input, Textarea } from './fields'

function RequiredHint({ text }: { text: string }) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-400">
      <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#00C4A7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      {text}
    </div>
  )
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
        <RequiredHint text="Enter a URL to enable QR generation" />
        <Field label="Website URL" required hint="Example: https://example.com">
          <Input value={value.linkUrl} onChange={(v) => patch({ linkUrl: v })} placeholder="https://..." />
        </Field>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tip: paste a domain without https:// and we'll add it automatically.
        </p>
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
        <RequiredHint text="Scanning will dial this number directly — include country code (e.g. +972)" />
        <Field label="Phone number" required hint="Include country code">
          <Input value={value.phoneNumber} onChange={(v) => patch({ phoneNumber: v })} placeholder="+972..." />
        </Field>
      </div>
    )
  }

  if (qrType === 'sms') {
    return (
      <div className="space-y-3">
        <RequiredHint text="Scanning will open a pre-filled SMS on the user's device" />
        <Field label="Phone number" required>
          <Input value={value.phoneNumber} onChange={(v) => patch({ phoneNumber: v })} placeholder="+972..." />
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
        <RequiredHint text="Scanning will open WhatsApp with a pre-filled message" />
        <Field label="Phone number" required hint="Include country code">
          <Input value={value.whatsappNumber} onChange={(v) => patch({ whatsappNumber: v })} placeholder="+972..." />
        </Field>
        <Field label="Message">
          <Textarea value={value.whatsappMessage} onChange={(v) => patch({ whatsappMessage: v })} placeholder="Message" rows={4} />
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
          <Input value={value.vcardPhone} onChange={(v) => patch({ vcardPhone: v })} placeholder="+972..." />
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
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Works with any direct link: PDF documents, images (JPG/PNG), videos (MP4), or hosted files.
        </p>
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
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tip: provide both links for the best experience. The QR will use the iOS link — Android users can still access it.
        </p>
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
