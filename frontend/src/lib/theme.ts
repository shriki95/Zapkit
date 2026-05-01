/**
 * Dynamic accent color injection.
 * Since Tailwind generates hardcoded color classes (e.g. bg-[#00C4A7]),
 * we inject a <style> tag that overrides them when a non-teal kit is active.
 */

const ACCENT_MAP: Record<string, { main: string; hover: string }> = {
  teal:   { main: '#00C4A7', hover: '#00B096' },
  indigo: { main: '#6366f1', hover: '#4f46e5' },
  rose:   { main: '#f43f5e', hover: '#e11d48' },
  amber:  { main: '#f59e0b', hover: '#d97706' },
  sky:    { main: '#0ea5e9', hover: '#0284c7' },
}

function alpha(hex: string, pct: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${(pct / 100).toFixed(2)})`
}

export function applyAccentOverride(accent: string): void {
  // Update data-accent for CSS variable kits (btn-primary, input-field focus, etc.)
  if (accent === 'teal' || !ACCENT_MAP[accent]) {
    document.documentElement.removeAttribute('data-accent')
  } else {
    document.documentElement.setAttribute('data-accent', accent)
  }

  let el = document.getElementById('zapkit-accent-style') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'zapkit-accent-style'
    document.head.appendChild(el)
  }

  if (accent === 'teal' || !ACCENT_MAP[accent]) {
    el.textContent = ''
    return
  }

  const { main, hover } = ACCENT_MAP[accent]

  // Override all hardcoded Tailwind teal color classes
  el.textContent = `
    .text-\\[\\#00C4A7\\] { color: ${main} !important; }
    .bg-\\[\\#00C4A7\\]   { background-color: ${main} !important; }
    .bg-\\[\\#00B096\\]   { background-color: ${hover} !important; }
    .border-\\[\\#00C4A7\\] { border-color: ${main} !important; }
    .stroke-\\[\\#00C4A7\\] { stroke: ${main} !important; }
    .fill-\\[\\#00C4A7\\]   { fill: ${main} !important; }
    .accent-\\[\\#00C4A7\\] { accent-color: ${main} !important; }
    .from-\\[\\#00C4A7\\]   { --tw-gradient-from: ${main} !important; }
    .to-\\[\\#00C4A7\\]     { --tw-gradient-to:   ${main} !important; }
    .ring-\\[\\#00C4A7\\]   { --tw-ring-color:    ${main} !important; }

    .hover\\:bg-\\[\\#00C4A7\\]:hover   { background-color: ${main} !important; }
    .hover\\:bg-\\[\\#00B096\\]:hover   { background-color: ${hover} !important; }
    .hover\\:text-\\[\\#00C4A7\\]:hover { color: ${main} !important; }
    .hover\\:border-\\[\\#00C4A7\\]:hover { border-color: ${main} !important; }
    .focus\\:ring-\\[\\#00C4A7\\]:focus { --tw-ring-color: ${main} !important; }

    .bg-\\[\\#00C4A7\\]\\/5  { background-color: ${alpha(main, 5)}  !important; }
    .bg-\\[\\#00C4A7\\]\\/8  { background-color: ${alpha(main, 8)}  !important; }
    .bg-\\[\\#00C4A7\\]\\/10 { background-color: ${alpha(main, 10)} !important; }
    .bg-\\[\\#00C4A7\\]\\/15 { background-color: ${alpha(main, 15)} !important; }
    .bg-\\[\\#00C4A7\\]\\/20 { background-color: ${alpha(main, 20)} !important; }
    .border-\\[\\#00C4A7\\]\\/20 { border-color: ${alpha(main, 20)} !important; }
    .border-\\[\\#00C4A7\\]\\/25 { border-color: ${alpha(main, 25)} !important; }
    .border-\\[\\#00C4A7\\]\\/30 { border-color: ${alpha(main, 30)} !important; }
    .text-\\[\\#00C4A7\\]\\/60  { color: ${alpha(main, 60)} !important; }

    .hover\\:bg-\\[\\#00C4A7\\]\\/15:hover { background-color: ${alpha(main, 15)} !important; }
    .hover\\:bg-\\[\\#00C4A7\\]\\/20:hover { background-color: ${alpha(main, 20)} !important; }
    .hover\\:border-\\[\\#00C4A7\\]\\/50:hover { border-color: ${alpha(main, 50)} !important; }
    .group-hover\\:bg-\\[\\#00C4A7\\]\\/20 { background-color: ${alpha(main, 20)} !important; }
  `
}
