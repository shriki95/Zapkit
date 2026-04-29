import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import QRCodeStyling from 'qr-code-styling'
import JSZip from 'jszip'

type BatchItem = {
  name: string
  url: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  qrDataUrl?: string
}

export function BatchProcessor() {
  const [items, setItems] = useState<BatchItem[]>([])
  const [processing, setProcessing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function parseCSV(text: string): BatchItem[] {
    const lines = text.trim().split('\n')
    const items: BatchItem[] = []
    
    // Skip header if exists
    const startIndex = lines[0]?.toLowerCase().includes('name') || lines[0]?.toLowerCase().includes('url') ? 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const [name, url] = line.split(',').map(s => s.trim().replace(/"/g, ''))
      if (name && url) {
        items.push({
          name: name || `Item ${i}`,
          url: url.startsWith('http') ? url : `https://${url}`,
          status: 'pending'
        })
      }
    }
    
    return items
  }

  async function handleFile(file: File) {
    try {
      const text = await file.text()
      let parsedItems: BatchItem[] = []
      
      if (file.name.endsWith('.csv')) {
        parsedItems = parseCSV(text)
      } else {
        // For Excel files, we'd need a library like xlsx
        // For now, show error
        alert('Excel files not yet supported. Please use CSV format.')
        return
      }
      
      setItems(parsedItems)
    } catch (error) {
      alert('Error reading file. Please check the format.')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      handleFile(file)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  async function generateQRCode(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const qr = new QRCodeStyling({
        width: 300,
        height: 300,
        data: url,
        dotsOptions: { type: 'square', color: '#0b0f1a' },
        backgroundOptions: { color: '#ffffff' },
        cornersSquareOptions: { type: 'square', color: '#0b0f1a' },
        cornersDotOptions: { type: 'square', color: '#0b0f1a' },
        margin: 12
      })

      qr.getRawData('png').then(blob => {
        if (blob && blob instanceof Blob) {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        } else {
          reject(new Error('Failed to generate QR code'))
        }
      }).catch(reject)
    })
  }

  async function processAll() {
    if (items.length === 0) return
    
    setProcessing(true)
    const updatedItems = [...items]
    
    for (let i = 0; i < updatedItems.length; i++) {
      try {
        updatedItems[i].status = 'processing'
        setItems([...updatedItems])
        
        // Add artificial delay for ad viewing (2 seconds per item)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const qrDataUrl = await generateQRCode(updatedItems[i].url)
        updatedItems[i].qrDataUrl = qrDataUrl
        updatedItems[i].status = 'completed'
        
        setItems([...updatedItems])
        
        // Small delay between items
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        updatedItems[i].status = 'error'
        setItems([...updatedItems])
      }
    }
    
    setProcessing(false)
  }

  async function downloadZip() {
    const zip = new JSZip()
    const completedItems = items.filter(item => item.status === 'completed' && item.qrDataUrl)
    
    for (const item of completedItems) {
      if (item.qrDataUrl) {
        // Convert data URL to blob
        const response = await fetch(item.qrDataUrl)
        const blob = await response.blob()
        const fileName = `${item.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`
        zip.file(fileName, blob)
      }
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr-codes.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadCSVTemplate() {
    const csvContent = 'name,url\nExample Product,https://example.com\nAnother Item,https://google.com'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const completedCount = items.filter(item => item.status === 'completed').length
  const showPreview = items.length > 0 && items.length <= 4 && completedCount > 0

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={[
          'rounded-2xl border-2 border-dashed p-8 text-center transition-colors',
          dragOver
            ? 'border-[#00C4A7] bg-[#00C4A7]/5'
            : 'border-slate-300 dark:border-slate-600'
        ].join(' ')}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
      >
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Upload CSV File
        </h3>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Drag and drop your CSV file here, or click to browse
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00C4A7] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00B096]"
          >
            <Upload className="h-4 w-4" />
            Choose File
          </button>
          <button
            type="button"
            onClick={downloadCSVTemplate}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Download Template
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Items ({items.length})
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={processAll}
                disabled={processing || completedCount === items.length}
                className="inline-flex items-center gap-2 rounded-xl bg-[#00C4A7] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00B096] disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Generate All QR Codes'}
              </button>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={downloadZip}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Download className="h-4 w-4" />
                  Download ZIP ({completedCount})
                </button>
              )}
            </div>
          </div>

          {/* Batch Ad Space */}
          {completedCount > 0 && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-slate-600 dark:from-slate-800 dark:to-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    🎉 QR codes generated successfully!
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Need QR analytics & tracking? See who scans your codes
                  </div>
                </div>
                <button className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-600 whitespace-nowrap">
                  Learn More →
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700"
              >
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{item.url}</div>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {item.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  {item.status === 'processing' && (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00C4A7] border-t-transparent" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Processing...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview for small batches */}
      {showPreview && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Preview</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items
              .filter(item => item.status === 'completed' && item.qrDataUrl)
              .map((item, index) => (
                <div key={index} className="text-center">
                  <img
                    src={item.qrDataUrl}
                    alt={`QR code for ${item.name}`}
                    className="mx-auto mb-2 h-32 w-32 rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}