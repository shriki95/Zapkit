# ZapKit — Master Context & Developer Handbook
> **Last Updated:** 2026-05-01  
> **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + FastAPI + PostgreSQL  
> **Deployment:** Netlify (frontend) + Railway (backend)  
> **Live:** https://zapkit2.netlify.app | Backend: https://zapkit-backend-production.up.railway.app

---

## 1. What Is ZapKit

ZapKit is a **multi-tool SaaS platform** (free tier) with:
- **TinyLink Pro** — URL shortener with UTM tracking, custom aliases, expiry dates, real-time analytics
- **QR Generator Pro** — 12+ QR types, custom design, logo upload, batch export, scan analytics
- **Unified Dashboard** — standalone `/dashboard` page with multi-item analytics, delete, Settings tab
- **Shared Auth** — JWT-based across all pages via `AuthContext` in `App.tsx`

Users can use all tools **without registering**. Registration unlocks the analytics dashboard.

---

## 2. Repository Structure

```
ZapKit/
├── frontend/                          # React SPA (single unified app)
│   ├── index.html                     # Meta tags + Google Fonts (Plus Jakarta Sans)
│   ├── src/
│   │   ├── App.tsx                    # BrowserRouter + AuthContext + ScrollToTop + accent loader
│   │   ├── main.tsx
│   │   ├── index.css                  # Tailwind v4, CSS vars (--brand, --brand-hover), theme kits
│   │   ├── pages/
│   │   │   ├── HomePage.tsx           # Route: /
│   │   │   ├── TinyLinkPage.tsx       # Route: /tinylink
│   │   │   ├── QRGeneratorPage.tsx    # Route: /qr
│   │   │   ├── DashboardPage.tsx      # Route: /dashboard (Analytics + Settings tabs)
│   │   │   ├── PrivacyPage.tsx        # Route: /privacy
│   │   │   ├── TermsPage.tsx          # Route: /terms
│   │   │   └── ContactPage.tsx        # Route: /contact
│   │   ├── components/
│   │   │   ├── AuthModal.tsx          # Login / Register / Forgot Password modal
│   │   │   ├── Dashboard.tsx          # Embedded link list (legacy, used in TinyLink settings tab)
│   │   │   ├── Settings.tsx           # Profile, Security (2FA, change pw), Preferences (theme kits)
│   │   │   ├── GDPRBanner.tsx
│   │   │   ├── AdModal.tsx
│   │   │   ├── AdUnit.tsx
│   │   │   ├── SEOOptimizer.tsx
│   │   │   ├── UsageModal.tsx
│   │   │   └── SSLUpload.tsx
│   │   ├── features/
│   │   │   ├── links/                 # TinyLink feature components
│   │   │   │   ├── ShortenForm.tsx    # URL input + UTM params + custom alias + expiry
│   │   │   │   ├── ResultCard.tsx     # Short link result display
│   │   │   │   ├── LinkDashboard.tsx  # Link list with analytics
│   │   │   │   ├── AnalyticsPanel.tsx # Charts for individual link
│   │   │   │   └── types.ts
│   │   │   └── qr/                   # QR Generator feature components
│   │   │       ├── QrPreview.tsx
│   │   │       ├── QrTypeSelector.tsx
│   │   │       ├── QrDecoder.tsx
│   │   │       ├── BatchProcessor.tsx
│   │   │       ├── payload.ts         # QR content builders
│   │   │       ├── presets.ts
│   │   │       ├── types.ts
│   │   │       └── steps/
│   │   │           ├── ContentForm.tsx  # PhoneInput with 70+ country codes
│   │   │           └── DesignTabs.tsx
│   │   └── lib/
│   │       └── auth.ts                # All API calls + auth utilities
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.app.json              # strict: true, noUnusedLocals: true — watch for TS errors!
│   └── .env.production                # VITE_API_URL=https://zapkit-backend-production.up.railway.app
│
├── backend/                           # FastAPI + PostgreSQL
│   ├── main.py                        # All API endpoints
│   ├── auth.py                        # hash_password, verify_password, JWT
│   ├── models.py                      # SQLAlchemy ORM models
│   ├── schemas.py                     # Pydantic request/response schemas
│   ├── database.py                    # Async engine + init_db() migrations
│   ├── security.py                    # Input sanitization, validation
│   ├── security_middleware.py         # Rate limiting, CORS, DDoS protection
│   ├── analytics.py                   # Click/scan recording
│   ├── email_service.py               # SMTP (mock mode when EMAIL_MOCK_MODE=true)
│   ├── encryption.py
│   ├── shortener.py                   # Short code generation
│   └── requirements.txt
│
├── netlify.toml                       # base=frontend, SPA redirect, security headers
├── render.yaml                        # Backend on Railway (rootDir: backend)
└── CONTEXT.md                         # This file
```

