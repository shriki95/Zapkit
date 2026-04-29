import type { QrContentState, QrType } from './types'

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`
    const url = new URL(withProtocol)
    return url.toString()
  } catch {
    return null
  }
}

function buildMailto(to: string, subject: string, body: string): string | null {
  const addr = to.trim()
  if (!addr) return null
  const params = new URLSearchParams()
  if (subject.trim()) params.set('subject', subject.trim())
  if (body.trim()) params.set('body', body.trim())
  const qs = params.toString()
  return `mailto:${addr}${qs ? `?${qs}` : ''}`
}

function buildTel(phone: string): string | null {
  const p = phone.trim()
  if (!p) return null
  return `tel:${p}`
}

function buildSms(phone: string, message: string): string | null {
  const p = phone.trim()
  if (!p) return null
  const msg = message.trim()
  return msg ? `smsto:${p}:${msg}` : `smsto:${p}:`
}

function buildWhatsapp(phone: string, message: string): string | null {
  const p = phone.trim().replace(/[^\d+]/g, '')
  if (!p) return null
  const text = message.trim()
  const qs = text ? `?text=${text}` : ''
  const normalized = p.startsWith('+') ? p.slice(1) : p
  return `https://wa.me/${normalized}${qs}`
}

function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

function buildWifi(ssid: string, password: string, encryption: 'WPA' | 'WEP' | 'nopass', hidden: boolean): string | null {
  const s = ssid.trim()
  if (!s) return null
  const t = encryption
  const p = password.trim()
  const h = hidden ? 'true' : 'false'
  const encSsid = escapeWifi(s)
  const encPass = escapeWifi(p)
  return `WIFI:T:${t};S:${encSsid};P:${encPass};H:${h};;`
}

function buildVCard(c: QrContentState): string | null {
  const fn = `${c.vcardFirstName}`.trim()
  const ln = `${c.vcardLastName}`.trim()
  const name = [fn, ln].filter(Boolean).join(' ')
  if (!name) return null
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0', 'CHARSET:UTF-8']
  lines.push(`N:${ln};${fn};;;`)
  lines.push(`FN:${name}`)
  if (c.vcardCompany.trim()) lines.push(`ORG:${c.vcardCompany.trim()}`)
  if (c.vcardTitle.trim()) lines.push(`TITLE:${c.vcardTitle.trim()}`)
  if (c.vcardPhone.trim()) lines.push(`TEL;TYPE=CELL:${c.vcardPhone.trim()}`)
  if (c.vcardEmail.trim()) lines.push(`EMAIL:${c.vcardEmail.trim()}`)
  if (c.vcardWebsite.trim()) lines.push(`URL:${c.vcardWebsite.trim()}`)
  lines.push('END:VCARD')
  return lines.join('\n')
}

function toIcsDateTime(localIso: string): string | null {
  const v = localIso.trim()
  if (!v) return null
  const date = new Date(v)
  if (Number.isNaN(date.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${y}${m}${d}T${hh}${mm}00`
}

function buildEvent(c: QrContentState): string | null {
  const title = c.eventTitle.trim()
  if (!title) return null
  const dtStart = toIcsDateTime(c.eventStart)
  const dtEnd = toIcsDateTime(c.eventEnd)
  if (!dtStart) return null
  const uid = `${dtStart}-${Math.random().toString(16).slice(2)}@qr-generator`
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QR Generator//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
  ]
  if (dtEnd) lines.push(`DTEND:${dtEnd}`)
  lines.push(`SUMMARY:${title}`)
  if (c.eventLocation.trim()) lines.push(`LOCATION:${c.eventLocation.trim()}`)
  if (c.eventDescription.trim()) lines.push(`DESCRIPTION:${c.eventDescription.trim()}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\n')
}

function buildApp(appStoreUrl: string, playStoreUrl: string): string | null {
  const ios = appStoreUrl.trim()
  const android = playStoreUrl.trim()
  // If both provided, prefer a universal smart link approach - use iOS as primary
  // Most QR scanners will open whichever is relevant to the device
  if (ios && android) return ios  // iOS link shown; Android users can still use it via redirect
  return normalizeUrl(ios || android)
}

function buildSocial(platform: QrContentState['socialPlatform'], handle: string): string | null {
  const h = handle.trim().replace(/^@/, '')
  if (!h) return null
  switch (platform) {
    case 'instagram': return `https://instagram.com/${h}`
    case 'tiktok':    return `https://tiktok.com/@${h}`
    case 'youtube':   return h.startsWith('http') ? h : `https://youtube.com/@${h}`
    case 'linkedin':  return `https://linkedin.com/in/${h}`
    case 'twitter':   return `https://x.com/${h}`
    case 'facebook':  return `https://facebook.com/${h}`
    case 'snapchat':  return `https://snapchat.com/add/${h}`
    default:          return null
  }
}

export function buildQrPayload(type: QrType, c: QrContentState): string | null {
  switch (type) {
    case 'link':
      return normalizeUrl(c.linkUrl)
    case 'text':
      return c.text.trim() || null
    case 'email':
      return buildMailto(c.emailTo, c.emailSubject, c.emailBody)
    case 'call':
      return buildTel(c.phoneNumber)
    case 'sms':
      return buildSms(c.phoneNumber, c.smsMessage)
    case 'whatsapp':
      return buildWhatsapp(c.whatsappNumber, c.whatsappMessage)
    case 'wifi':
      return buildWifi(c.wifiSsid, c.wifiPassword, c.wifiEncryption, c.wifiHidden)
    case 'vcard':
      return buildVCard(c)
    case 'event':
      return buildEvent(c)
    case 'media':
      return normalizeUrl(c.mediaUrl)
    case 'app':
      return buildApp(c.appStoreUrl, c.playStoreUrl)
    case 'social':
      return buildSocial(c.socialPlatform, c.socialHandle)
    default:
      return null
  }
}
