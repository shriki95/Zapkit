import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface AdModalProps {
  isOpen: boolean
  onClose: () => void
  waitTime?: number // seconds
}

export default function AdModal({ isOpen, onClose, waitTime = 5 }: AdModalProps) {
  const [timeLeft, setTimeLeft] = useState(waitTime)

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(waitTime)
    }
  }, [isOpen, waitTime])

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, timeLeft])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        {/* Close button - only enabled after wait time */}
        <button
          onClick={onClose}
          disabled={timeLeft > 0}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-all ${
            timeLeft > 0
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Timer */}
        {timeLeft > 0 && (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {timeLeft}s
          </div>
        )}

        {/* Ad Content */}
        <div className="text-center">
          <div className="mb-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {timeLeft > 0 ? 'Please wait...' : 'Advertisement'}
            </p>
          </div>

          {/* Google AdSense Placeholder */}
          <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-8 min-h-[400px] flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C4A7] to-blue-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Supporting Free Tools
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                Ads help us keep ZapKit free for everyone. Thank you for your support!
              </p>
              
              {/* Actual ad space */}
              <div className="mt-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 min-h-[250px] flex items-center justify-center">
                <div className="text-slate-400 text-sm">
                  Google Display Ad<br/>
                  728x90 or 300x250
                </div>
              </div>
            </div>
          </div>

          {/* Close button at bottom */}
          {timeLeft === 0 && (
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 rounded-lg bg-[#00C4A7] text-white font-semibold hover:bg-[#00B096] transition-colors"
            >
              Continue to Your Link
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
