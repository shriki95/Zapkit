import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Copy, X, Video } from 'lucide-react'

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [copied, setCopied] = useState(false)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isScanning) return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          startScanning()
        }
      } catch (err) {
        setError('Camera access denied. Please allow camera permissions.')
        setIsScanning(false)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [isScanning])

  function startScanning() {
    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight

      ctx.drawImage(videoRef.current, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code) {
        setResult(code.data)
        setIsScanning(false)
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current)
        }
      }
    }, 100)
  }

  function copyToClipboard() {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-3">
      {!isScanning && !result ? (
        <div className="text-center">
          <button
            onClick={() => {
              setIsScanning(true)
              setError(null)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00C4A7] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#00B096]"
          >
            <Video className="h-4 w-4" />
            Start Camera Scan
          </button>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Point your camera at a QR code to scan it
          </p>
        </div>
      ) : null}

      {isScanning && (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <video
            ref={videoRef}
            className="w-full aspect-video bg-black"
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />
          <button
            onClick={() => setIsScanning(false)}
            className="absolute top-2 right-2 rounded-lg bg-red-500 p-2 text-white hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-[#00C4A7] rounded-lg opacity-50"></div>
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
              ✓ Scanned
            </div>
            <button
              onClick={() => {
                setResult(null)
                setIsScanning(true)
              }}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              Scan Again
            </button>
          </div>
          <div className="break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            {result}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              <Copy className="h-3 w-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            {result.startsWith('http') && (
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg bg-blue-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-blue-600 text-center"
              >
                Open Link ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