---

## 3. Frontend Architecture

### Routing (React Router v7)
```
/           → HomePage
/tinylink   → TinyLinkPage
/qr         → QRGeneratorPage
/dashboard  → DashboardPage (Analytics tab + Settings tab)
/privacy    → PrivacyPage
/terms      → TermsPage
/contact    → ContactPage
/*          → redirect to /
```

### AuthContext (App.tsx)
All pages consume auth state via `useAuth()`:
```typescript
const { user, setUser, dark, setDark, showAuthModal, setShowAuthModal, authMode, setAuthMode } = useAuth()
```
- `user` — null when logged out, `{ id, email, name, two_fa_enabled }` when logged in
- `dark` — persisted to `zapkit-theme` in localStorage + cookie
- `showAuthModal` / `authMode` — controls global AuthModal from any page

### Theme System
- **Dark mode:** `document.documentElement.classList.toggle('dark', dark)` + cookie `zapkit-theme`
- **Accent color kits:** `document.documentElement.setAttribute('data-accent', kit)` + localStorage `zapkit-accent`
- **CSS variables in index.css:** `--brand`, `--brand-hover`, `--brand-light`, `--brand-border`
- **5 kits:** teal (default), indigo, rose, amber, sky
- App.tsx loads the accent on mount; Settings.tsx `applyAccent()` function applies it live

### Typography
- **Font:** Plus Jakarta Sans (Google Fonts, loaded in index.html)
- Applied globally via `font-family` in `index.css`
- All h1-h6 have `letter-spacing: -0.025em`

---

## 4. Backend Architecture

### Tech Stack
- FastAPI + uvicorn
- SQLAlchemy async (asyncpg for PostgreSQL, aiosqlite for local dev)
- JWT auth (python-jose)
- bcrypt password hashing via passlib **PINNED: bcrypt==3.2.2** (see critical bug below)
- pyotp for real TOTP 2FA
- qrcode library for QR generation

### Key API Endpoints
```
POST   /api/shorten                    — create short link (no auth required)
GET    /{short_code}                   — redirect (tracks click)
GET    /api/links/{short_code}/stats   — link analytics (session-based)
DELETE /api/links/{short_code}         — deactivate link (session-based)

POST   /api/qr/create                  — create QR code
GET    /api/qr/{qr_code}              — get QR code
DELETE /api/dashboard/qr/{qr_code}    — delete QR (auth required)

POST   /api/auth/register             — register user
POST   /api/auth/login                — login → returns JWT + user
POST   /api/auth/change-password      — change password (auth required)
POST   /api/auth/password-reset/request — send reset code (mock or real email)
POST   /api/auth/password-reset/verify  — verify code + set new password
POST   /api/auth/2fa/enable           — generate TOTP secret + QR image
POST   /api/auth/2fa/verify           — verify TOTP code → enable 2FA

GET    /api/dashboard                 — all user links + QR codes + totals
GET    /api/dashboard/links/{code}/analytics — link analytics (auth required)
GET    /api/dashboard/qr/{code}/analytics   — QR analytics (auth required)
DELETE /api/dashboard/links/{code}    — delete link (auth required)
DELETE /api/dashboard/qr/{code}      — delete QR (auth required)

GET    /health                        — health check
```

### Database Models (models.py)
- `User`: id, email, hashed_password, name, is_active, two_fa_secret, two_fa_enabled
- `Link`: id, user_id, short_code, original_url, click_count, is_active, utm_*, created_at, expires_at
- `Click`: id, link_id, device_type, country, referrer, created_at
- `QRCode`: id, user_id, qr_code, qr_type, content, scan_count, is_active
- `QRScan`: id, qr_id, device_type, country, created_at

### Safe DB Migrations (database.py)
New columns are added via `init_db()` with try/except:
```python
# PostgreSQL: IF NOT EXISTS
"ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_secret VARCHAR(64)"
# SQLite: catch exception if column exists
try: await conn.execute(text(sql))
except: pass
```

