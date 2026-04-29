function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

const LOGOS_SVG: Record<string, string> = {
  link: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#6366f1"/>
    <path d="M28 20a8 8 0 000 16h4v-4h-4a4 4 0 010-8h4v-4h-4zm8 4v4h4a4 4 0 010 8h-4v4h4a8 8 0 000-16h-4zm-8 10h16v-4H28v4z" fill="white"/>
  </svg>`,

  location: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#ef4444"/>
    <path d="M32 14c-7.2 0-13 5.8-13 13 0 9.75 13 23 13 23s13-13.25 13-23c0-7.2-5.8-13-13-13zm0 17.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" fill="white"/>
  </svg>`,

  email: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#f59e0b"/>
    <path d="M14 22h36v20H14V22zm2 2v2l16 10 16-10v-2H16zm0 6v10h32V30L32 40 16 30z" fill="white"/>
  </svg>`,

  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#25D366"/>
    <path d="M32 14c-9.9 0-18 8.1-18 18 0 3.2.85 6.2 2.3 8.8L14 50l9.5-2.25A17.9 17.9 0 0032 50c9.9 0 18-8.1 18-18S41.9 14 32 14zm9 25.5c-.4 1.1-2 2.05-3.1 2.3-.85.2-1.95.35-5.65-1.2-4.75-1.95-7.8-6.8-8.05-7.1-.25-.3-2-2.65-2-5.05s1.3-3.6 1.75-4.1c.45-.5.98-.6 1.3-.6h.95c.3 0 .7-.1 1.1 1 .4 1.1 1.4 3.7 1.5 3.95.1.25.2.55.05.85-.15.3-.25.5-.5.75s-.5.55-.7.75c-.25.25-.5.5-.2 1 .3.5 1.3 2.1 2.8 3.4 1.95 1.7 3.55 2.25 4.05 2.5.5.25.8.2 1.1-.1.3-.3 1.3-1.5 1.65-2 .35-.5.7-.4 1.15-.25.45.15 2.9 1.35 3.4 1.6.5.25.8.35.95.55.1.2.1 1.05-.3 2.15z" fill="white"/>
  </svg>`,

  wifi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#3b82f6"/>
    <path d="M32 42a4 4 0 100-8 4 4 0 000 8zm-9.9-9.9a14 14 0 0119.8 0l2.83-2.83a18 18 0 00-25.46 0l2.83 2.83zm-5.66-5.66a22 22 0 0131.12 0l2.83-2.83a26 26 0 00-36.78 0l2.83 2.83z" fill="white"/>
  </svg>`,

  instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#f09433"/>
        <stop offset="25%" style="stop-color:#e6683c"/>
        <stop offset="50%" style="stop-color:#dc2743"/>
        <stop offset="75%" style="stop-color:#cc2366"/>
        <stop offset="100%" style="stop-color:#bc1888"/>
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="32" fill="url(#ig)"/>
    <rect x="18" y="18" width="28" height="28" rx="7" ry="7" fill="none" stroke="white" stroke-width="3"/>
    <circle cx="32" cy="32" r="7" fill="none" stroke="white" stroke-width="3"/>
    <circle cx="41" cy="23" r="2" fill="white"/>
  </svg>`,

  youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#FF0000"/>
    <path d="M48 24s-.4-2.6-1.6-3.75C44.8 18.6 43.2 18.6 42.4 18.5 37.6 18.2 30 18 30 18h-.05s-7.6.2-12.4.5c-.8.1-2.4.1-4 1.75C12.4 21.4 12 24 12 24S11.6 27.1 11.6 30.2v2.9c0 3.1.4 6.2.4 6.2s.4 2.6 1.6 3.75c1.6 1.65 3.65 1.6 4.6 1.77C21.2 45.2 30 45.3 30 45.3s7.65-.1 12.45-.45c.8-.1 2.4-.1 4-1.75 1.2-1.15 1.6-3.75 1.6-3.75s.4-3.1.4-6.2v-2.9c-.05-3.1-.45-6.2-.45-6.2zM26.2 38.3V25.9l10.8 6.2-10.8 6.2z" fill="white"/>
  </svg>`,

  tiktok: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#010101"/>
    <path d="M42 20.5c-2 0-3.8-1.3-4.5-3.2-.2-.5-.3-1-.3-1.5H33v21.9c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4c.4 0 .8.05 1.1.15V29.7c-.35-.05-.72-.07-1.1-.07-5 0-9 4-9 9s4 9 9 9 9-4 9-9V26.4c1.6 1.1 3.5 1.7 5.5 1.7v-4c-.9 0-1.5-.6-1.5-3.6z" fill="white"/>
  </svg>`,

  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#0A66C2"/>
    <rect x="16" y="27" width="7" height="21" fill="white"/>
    <circle cx="19.5" cy="20" r="4" fill="white"/>
    <path d="M28 27h7v3c1.5-2.3 4-4 7.5-4 6 0 9.5 4 9.5 10v12h-7V37c0-2.5-1-4.5-3.5-4.5S38 34 38 37v11h-7V27z" fill="white"/>
  </svg>`,

  facebook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#1877F2"/>
    <path d="M38 20h-4c-2.2 0-4 1.8-4 4v4h-4v6h4v14h6V34h4l1-6h-5v-3c0-.6.4-1 1-1h4v-4z" fill="white"/>
  </svg>`,

  snapchat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#FFFC00"/>
    <path d="M32 13c-5 0-9 4-9 9v3.5l-2.5-.5c-.6-.1-1 .3-1.1.8l-.2 1c-.1.5.2 1 .7 1.2l3.1 1.2c-.6 1.8-1.8 3.3-3.5 4.3-.4.2-.5.7-.3 1.1.4.9 1.8 1 3.3 1.2.2.7.5 1.5 1.3 1.7 1.2.3 2.5 1.5 6.2 1.5s5-.9 6.2-1.5c.8-.2 1.1-1 1.3-1.7 1.5-.2 2.9-.3 3.3-1.2.2-.4.1-.9-.3-1.1-1.7-1-2.9-2.5-3.5-4.3l3.1-1.2c.5-.2.8-.7.7-1.2l-.2-1c-.1-.5-.5-.9-1.1-.8L41 25.5V22c0-5-4-9-9-9z" fill="#1a1a1a"/>
  </svg>`,
}

export type LogoPresetId = keyof typeof LOGOS_SVG | 'none'

export const LOGO_PRESETS: Array<{ id: LogoPresetId; label: string; dataUrl: string | null }> = [
  { id: 'none',      label: 'None',      dataUrl: null },
  { id: 'link',      label: 'Link',      dataUrl: svgToDataUrl(LOGOS_SVG.link) },
  { id: 'location',  label: 'Location',  dataUrl: svgToDataUrl(LOGOS_SVG.location) },
  { id: 'email',     label: 'Email',     dataUrl: svgToDataUrl(LOGOS_SVG.email) },
  { id: 'whatsapp',  label: 'WhatsApp',  dataUrl: svgToDataUrl(LOGOS_SVG.whatsapp) },
  { id: 'wifi',      label: 'Wi-Fi',     dataUrl: svgToDataUrl(LOGOS_SVG.wifi) },
  { id: 'instagram', label: 'Instagram', dataUrl: svgToDataUrl(LOGOS_SVG.instagram) },
  { id: 'youtube',   label: 'YouTube',   dataUrl: svgToDataUrl(LOGOS_SVG.youtube) },
  { id: 'tiktok',    label: 'TikTok',    dataUrl: svgToDataUrl(LOGOS_SVG.tiktok) },
  { id: 'linkedin',  label: 'LinkedIn',  dataUrl: svgToDataUrl(LOGOS_SVG.linkedin) },
  { id: 'facebook',  label: 'Facebook',  dataUrl: svgToDataUrl(LOGOS_SVG.facebook) },
  { id: 'snapchat',  label: 'Snapchat',  dataUrl: svgToDataUrl(LOGOS_SVG.snapchat) },
]
