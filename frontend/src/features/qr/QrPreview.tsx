import { useEffect, useMemo, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'
import type { DesignOptions } from './types'

type Props = {
  data: string
  design: DesignOptions
  onReady?: (qr: QRCodeStyling) => void
}

// The qr-code-styling library internally does `255 & charCodeAt(i)` which
// truncates Hebrew/Arabic/any multi-byte Unicode character to garbage bytes.
// Fix: encode the JS string to real UTF-8 bytes first, then hand those bytes
// to the library as a Latin-1 string so it stores the correct byte sequence.
function toUtf8ByteString(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i])
  }
  return out
}

export function QrPreview({ data, design, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Re-encode every time data changes
  const safeData = useMemo(() => (data ? toUtf8ByteString(data) : ' '), [data])

  const qr = useMemo(() => {
    return new QRCodeStyling({
      width: design.previewSize,
      height: design.previewSize,
      type: 'svg',
      data: safeData,
      margin: design.margin,
      image: design.logoDataUrl ?? undefined,
      qrOptions: { errorCorrectionLevel: 'H' },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 6,
        imageSize: design.logoScale,
      },
      dotsOptions: {
        type: design.dotsStyle,
        color: design.foreground,
      },
      cornersSquareOptions: {
        type: design.cornersSquareStyle,
        color: design.foreground,
      },
      cornersDotOptions: {
        type: design.cornersDotStyle,
        color: design.foreground,
      },
      backgroundOptions: {
        color: design.transparentBackground ? 'transparent' : design.background,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    container.innerHTML = ''
    qr.append(container)
    onReady?.(qr)
    return () => { container.innerHTML = '' }
  }, [qr])

  useEffect(() => {
    qr.update({
      width: design.previewSize,
      height: design.previewSize,
      data: safeData,
      margin: design.margin,
      image: design.logoDataUrl ?? undefined,
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 6,
        imageSize: design.logoScale,
      },
      dotsOptions: { type: design.dotsStyle, color: design.foreground },
      cornersSquareOptions: { type: design.cornersSquareStyle, color: design.foreground },
      cornersDotOptions: { type: design.cornersDotStyle, color: design.foreground },
      backgroundOptions: {
        color: design.transparentBackground ? 'transparent' : design.background,
      },
    })
  }, [safeData, design, qr])

  const hasFrame = design.frameStyle !== 'none'
  const showTop    = design.frameStyle === 'above' || design.frameStyle === 'both'
  const showBottom = design.frameStyle === 'below' || design.frameStyle === 'both'

  return (
    <div className="w-full flex justify-center">
      <div
        className="inline-flex flex-col items-center rounded-2xl transition-all duration-200"
        style={hasFrame ? {
          border: design.frameBorder ? `3px solid ${design.frameColor}` : 'none',
          padding: hasFrame ? '10px' : '0',
          backgroundColor: design.transparentBackground ? 'transparent' : design.background,
        } : {}}
      >
        <div
          className="text-xs font-bold tracking-widest transition-all"
          style={{
            color: design.frameColor,
            maxHeight: showTop ? '24px' : '0px',
            overflow: 'hidden',
            marginBottom: showTop ? '8px' : '0px',
            opacity: showTop ? 1 : 0,
          }}
        >
          {design.frameText || 'SCAN ME'}
        </div>

        <div ref={containerRef} className="grid place-items-center" />

        <div
          className="text-xs font-bold tracking-widest transition-all"
          style={{
            color: design.frameColor,
            maxHeight: showBottom ? '24px' : '0px',
            overflow: 'hidden',
            marginTop: showBottom ? '8px' : '0px',
            opacity: showBottom ? 1 : 0,
          }}
        >
          {design.frameText || 'SCAN ME'}
        </div>
      </div>
    </div>
  )
}
