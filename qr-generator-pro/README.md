# QR Generator (Static SPA)

Single-page QR generator inspired by the `qr.io` flow (**Content → Design → Download**), implemented as a **static** in-browser app (no accounts, no tracking, no dynamic redirects).

## Tech
- React + Vite
- Tailwind CSS (brand: Deep Navy Blue `#000080` + Slate Grey)
- `qr-code-styling` (QR rendering + PNG/SVG export)

## Run (Frontend)
From `qr-generator/frontend`:

```bash
npm install
npm run dev
```

## Notes
- For best scan reliability, prefer **white background** and avoid overly low contrast.
- “Media” types are currently **URL-only**: the QR encodes a URL (PDF/image/video/etc.).

