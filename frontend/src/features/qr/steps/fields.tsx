import type { ChangeEvent } from 'react'

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {label}
          {required ? <span className="ml-1 text-brand">*</span> : null}
        </div>
        {hint ? <div className="text-xs text-slate-500 dark:text-slate-400">{hint}</div> : null}
      </div>
      {children}
    </label>
  )
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand/25 placeholder:text-slate-400 focus:border-brand focus:ring-4 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    />
  )
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand/25 placeholder:text-slate-400 focus:border-brand focus:ring-4 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
