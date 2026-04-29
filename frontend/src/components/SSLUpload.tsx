import { useState, useRef } from 'react'
import { Shield, CheckCircle, AlertCircle, X } from 'lucide-react'

export function SSLUpload() {
  const [isOpen, setIsOpen] = useState(false)
  const [certificate, setCertificate] = useState<string | null>(null)
  const [privateKey, setPrivateKey] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
  const certInputRef = useRef<HTMLInputElement>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)

  function handleCertificateUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setCertificate(reader.result as string)
        validateCertificate(reader.result as string, privateKey)
      }
      reader.readAsText(file)
    }
  }

  function handlePrivateKeyUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setPrivateKey(reader.result as string)
        validateCertificate(certificate, reader.result as string)
      }
      reader.readAsText(file)
    }
  }

  function validateCertificate(cert: string | null, key: string | null) {
    if (!cert || !key) return
    
    setStatus('validating')
    
    // Basic validation (in real app, you'd validate properly)
    setTimeout(() => {
      const certValid = cert.includes('BEGIN CERTIFICATE') && cert.includes('END CERTIFICATE')
      const keyValid = key.includes('BEGIN PRIVATE KEY') && key.includes('END PRIVATE KEY')
      
      setStatus(certValid && keyValid ? 'valid' : 'invalid')
    }, 1000)
  }

  function clearCertificates() {
    setCertificate(null)
    setPrivateKey(null)
    setStatus('idle')
    if (certInputRef.current) certInputRef.current.value = ''
    if (keyInputRef.current) keyInputRef.current.value = ''
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-green-600"
      >
        <Shield className="h-4 w-4" />
        SSL Certificate
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              SSL Certificate
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Certificate Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Certificate File (.crt, .pem)
            </label>
            <div className="flex gap-2">
              <input
                ref={certInputRef}
                type="file"
                accept=".crt,.pem,.cer"
                onChange={handleCertificateUpload}
                className="flex-1 text-sm text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-300"
              />
            </div>
          </div>

          {/* Private Key Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Private Key File (.key, .pem)
            </label>
            <div className="flex gap-2">
              <input
                ref={keyInputRef}
                type="file"
                accept=".key,.pem"
                onChange={handlePrivateKeyUpload}
                className="flex-1 text-sm text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-300"
              />
            </div>
          </div>

          {/* Status */}
          {status !== 'idle' && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                {status === 'validating' && (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Validating certificates...</span>
                  </>
                )}
                {status === 'valid' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Certificates are valid!</span>
                  </>
                )}
                {status === 'invalid' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">Invalid certificate format</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={clearCertificates}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              disabled={status !== 'valid'}
              className="flex-1 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply SSL
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            <p>⚠️ SSL certificates are processed locally in your browser for security.</p>
          </div>
        </div>
      </div>
    </div>
  )
}