---

## 5. Frontend ↔ Backend (lib/auth.ts)

All API calls go through `apiFetch()` which:
1. Reads `VITE_API_URL` env var (default: Railway URL)
2. Adds `Authorization: Bearer {token}` header
3. Sets `Content-Type: application/json`

### Key exported functions:
```typescript
getUser() → User | null
getToken() → string | null
logout()
register(email, password, name) → TokenResponse
login(email, password) → TokenResponse
getDashboard() → DashboardData
getLinkStats(shortCode) → LinkStats
getQRStats(qrCode) → QRStats
deleteLink(shortCode) → void
deleteQR(qrCode) → void
changePassword(current, new) → { message }
requestPasswordReset(email) → { message, dev_code? }
enable2FA() → { qr_code, secret }
verify2FA(code) → { message }
```

### Auth Token Storage
- `zapkit_auth_token` → localStorage + cookie (path=/, 7-day max-age)
- `zapkit_user` → localStorage + cookie
- `zapkit_last_activity` → for idle timeout (30 min)
- Cross-tab sync via `window.addEventListener('storage', ...)`

---

## 6. Critical Bugs & Fixes (Learn From These)

### Bug 1: bcrypt 72-byte password crash
**Error:** `ValueError: password cannot be longer than 72 bytes`  
**Cause:** passlib 1.7.4 is incompatible with bcrypt >= 4.0  
**Fix:**
```
# requirements.txt
bcrypt==3.2.2
passlib[bcrypt]==1.7.4
```
AND truncate in auth.py:
```python
def hash_password(password: str) -> str:
    p = password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return pwd_context.hash(p)
```
**Status:** Fixed. NEVER upgrade bcrypt without testing.

### Bug 2: 2FA QR not scannable
**Cause:** `two_fa_secret` not saved to DB after generating. `verify_2fa` accepted ANY 6-digit code.  
**Fix:** Save secret on enable. Use `pyotp.TOTP.verify(code, valid_window=1)` for real validation.

### Bug 3: TypeScript build fails silently
**tsconfig.app.json has `noUnusedLocals: true` and `noUnusedParameters: true`**  
Any unused import = build failure on Netlify.  
Common pattern: add an icon to lucide-react import but forget to use it (or vice versa).  
**Fix:** Always run `tsc --noEmit` before pushing. Or check Netlify logs for exact line numbers.

### Bug 4: Netlify not auto-deploying
**Cause:** Netlify deploy_source was "api" — not connected to GitHub webhook.  
**Symptoms:** Railway auto-deploys from push but Netlify stays on old version.  
**Fix:** Re-link repo in Netlify UI: Site Config → Build & Deploy → Link repository → shriki95/Zapkit → branch: main

### Bug 5: Dashboard inside tool pages
**Old bug:** "My Dashboard" button in TinyLink/QR opened internal tab (setTab/setAppTab).  
**Fix:** Changed to `navigate('/dashboard')` / removed internal dashboard tab from both pages.

### Bug 6: initAutoLogout called twice
**Old bug:** Auto-logout registered twice in TinyLink → memory leak.  
**Fix:** Moved to App.tsx — called once for the entire app.

### Bug 7: Hardcoded localhost URLs
**Old bug:** Links in home page and footer used `http://localhost:5173` etc.  
**Fix:** All inter-page navigation uses React Router `<Link to="/tinylink">` or `navigate('/tinylink')`.

---

## 7. Design System

### Brand Colors
- **Primary:** `#00C4A7` (teal) — default accent
- **Hover:** `#00B096`
- **Background (light):** `#f8fafc` / `#ffffff`
- **Background (dark):** `#0f172a` / `#1e293b`
- **Text (light):** `#0f172a` / **Text (dark):** `#f1f5f9`

### Typography
- **Font:** Plus Jakarta Sans (weights 300–800, loaded from Google Fonts)
- **Headings:** `font-extrabold tracking-tight` (letter-spacing: -0.025em)
- **Body:** `font-medium` or `font-normal`

### Component Classes (index.css)
- `.btn-primary` — teal button using `var(--brand)`
- `.card` — white/dark rounded-2xl with border
- `.input-field` — consistent text input with brand focus ring
- `.brand-text`, `.brand-bg`, `.brand-border` — CSS var utilities

