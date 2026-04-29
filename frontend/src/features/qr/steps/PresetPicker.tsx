import { QR_PRESETS } from '../presets'
import type { DesignOptions } from '../types'

export function PresetPicker({
  value,
  onChange,
}: {
  value: DesignOptions
  onChange: (next: DesignOptions) => void
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-slate-900">Style presets</div>
      <div className="grid grid-cols-1 gap-2">
        {QR_PRESETS.map((p) => {
          const active =
            value.foreground.toLowerCase() === p.options.foreground.toLowerCase() &&
            value.background.toLowerCase() === p.options.background.toLowerCase() &&
            value.dotsStyle === p.options.dotsStyle &&
            value.cornersSquareStyle === p.options.cornersSquareStyle &&
            value.cornersDotStyle === p.options.cornersDotStyle

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange({ ...value, ...p.options })}
              className={[
                'rounded-xl border px-3 py-2 text-left transition',
                active
                  ? 'border-brand/40 bg-brand/5 text-slate-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="flex items-center gap-1">
                  <span
                    className="h-4 w-4 rounded border border-slate-700"
                    style={{ background: p.options.foreground }}
                    aria-hidden="true"
                  />
                  <span
                    className="h-4 w-4 rounded border border-slate-700"
                    style={{ background: p.options.background }}
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500">{p.description}</div>
            </button>
          )
        })}
      </div>
      <div className="text-xs text-slate-500">
        Tip: for best scan reliability, prefer <span className="text-slate-800">Classic</span>.
      </div>
    </div>
  )
}

