import { useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Copy, ScanLine, Upload, X } from 'lucide-react'

export function QrDecoder() {
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDecoding, setIsDecoding] = useState(false)
  const [decodingProgress, setDecodingProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  function decode(file: File) {
    setResult(null)
    setError(null)
    setIsDecoding(true)
    setDecodingProgress(0)
    
    // Simulate loading progress (2.5 seconds)
    const progressInterval = setInterval(() => {
      setDecodingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90 // Stop at 90%, will complete when actual decoding finishes
        }
        return prev + 3 // Increment by 3% every 75ms
      })
    }, 75)
    
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      // Add minimum delay to ensure user sees the ad
      setTimeout(() => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        URL.revokeObjectURL(url)
        
        setDecodingProgress(100)
        setIsDecoding(false)
        
        if (code) {
          setResult(code.data)
        } else {
          setError('No QR code found in this image.')
        }
      }, 2500) // 2.5 second minimum delay
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setIsDecoding(false)
      setDecodingProgress(0)
      setError('Could not load the image.')
    }
    
    img.src = url
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    decode(files[0])
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function copyToClipboard() {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function isHebrewText(text: string): boolean {
    // Check if text contains Hebrew characters
    return /[\u0590-\u05FF]/.test(text)
  }

  function isUrl(text: string): boolean {
    try {
      new URL(text)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-3">
      {!isDecoding ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={[
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition',
            dragging
              ? 'border-brand bg-brand/5'
              : 'border-slate-200 hover:border-brand/50 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-brand/40 dark:hover:bg-slate-800',
          ].join(' ')}
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Drop a QR image here
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">or click to browse</div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 dark:border-slate-700 dark:bg-slate-800">
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00C4A7] border-t-transparent"></div>
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Decoding QR Code...
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {decodingProgress}% Complete
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 mb-6 dark:bg-slate-700 max-w-xs mx-auto">
              <div 
                className="bg-[#00C4A7] h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${decodingProgress}%` }}
              ></div>
            </div>
            
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {result && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <ScanLine className="h-3.5 w-3.5" />
              Decoded content
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              <Copy className="h-3 w-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div 
            className="break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            style={isHebrewText(result) ? { direction: 'rtl', textAlign: 'right' } : {}}
          >
            {result}
          </div>
          {isUrl(result) && (
            <a
              href={result}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand underline-offset-2 hover:underline"
            >
              Open link ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}
