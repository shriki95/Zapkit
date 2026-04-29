import { Link, AlignLeft, Mail, Phone, MessageSquare, MessageCircle, Wifi, Contact, CalendarDays, FileImage, Smartphone, Heart, type LucideIcon } from 'lucide-react'
import type { QrType } from './types'

const types: Array<{ key: QrType; label: string; description: string; icon: LucideIcon }> = [
  { key: 'link',      label: 'Link',      description: 'Website URL',    icon: Link },
  { key: 'text',      label: 'Text',      description: 'Plain text',     icon: AlignLeft },
  { key: 'email',     label: 'Email',     description: 'mailto:',        icon: Mail },
  { key: 'call',      label: 'Call',      description: 'Phone call',     icon: Phone },
  { key: 'sms',       label: 'SMS',       description: 'Text message',   icon: MessageSquare },
  { key: 'whatsapp',  label: 'WhatsApp',  description: 'wa.me',          icon: MessageCircle },
  { key: 'wifi',      label: 'Wi‑Fi',     description: 'SSID + pwd',     icon: Wifi },
  { key: 'vcard',     label: 'V‑Card',    description: 'Contact card',   icon: Contact },
  { key: 'event',     label: 'Event',     description: 'Calendar',       icon: CalendarDays },
  { key: 'media',     label: 'Media',     description: 'PDF/Image/Video', icon: FileImage },
  { key: 'app',       label: 'App',       description: 'App Store link', icon: Smartphone },
  { key: 'social',    label: 'Social',    description: 'Social profile', icon: Heart },
]

export function QrTypeSelector({
  value,
  onChange,
}: {
  value: QrType
  onChange: (next: QrType) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {types.map((t) => {
        const active = t.key === value
        const Icon = t.icon
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={[
              'rounded-xl border px-3 py-2 text-left transition',
              active
                ? 'border-[#00C4A7]/40 bg-[#00C4A7]/5 text-slate-900 dark:bg-[#00C4A7]/10 dark:text-slate-100'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? 'text-[#00C4A7]' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="text-sm font-semibold">{t.label}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t.description}</div>
          </button>
        )
      })}
    </div>
  )
}
