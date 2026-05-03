import { useState } from 'react'
import type { QrContentState, QrType, SocialPlatform } from '../types'
import { Field, Input, Textarea } from './fields'
import InfoTooltip from '../../../components/InfoTooltip'
import { PhoneInput } from '../../../components/PhoneInput'
import { Settings2, ChevronDown, ChevronUp, Wand2 } from 'lucide-react'


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

// ── Link Content Form with Optional Settings ──────────────────────────────────
function LinkContentForm({ value, patch }: { value: QrContentState; patch: (p: Partial<QrContentState>) => void }) {
  const [optionsOpen, setOptionsOpen] = useState(false)
  const utm = value.linkUtm ?? { source: '', medium: '', campaign: '', content: '', term: '' }

  return (
    <div className="space-y-3">
      <Field label="Website URL" required>
        <Input value={value.linkUrl} onChange={(v) => patch({ linkUrl: v })} placeholder="yourwebsite.com" />
      </Field>

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
                    value={value.linkAlias ?? ''}
                    onChange={e => patch({ linkAlias: e.target.value.replace(/[^a-z0-9-_]/gi, '').toLowerCase() })}
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
                  value={value.linkExpiresAt ?? ''}
                  onChange={e => patch({ linkExpiresAt: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field text-sm py-2 w-full max-w-full"
                  style={{ minWidth: 0 }}
                />
              </div>
            </div>

            {/* UTM Parameters */}
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
                      onChange={e => patch({ linkUtm: { ...utm, [key]: e.target.value } })}
                      placeholder={key === 'source' ? 'e.g. twitter' : key === 'medium' ? 'e.g. social' : ''}
                      className="input-field text-xs py-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type Props = {
  qrType: QrType
  value: QrContentState
  onChange: (next: QrContentState) => void
}

export function ContentForm({ qrType, value, onChange }: Props) {
  const patch = (p: Partial<QrContentState>) => onChange({ ...value, ...p })

  if (qrType === 'link') {
    return <LinkContentForm value={value} patch={patch} />
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
