import type { ChangeEvent } from 'react'
import type { DesignOptions } from '../types'
import { Field, Input } from './fields'
import InfoTooltip from '../../../components/InfoTooltip'

type Props = {
  value: DesignOptions
  onChange: (next: DesignOptions) => void
}

const dotStyles: DesignOptions['dotsStyle'][] = [
  'rounded',
  'dots',
  'classy',
  'classy-rounded',
  'square',
  'extra-rounded',
]

export function DesignPanel({ value, onChange }: Props) {
  const patch = (p: Partial<DesignOptions>) => onChange({ ...value, ...p })

  async function handleLogoFile(file: File | null) {
    if (!file) {
      patch({ logoDataUrl: null })
      return
    }
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(file)
    })
    patch({ logoDataUrl: dataUrl })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Foreground" hint="QR color">
          <div className="flex items-center gap-2">
            <input
              aria-label="Foreground color"
              type="color"
              className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white"
              value={value.foreground}
              onChange={(e) => patch({ foreground: e.target.value })}
            />
            <Input value={value.foreground} onChange={(v) => patch({ foreground: v })} placeholder="#000080" />
          </div>
        </Field>
        <Field label="Background" hint="Recommended: white">
          <div className="flex items-center gap-2">
            <input
              aria-label="Background color"
              type="color"
              className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white"
              value={value.background}
              onChange={(e) => patch({ background: e.target.value })}
              disabled={value.transparentBackground}
            />
            <Input value={value.background} onChange={(v) => patch({ background: v })} placeholder="#ffffff" />
          </div>
        </Field>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
        <div>
          <div className="font-semibold">Transparent background</div>
          <div className="text-xs text-slate-500">Nice for overlays, but may reduce scan reliability.</div>
        </div>
        <input
          type="checkbox"
          className="h-4 w-4 accent-[color:var(--brand)]"
          checked={value.transparentBackground}
          onChange={(e) => patch({ transparentBackground: e.target.checked })}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="mb-1 text-sm font-semibold text-slate-900">Dot style</div>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand/25 focus:border-brand focus:ring-4"
            value={value.dotsStyle}
            onChange={(e) => patch({ dotsStyle: e.target.value as DesignOptions['dotsStyle'] })}
          >
            {dotStyles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div className="text-sm font-semibold text-slate-900">Advanced</div>
          <div className="text-xs text-slate-500">Extra controls live below.</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="mb-1 text-sm font-semibold text-slate-900">Preview size</div>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand/25 focus:border-brand focus:ring-4"
            value={String(value.previewSize)}
            onChange={(e) => patch({ previewSize: Number(e.target.value) })}
          >
            {[240, 280, 320, 360].map((s) => (
              <option key={s} value={s}>
                {s}px
              </option>
            ))}
          </select>
          <InfoTooltip text="This only affects the on-page preview size. The downloaded QR will always be full resolution." size={12} />
        </label>
        <label className="block">
          <div className="mb-1 text-sm font-semibold text-slate-900">Frame color</div>
          <input
            aria-label="Frame color"
            type="color"
            className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
            value={value.frameColor}
            onChange={(e) => patch({ frameColor: e.target.value })}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="mb-1 text-sm font-semibold text-slate-900">Frame text</div>
          <Input value={value.frameText} onChange={(v) => patch({ frameText: v })} placeholder="SCAN ME" />
        </label>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div className="text-sm font-semibold text-slate-900">Frame style</div>
          <div className="text-xs text-slate-500">{value.frameStyle}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="mb-1 text-sm font-semibold text-slate-900">Margin</div>
          <input
            type="range"
            min={0}
            max={32}
            value={value.margin}
            onChange={(e) => patch({ margin: Number(e.target.value) })}
            className="w-full accent-[color:var(--brand)]"
          />
          <div className="mt-1 text-xs text-slate-500">{value.margin}px</div>
        </label>
        <label className="block">
          <div className="mb-1 text-sm font-semibold text-slate-900">Logo scale</div>
          <input
            type="range"
            min={0}
            max={0.35}
            step={0.01}
            value={value.logoScale}
            onChange={(e) => patch({ logoScale: Number(e.target.value) })}
            className="w-full accent-[color:var(--brand)]"
          />
          <div className="mt-1 text-xs text-slate-500">{Math.round(value.logoScale * 100)}%</div>
        </label>
      </div>

      <Field label="Logo" hint="Optional">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleLogoFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-slate-100"
          />
          {value.logoDataUrl ? (
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
              onClick={() => patch({ logoDataUrl: null })}
            >
              Remove
            </button>
          ) : null}
        </div>
      </Field>
    </div>
  )
}