### Color Theme Kits (Settings → Preferences)
5 accent presets stored in `localStorage('zapkit-accent')`:
| Kit | Color | CSS attr |
|-----|-------|----------|
| ZapKit Teal (default) | `#00C4A7` | none |
| Midnight Indigo | `#6366f1` | `data-accent="indigo"` |
| Rose Quartz | `#f43f5e` | `data-accent="rose"` |
| Amber Gold | `#f59e0b` | `data-accent="amber"` |
| Sky Blue | `#0ea5e9` | `data-accent="sky"` |

Applied instantly via `document.documentElement.setAttribute('data-accent', kit)`.  
Loaded on app init in `App.tsx useEffect`.

### Icons
- **Library:** Lucide React exclusively — NO emojis, NO generic icon fonts
- Common: `Link2`, `QrCode`, `LayoutDashboard`, `Settings`, `Zap`, `TrendingUp`, `Eye`, `Trash2`, `RefreshCw`, `LogIn`, `LogOut`, `Moon`, `Sun`, `CheckSquare`, `Square`

---

## 8. Deployment

### Frontend — Netlify
```toml
# netlify.toml
[build]
  base    = "frontend"
  command = "npm install && npm run build"
  publish = "dist"
[build.environment]
  NODE_VERSION = "20"
  VITE_API_URL = "https://zapkit-backend-production.up.railway.app"
[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 200
```
**Site:** zapkit2.netlify.app  
**Auto-deploy:** Linked to GitHub main branch — every push triggers a build.

### Backend — Railway
- Connected to GitHub, auto-deploys on every push to `main`
- URL: `zapkit-backend-production.up.railway.app`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Required Environment Variables

**Backend (Railway):**
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string (from Railway DB) |
| `SECRET_KEY` | Auto-generated random string |
| `BASE_URL` | `https://zapkit-backend-production.up.railway.app` |
| `ALLOWED_ORIGINS` | `https://zapkit2.netlify.app` |
| `EMAIL_MOCK_MODE` | `true` (dev) / `false` (prod with real SMTP) |
| `SMTP_HOST` | (optional) e.g. smtp.gmail.com |
| `SMTP_USER` | (optional) your email |
| `SMTP_PASS` | (optional) app password |

**Frontend (Netlify):**
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://zapkit-backend-production.up.railway.app` |

---

## 9. Local Development

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API at http://localhost:8000, docs at http://localhost:8000/docs

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

**Local env:** frontend reads `VITE_API_URL` from `.env.local`:
```
VITE_API_URL=http://localhost:8000
```

---

## 10. Deploying a New App From This Template

This section is designed to help build other apps at the same quality level, fast.

### Minimal Stack Checklist
- [ ] Clone repo structure: `frontend/` + `backend/`
- [ ] `frontend/package.json` — copy dependencies (react, tailwind, lucide, framer-motion, recharts)
- [ ] `netlify.toml` — set `base=frontend`, SPA redirect
- [ ] `render.yaml` or Railway — set `rootDir=backend`
- [ ] `backend/requirements.txt` — fastapi, uvicorn, sqlalchemy, asyncpg, pyjwt, passlib, **bcrypt==3.2.2**, pyotp, qrcode
- [ ] `backend/database.py` — async engine, `init_db()` with safe migrations
- [ ] `backend/auth.py` — hash_password (72-byte truncation), verify_password, JWT encode/decode
- [ ] `frontend/src/lib/auth.ts` — apiFetch(), token in localStorage + cookies
- [ ] `frontend/index.html` — Google Fonts link (Plus Jakarta Sans)
- [ ] `frontend/src/index.css` — CSS variables, Tailwind config, font

### Patterns That Work Well
1. **AuthContext** in root App.tsx — share user/dark/modal state to all pages without prop drilling
2. **CSS custom properties for theming** — `var(--brand)` instead of hardcoded colors
3. **Safe DB migrations** in `init_db()` using try/except — never break existing deployments
4. **`noUnusedLocals: true`** in tsconfig — catches dead imports before Netlify fails
5. **ScrollToTop component** in App.tsx using `useLocation` — smooth UX on navigation
6. **React Router `<Link>`** for all internal navigation — never `window.location.href` or hardcoded URLs
7. **apiFetch() wrapper** with auto-auth header — all API calls in one place
8. **EMAIL_MOCK_MODE** env var — dev mode returns code in API response; prod uses SMTP
9. **`deploy_source: api`** for Netlify — if auto-deploy breaks, trigger via `npx @netlify/mcp@latest`
10. **Delete endpoints** always soft-delete (`is_active = False`) — never hard DELETE from DB

