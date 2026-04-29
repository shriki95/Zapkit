import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Copy, ExternalLink, Share2, Twitter, Facebook, Linkedin, Mail, MessageCircle, Send, QrCode, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ShortenResponse } from './types'
import AdUnit from '../../components/AdUnit'

// Single app — use React Router path
const QR_APP_URL = '/qr'

interface ShareOption {
  label: string
  icon: ReactNode
  color: string
  bg: string
  action: () => void
}

interface ResultCardProps {
  result: ShortenResponse
  showTrackButton?: boolean
  onTrackClick?: () => void
}

function buildShareOptions(shortUrl: string): ShareOption[] {
  const text = `Check this out: ${shortUrl}`
  return [
    {
      label: 'Twitter',
      icon: <Twitter size={15} />,
      color: 'text-sky-500',
      bg: 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/20 dark:hover:bg-sky-900/40',
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400'),
    },
    {
      label: 'Facebook',
      icon: <Facebook size={15} />,
      color: 'text-blue-600',
      bg: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl)}`, '_blank', 'width=600,height=400'),
    },
    {
      label: 'LinkedIn',
      icon: <Linkedin size={15} />,
      color: 'text-blue-700',
      bg: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40',
      action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortUrl)}`, '_blank', 'width=600,height=400'),
    },
    {
      label: 'WhatsApp',
      icon: <MessageCircle size={15} />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40',
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'),
    },
    {
      label: 'Telegram',
      icon: <Send size={15} />,
      color: 'text-cyan-500',
      bg: 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/40',
      action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shortUrl)}&text=${encodeURIComponent('Check this out!')}`, '_blank'),
    },
    {
      label: 'Email',
      icon: <Mail size={15} />,
      color: 'text-orange-500',
      bg: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40',
      action: () => window.open(`mailto:?subject=${encodeURIComponent('Check this link')}&body=${encodeURIComponent(text)}`, '_blank'),
    },
  ]
}

export default function ResultCard({ result, showTrackButton = false, onTrackClick }: ResultCardProps) {
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(result.short_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openQrPro = () => {
    const dest = `${QR_APP_URL}?url=${encodeURIComponent(result.short_url)}`
    window.open(dest, '_blank')
  }

  const shareOptions = buildShareOptions(result.short_url)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5 space-y-4"
    >
      {/* Label + original */}
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">Your Short Link</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
          <ExternalLink size={11} />
          {result.original_url}
        </p>
      </div>

      {/* Short URL copy row */}
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700">
        <a
          href={result.short_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-[#00C4A7] font-bold text-lg truncate hover:underline"
        >
          {result.short_url}
        </a>
        <button
          onClick={copy}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            copied ? 'bg-emerald-500 text-white' : 'bg-[#00C4A7] hover:bg-[#00B096] text-white'
          }`}
        >
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
        </button>
      </div>

      {/* QR Pro CTA button */}
      <button
        onClick={openQrPro}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#00C4A7]/10 to-blue-500/10 border-2 border-[#00C4A7]/30 hover:border-[#00C4A7] hover:from-[#00C4A7]/20 hover:to-blue-500/20 transition-all group shadow-sm hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C4A7] to-[#00B096] flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 shadow-lg">
            <QrCode size={20} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
              Convert to QR Code
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#00C4A7]/20 text-[#00C4A7]">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Opens in QR Pro
              </span>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Your link will be pre-filled automatically</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#00C4A7] to-[#00B096] text-white shadow-sm">Free</span>
        </div>
      </button>

      {/* Track This Link button (only for non-logged users) */}
      {showTrackButton && onTrackClick && (
        <button
          onClick={onTrackClick}
          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-300/50 dark:border-purple-700/50 hover:border-purple-500 dark:hover:border-purple-500 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-all group shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 shadow-lg">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Track This Link</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Monitor clicks, locations & devices</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm">Free</span>
        </button>
      )}

      {/* Share Link section */}
      <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setShareOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <Share2 size={15} className="text-[#00C4A7]" />
            Share Link
          </span>
          {shareOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {shareOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {shareOptions.map(opt => (
                  <button
                    key={opt.label}
                    onClick={opt.action}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl ${opt.bg} ${opt.color} transition-all hover:scale-105`}
                  >
                    {opt.icon}
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {result.expires_at && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          ⏰ Expires {new Date(result.expires_at).toLocaleDateString()}
        </p>
      )}

      {/* Google Ad below result */}
      <AdUnit slot="1234567890" format="horizontal" className="rounded-xl overflow-hidden" />
    </motion.div>
  )
}
