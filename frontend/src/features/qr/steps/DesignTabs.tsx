import { useState } from 'react'
import type { DesignOptions } from '../types'
import { QR_PRESETS } from '../presets'
import { LOGO_PRESETS } from '../logoPresets'

type TabKey = 'frame' | 'shape' | 'logo'

const DOT_STYLES: Array<{ value: DesignOptions['dotsStyle']; label: string; path: string }> = [
  { value: 'square',        label: 'Square',     path: 'M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z' },
  { value: 'rounded',       label: 'Rounded',    path: 'M3 2h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zM9 2h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1zM3 8h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1zM9 8h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V9a1 1 0 011-1z' },
  { value: 'dots',          label: 'Dots',       path: 'M4 4m-2 0a2 2 0 104 0 2 2 0 10-4 0M10 4m-2 0a2 2 0 104 0 2 2 0 10-4 0M4 10m-2 0a2 2 0 104 0 2 2 0 10-4 0M10 10m-2 0a2 2 0 104 0 2 2 0 10-4 0' },
  { value: 'classy',        label: 'Classy',     path: 'M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM9 9h2v2H9z' },
  { value: 'classy-rounded',label: 'Classy+',    path: 'M3 2h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zM9 2h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1zM3 8h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1zM10 10m-1 0a1 1 0 102 0 1 1 0 10-2 0' },
  { value: 'extra-rounded', label: 'Bubble',     path: 'M3.5 2h1a1.5 1.5 0 011.5 1.5v1A1.5 1.5 0 014.5 6h-1A1.5 1.5 0 012 4.5v-1A1.5 1.5 0 013.5 2zM9.5 2h1A1.5 1.5 0 0112 3.5v1A1.5 1.5 0 0110.5 6h-1A1.5 1.5 0 018 4.5v-1A1.5 1.5 0 019.5 2zM3.5 8h1A1.5 1.5 0 016 9.5v1A1.5 1.5 0 014.5 12h-1A1.5 1.5 0 012 10.5v-1A1.5 1.5 0 013.5 8zM9.5 8h1A1.5 1.5 0 0112 9.5v1A1.5 1.5 0 0110.5 12h-1A1.5 1.5 0 018 10.5v-1A1.5 1.5 0 019.5 8z' },
]

const CORNER_SQUARE_STYLES: Array<{ value: DesignOptions['cornersSquareStyle']; label: string }> = [
  { value: 'square',        label: '□' },
  { value: 'dot',           label: '◯' },
  { value: 'extra-rounded', label: '▢' },
]

const CORNER_DOT_STYLES: Array<{ value: DesignOptions['cornersDotStyle']; label: string }> = [
  { value: 'square', label: '■' },
  { value: 'dot',    label: '●' },
]

const FRAME_OPTIONS: Array<{ value: DesignOptions['frameStyle']; label: string; showTop: boolean; showBottom: boolean }> = [
  { value: 'none',  label: 'None',         showTop: false, showBottom: false },
  { value: 'below', label: 'Text Below',   showTop: false, showBottom: true  },
  { value: 'above', label: 'Text Above',   showTop: true,  showBottom: false },
  { value: 'both',  label: 'Above & Below',showTop: true,  showBottom: true  },
]

