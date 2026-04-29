import { useEffect } from 'react'

const descriptions: Record<string, string> = {
  shorten: 'Paste your long URL and get a short link instantly — free, with QR code and click analytics included.',
  links: 'Manage all your shortened links in one place. View click counts, edit, or delete links anytime.',
  analytics: 'Deep-dive into your link analytics: daily clicks, device types, countries, and referrer sources in real time.',
}

export default function SEOOptimizer({ activeTab }: { activeTab: string }) {
  useEffect(() => {
    const desc = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (desc) desc.content = descriptions[activeTab] ?? descriptions.shorten

    const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]')
    if (ogDesc) ogDesc.content = descriptions[activeTab] ?? descriptions.shorten
  }, [activeTab])

  return null
}