### Common Mistakes to Avoid
- **Never upgrade bcrypt** above 3.2.2 without testing passlib compatibility
- **Never hardcode localhost** URLs in frontend — always use env vars or React Router
- **Never call `initAutoLogout()` twice** — only call it once at the app root
- **Never forget to import** icons you use (noUnusedLocals will fail the build)
- **Never call `setTab('dashboard')`** inside a sub-page to navigate — use `navigate('/dashboard')`
- **Never commit `two_fa_secret`** or other secrets to git
- **Never use emojis** in UI — use Lucide React icons exclusively
- **Never use `<a href>` for internal links** — use React Router `<Link to="/">`

---

## 11. Recent Changes Log

### 2026-05-01 — Major Feature Batch
- **Backend:** Added `DELETE /api/dashboard/links/{code}` and `DELETE /api/dashboard/qr/{code}` (auth-required soft delete)
- **Backend:** Added real TOTP 2FA with pyotp (secret saved to DB, `verify()` with valid_window=1)
- **Backend:** Added `POST /api/auth/change-password`
- **Backend:** Fixed bcrypt 72-byte crash (pinned bcrypt==3.2.2, added truncation in auth.py)
- **Frontend:** New standalone `/dashboard` route (DashboardPage.tsx) — Analytics + Settings tabs in one place
- **Frontend:** DashboardPage — multi-item selection (checkboxes), compare multiple links/QR in one chart
- **Frontend:** DashboardPage — delete button on hover, confirmation modal
- **Frontend:** DashboardPage — removed "Shorten a Link" CTA, kept only Refresh
- **Frontend:** Settings.tsx — 5 color theme kits (teal/indigo/rose/amber/sky) saved to localStorage
- **Frontend:** Settings.tsx — real account stats from API (no more hardcoded numbers)
- **Frontend:** Settings.tsx — functional Change Password section with show/hide toggles
- **Frontend:** App.tsx — loads accent color kit from localStorage on mount
- **Frontend:** index.css — CSS custom properties for theming, Plus Jakarta Sans font
- **Frontend:** HomePage.tsx — "How it works" rewritten for both tools; registration CTA added
- **Frontend:** TinyLink/QR — Dashboard tab removed from internal nav; user button → navigate('/dashboard')
- **Frontend:** Fixed TypeScript build errors (Trash2, Bell imports missing; UserIcon unused)

### 2026-04-30 — Unified Single App
- Merged 3 separate React apps (home, tinylink-pro, qr-generator-pro) into one React Router app
- Created AuthContext, ScrollToTop, GDPRBanner at App.tsx level
- All cross-app links converted from localhost URLs to React Router Links

---

## 12. For the Next AI Agent

**Read this before doing anything:**

1. **The app is a single React SPA** at `frontend/`. Never create separate apps.
2. **`useAuth()`** gives you everything: user, setUser, dark, setDark, showAuthModal, authMode.
3. **All navigation** must use `<Link to="...">` or `navigate('...')` — never `window.location.href`.
4. **TypeScript is strict.** `noUnusedLocals` and `noUnusedParameters` are enabled. Unused imports = build failure.
5. **Netlify auto-deploys** from GitHub `main` branch. Check build logs if deploy fails.
6. **Railway auto-deploys** backend from GitHub `main` branch.
7. **Never hardcode `#00C4A7`** in new components — use `var(--brand)` or `text-[#00C4A7]` for Tailwind.
8. **No emojis** anywhere in the UI. Use Lucide React icons.
9. **Font:** Plus Jakarta Sans. Already loaded. Just use `font-family: 'Plus Jakarta Sans'` or let it inherit.
10. **Dashboard is at `/dashboard`** — standalone page. Never embed it as a tab inside tool pages.
11. **Settings is inside DashboardPage** (second tab). Don't create a separate `/settings` route.
12. **Color theme kits** are applied via `data-accent` HTML attribute + CSS vars in `index.css`.
13. **Password reset** returns `dev_code` in response when `EMAIL_MOCK_MODE=true` — shown in AuthModal amber box.
14. **2FA** uses real TOTP (pyotp). Secret stored in `users.two_fa_secret`. Verify with `valid_window=1`.
15. **Delete** is always soft (`is_active=False`) — never hard DELETE.