export function DesignTabs({
  value,
  onChange,
}: {
  value: DesignOptions
  onChange: (next: DesignOptions) => void
}) {
  const [tab, setTab] = useState<TabKey>('shape')
  const patch = (p: Partial<DesignOptions>) => onChange({ ...value, ...p })

  function handleLogoFile(file: File | null) {
    if (!file) { patch({ logoDataUrl: null }); return }
    const url = URL.createObjectURL(file)
    patch({ logoDataUrl: url })
  }

  const isCustomLogo = !!value.logoDataUrl && !LOGO_PRESETS.some(p => p.dataUrl === value.logoDataUrl)

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'frame', label: 'Frame' },
    { key: 'shape', label: 'Shape' },
    { key: 'logo',  label: 'Logo'  },
  ]

  return (
    <div>
      {/* Quick presets */}
      <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
        {QR_PRESETS.map(preset => {
          const active = value.dotsStyle === preset.options.dotsStyle &&
            value.cornersSquareStyle === preset.options.cornersSquareStyle
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange({ ...value, ...preset.options })}
              className={[
                'flex-shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition',
                active
                  ? 'border-[#00C4A7] bg-[#00C4A7]/10 text-[#00C4A7]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
              ].join(' ')}
            >
              {preset.name}
            </button>
          )
        })}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              'px-4 py-2 text-sm font-semibold border-b-2 transition',
              tab === t.key
                ? 'border-[#00C4A7] text-[#00C4A7]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Frame tab */}
      {tab === 'frame' && (
        <div className="space-y-4">
          {/* Position picker */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Text position</div>
            <div className="grid grid-cols-2 gap-2">
              {FRAME_OPTIONS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => patch({ frameStyle: f.value })}
                  className={[
                    'flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition',
                    value.frameStyle === f.value
                      ? 'border-[#00C4A7] bg-[#00C4A7]/5 dark:bg-[#00C4A7]/10'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700',
                  ].join(' ')}
                >
                  {/* mini QR+text preview */}
                  <div className="flex-shrink-0 w-8 flex flex-col items-center gap-px">
                    {f.showTop && <div className="w-full h-1 rounded-sm" style={{ backgroundColor: value.frameColor || '#000' }} />}
                    <svg viewBox="0 0 8 8" className="w-6 h-6" fill="currentColor">
                      <rect x="0" y="0" width="3" height="3"/><rect x="5" y="0" width="3" height="3"/>
                      <rect x="0" y="5" width="3" height="3"/><rect x="2" y="2" width="1.5" height="1.5" fill="white"/>
                      <rect x="7" y="2" width="1.5" height="1.5" fill="white"/><rect x="2" y="7" width="1.5" height="1.5" fill="white"/>
                    </svg>
                    {f.showBottom && <div className="w-full h-1 rounded-sm" style={{ backgroundColor: value.frameColor || '#000' }} />}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {value.frameStyle !== 'none' && (
            <>
              {/* Text above */}
              {(value.frameStyle === 'above' || value.frameStyle === 'both') && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Text above
                  </label>
                  <input
                    type="text"
                    value={value.frameText}
                    onChange={e => patch({ frameText: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#00C4A7]/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="SCAN ME"
                    maxLength={30}
                  />
                </div>
              )}

              {/* Text below */}
              {(value.frameStyle === 'below' || value.frameStyle === 'both') && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Text below
                  </label>
                  <input
                    type="text"
                    value={value.frameText}
                    onChange={e => patch({ frameText: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#00C4A7]/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="SCAN ME"
                    maxLength={30}
                  />
                </div>
              )}

              {/* Text color */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Text color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={value.frameColor}
                    onChange={e => patch({ frameColor: e.target.value })}
                    className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200 flex-shrink-0" />
                  <input type="text" value={value.frameColor}
                    onChange={e => patch({ frameColor: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 outline-none focus:ring-2 focus:ring-[#00C4A7]/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
              </div>

              {/* Border toggle — independent from text */}
              <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800 cursor-pointer">
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Show border</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Frame around the QR code</div>
                </div>
                <input
                  type="checkbox"
                  checked={value.frameBorder}
                  onChange={e => patch({ frameBorder: e.target.checked })}
                  className="h-4 w-4 accent-[#00C4A7]"
                />
              </label>
            </>
          )}
        </div>
      )}

      {/* Shape tab */}
      {tab === 'shape' && (
        <div className="space-y-5">
          {/* Shape & Color */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Shape style</div>
            <div className="grid grid-cols-6 gap-1.5">
              {DOT_STYLES.map(ds => (
                <button
                  key={ds.value}
                  type="button"
                  title={ds.label}
                  onClick={() => patch({ dotsStyle: ds.value })}
                  className={[
                    'flex items-center justify-center rounded-lg border-2 p-2 transition',
                    value.dotsStyle === ds.value
                      ? 'border-[#00C4A7] bg-[#00C4A7]/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800',
                  ].join(' ')}
                >
                  <svg viewBox="0 0 14 14" className="h-7 w-7" fill="currentColor">
                    <path d={ds.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Shape color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={value.foreground} onChange={e => patch({ foreground: e.target.value })}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200 flex-shrink-0" />
                <input type="text" value={value.foreground} onChange={e => patch({ foreground: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#00C4A7]/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Background</label>
              <div className="flex items-center gap-2">
                <input type="color" value={value.background} onChange={e => patch({ background: e.target.value })}
                  disabled={value.transparentBackground}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200 flex-shrink-0 disabled:opacity-40" />
                <input type="text" value={value.background} onChange={e => patch({ background: e.target.value })}
                  disabled={value.transparentBackground}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#00C4A7]/30 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
              </div>
              <label className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked={value.transparentBackground}
                  onChange={e => patch({ transparentBackground: e.target.checked })}
                  className="rounded" />
                Transparent
              </label>
            </div>
          </div>

          {/* Border style */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Border style</div>
            <div className="flex gap-2">
              {CORNER_SQUARE_STYLES.map(cs => (
                <button
                  key={cs.value}
                  type="button"
                  onClick={() => patch({ cornersSquareStyle: cs.value })}
                  className={[
                    'flex-1 rounded-lg border-2 py-2 text-lg font-bold transition',
                    value.cornersSquareStyle === cs.value
                      ? 'border-[#00C4A7] bg-[#00C4A7]/10 text-[#00C4A7]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
                  ].join(' ')}
                >
                  {cs.label}
                </button>
              ))}
            </div>
          </div>

          {/* Center style */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Center dot</div>
            <div className="flex gap-2">
              {CORNER_DOT_STYLES.map(cd => (
                <button
                  key={cd.value}
                  type="button"
                  onClick={() => patch({ cornersDotStyle: cd.value })}
                  className={[
                    'flex-1 rounded-lg border-2 py-2 text-xl font-bold transition',
                    value.cornersDotStyle === cd.value
                      ? 'border-[#00C4A7] bg-[#00C4A7]/10 text-[#00C4A7]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
                  ].join(' ')}
                >
                  {cd.label}
                </button>
              ))}
            </div>
          </div>

          {/* Margin */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Margin — {value.margin}px
            </label>
            <input type="range" min={0} max={32} value={value.margin}
              onChange={e => patch({ margin: Number(e.target.value) })}
              className="w-full accent-[#00C4A7]" />
          </div>
        </div>
      )}

      {/* Logo tab */}
      {tab === 'logo' && (
        <div className="space-y-4">
          {/* Upload */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Upload logo</div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-[#00C4A7] hover:bg-[#00C4A7]/5 dark:border-slate-700 dark:bg-slate-800">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v11" />
              </svg>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {isCustomLogo ? 'Custom logo active — click to change' : 'Choose file (PNG, SVG, JPG)'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleLogoFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Preset logos */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Or choose from presets</div>
            <div className="grid grid-cols-4 gap-2">
              {LOGO_PRESETS.map(logo => {
                const isActive = logo.id === 'none'
                  ? !value.logoDataUrl
                  : value.logoDataUrl === logo.dataUrl
                return (
                  <button
                    key={logo.id}
                    type="button"
                    onClick={() => patch({ logoDataUrl: logo.dataUrl })}
                    className={[
                      'flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 text-center transition',
                      isActive
                        ? 'border-[#00C4A7] bg-[#00C4A7]/5 dark:bg-[#00C4A7]/10'
                        : 'border-slate-200 bg-white hover:border-[#00C4A7]/50 dark:border-slate-700 dark:bg-slate-800',
                    ].join(' ')}
                  >
                    {logo.id === 'none' ? (
                      <div className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    ) : (
                      <img src={logo.dataUrl!} alt={logo.label} className="h-9 w-9 rounded-full object-cover" />
                    )}
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-tight">{logo.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Logo size */}
          {value.logoDataUrl && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Logo size — {Math.round(value.logoScale * 100)}%
              </label>
              <input type="range" min={0.08} max={0.35} step={0.01} value={value.logoScale}
                onChange={e => patch({ logoScale: Number(e.target.value) })}
                className="w-full accent-[#00C4A7]" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
