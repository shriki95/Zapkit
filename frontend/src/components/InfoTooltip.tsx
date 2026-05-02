import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  text: string
  size?: number
}

export default function InfoTooltip({ text, size = 14 }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-slate-400 hover:text-[#00C4A7] transition-colors focus:outline-none"
        aria-label="More info"
      >
        <Info size={size} />
      </button>

      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs leading-relaxed p-3 shadow-xl">
          {text}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
        </div>
      )}
    </div>
  )
}
