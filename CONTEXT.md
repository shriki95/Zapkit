# 🎯 ZapKit - Project Context

> **Last Updated:** 2026-04-30  
> **Status:** ✅ Unified Single-App — Ready for Netlify + Render Deployment

---

## 📋 Project Overview

**ZapKit** is an enterprise-grade digital tools suite with:
- **TinyLink Pro** - URL shortener with real-time analytics
- **QR Generator Pro** - Advanced QR code creator
- **Unified Backend** - FastAPI + PostgreSQL
- **Shared Authentication** - JWT-based auth across all apps

---

## 🏗️ Architecture — Unified Single App (2026-04-30)

> **⚠️ MAJOR REFACTOR:** The project was unified from 3 separate apps into ONE React app with React Router.

```
ZapKit/
├── frontend/                       # ✅ SINGLE unified React app
│   ├── src/
│   │   ├── App.tsx                 # React Router + AuthContext (global)
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── vite-env.d.ts
│   │   ├── pages/
│   │   │   ├── HomePage.tsx        # Route: / (was home/index.html)
│   │   │   ├── TinyLinkPage.tsx    # Route: /tinylink
│   │   │   └── QRGeneratorPage.tsx # Route: /qr
│   │   ├── components/             # Shared components
│   │   │   ├── AuthModal.tsx       # Global auth modal
│   │   │   ├── Dashboard.tsx       # Unified dashboard
│   │   │   ├── Settings.tsx
│   │   │   ├── GDPRBanner.tsx
│   │   │   ├── AdModal.tsx
│   │   │   ├── AdUnit.tsx
│   │   │   ├── SEOOptimizer.tsx
│   │   │   ├── UsageModal.tsx
│   │   │   └── SSLUpload.tsx
│   │   ├── features/
│   │   │   ├── links/              # TinyLink Pro feature components
│   │   │   └── qr/                 # QR Generator feature components
│   │   └── lib/auth.ts             # Auth utilities (unchanged)
│   ├── public/                     # Static assets
│   ├── package.json                # Combined dependencies
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.production             # VITE_API_URL=https://zapkit-backend.onrender.com
│
├── backend/                        # FastAPI backend (moved from tinylink-pro/backend/)
│   ├── main.py                     # All API endpoints (links + QR + auth)
│   ├── auth.py, models.py, schemas.py, database.py
│   └── requirements.txt
│
├── netlify.toml                    # ✅ Updated: base=frontend, SPA redirect
├── render.yaml                     # ✅ Updated: rootDir=backend
├── .gitignore
└── CONTEXT.md
```

---

## 🔧 Technical Stack

### Frontend:
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State:** React hooks + Context
- **Auth:** JWT tokens in cookies + localStorage
- **Theme:** Dark mode with cookie sync

### Backend:
- **Framework:** FastAPI
- **Database:** PostgreSQL (async with SQLAlchemy)
- **Auth:** JWT + bcrypt
- **Email:** SMTP for password reset
- **Analytics:** Real-time click/scan tracking
- **Security:** Rate limiting, CORS, CSRF protection

---

## 🔐 Authentication System

### Shared Auth Across Apps:
- **Cookies:** `zapkit_auth_token`, `zapkit_user`, `zapkit_last_activity`
- **Path:** `/` (shared across all subpaths)
- **Expiry:** 7 days
- **Idle Timeout:** 30 minutes

### Flow:
1. User logs in via TinyLink Pro
2. Token saved in cookie with `path=/`
3. QR Generator reads same cookie
4. Home page detects logged-in state
5. All apps share authentication state

---

## 🌐 URL Structure

### Production (Netlify + Render):
- **Landing:** `https://zapkit.netlify.app/`
- **TinyLink:** `https://zapkit.netlify.app/tinylink`
- **QR Generator:** `https://zapkit.netlify.app/qr`
- **API:** `https://zapkit-backend.onrender.com`

### Routing (React Router v7 — SPA):
```
/          → HomePage.tsx
/tinylink  → TinyLinkPage.tsx
/qr        → QRGeneratorPage.tsx
/*         → redirects to /
```
Netlify serves `index.html` for all routes (SPA redirect in netlify.toml).

---

## ✅ What's Working

### Frontend:
- ✅ All 3 apps built successfully
- ✅ Navigation between apps (via logo clicks)
- ✅ Shared dark mode (cookie-based)
- ✅ Shared authentication (cookie-based)
- ✅ Responsive design
- ✅ Production URLs configured

### Backend:
- ✅ User registration/login
- ✅ Password reset with email
- ✅ Link shortening
- ✅ QR code generation
- ✅ Real-time analytics
- ✅ Rate limiting
- ✅ CORS configured

### Build System:
- ✅ `build.sh` works on Linux
- ✅ `dist/` folder ready for deployment
- ✅ All dependencies installed

---

## 🐛 Known Issues & Fixes

### ✅ FIXED:
1. **QR Generator TypeScript Error**
   - Issue: `createTrackedQR` function not found
   - Fix: Removed import and usage from `App.tsx`
   - Status: ✅ Built successfully

2. **Home Page Links**
   - Issue: Links were localhost URLs
   - Fix: Changed to relative paths (`/tinylink`, `/qr`)
   - Status: ✅ Production-ready

3. **Environment Variables**
   - Issue: URLs pointed to Vercel
   - Fix: Updated to Netlify/Render URLs
   - Status: ✅ Configured

### ⚠️ Current Limitations:
- Local testing requires `index-local.html` (file:// protocol doesn't support relative paths)
- Backend needs to be deployed before frontend works fully
- Email service requires SMTP configuration

---

## 🚀 Deployment Status

### Ready for:
- ✅ **Render** (recommended - supports backend + frontend + database)
- ✅ **Netlify** (frontend only - needs separate backend)

### Files Configured:
- ✅ `render.yaml` - Full stack deployment
- ✅ `netlify.toml` - Frontend deployment
- ✅ `build.sh` - Build script
- ✅ `.gitignore` - Git configuration

---

## 📝 Next Steps

### For Render Deployment:
1. Push to GitHub
2. Connect Render to repo
3. Render auto-detects `render.yaml`
4. Set environment variables:
   - Backend: `BASE_URL`, `ALLOWED_ORIGINS`
   - Frontend: `VITE_API_URL`
5. Deploy (auto-builds everything)

### For Firebase/Firestore Integration:
1. Replace PostgreSQL with Firestore
2. Update `database.py` to use Firebase SDK
3. Modify models to use Firestore documents
4. Update authentication to use Firebase Auth (optional)

---

## 🔑 Environment Variables Needed

### Backend:
```env
DATABASE_URL=postgresql://...
SECRET_KEY=<auto-generated>
BASE_URL=https://zapkit-backend.onrender.com
ALLOWED_ORIGINS=https://zapkit-frontend.onrender.com
```

### Frontend:
```env
VITE_API_URL=https://zapkit-backend.onrender.com
```

---

## 📦 Dependencies

### Frontend (each app):
- react, react-dom
- typescript
- vite
- tailwindcss
- lucide-react (icons)
- framer-motion (animations)
- recharts (analytics charts)
- qr-code-styling (QR generation)

### Backend:
- fastapi
- uvicorn
- sqlalchemy
- asyncpg (PostgreSQL)
- pyjwt (authentication)
- passlib (password hashing)
- python-dotenv
- qrcode (QR generation)

---

## 🎨 Design System

### Colors:
- **Brand:** `#00C4A7` (teal)
- **Background:** `#f8fafc` (light) / `#0f172a` (dark)
- **Text:** `#0f172a` (light) / `#f1f5f9` (dark)

### Components:
- Shared header with logo
- Dark mode toggle
- Auth modal (login/register)
- Dashboard with analytics
- Responsive cards

---

## 🔄 Recent Changes

### Session: 2026-04-30 — Unification to Single App
- ✅ **MAJOR:** Merged 3 separate React apps into ONE unified app with React Router v7
- ✅ Created `frontend/` directory with combined dependencies
- ✅ Created `App.tsx` with BrowserRouter + AuthContext (shared auth state)
- ✅ Created `pages/HomePage.tsx` (converted from home/index.html to React)
- ✅ Created `pages/TinyLinkPage.tsx` (from tinylink-pro App.tsx + bug fixes)
- ✅ Created `pages/QRGeneratorPage.tsx` (from qr-generator-pro App.tsx + bug fixes)
- ✅ Fixed Bug: `initAutoLogout` was called twice in TinyLink (memory leak) → moved to App.tsx
- ✅ Fixed Bug: `VITE_QR_APP_URL` env var in footer → replaced with `<Link to="/qr">`
- ✅ Fixed Bug: `VITE_TINYLINK_APP_URL` env var in footer → replaced with `<Link to="/tinylink">`
- ✅ Fixed Bug: All localhost:5173/5175 hardcoded URLs → React Router Links
- ✅ Fixed Bug: `SEOOptimizer` import in QR page (named vs default export)
- ✅ Fixed Bug: `ResultCard` QR_APP_URL env var → replaced with `/qr`
- ✅ Moved backend from `tinylink-pro/backend/` to `backend/`
- ✅ Updated `netlify.toml` (base=frontend, single SPA redirect)
- ✅ Updated `render.yaml` (rootDir: backend)
- ✅ Deleted: home/, tinylink-pro/, qr-generator-pro/, build.sh, build-for-netlify.bat, vercel.json
- ✅ Build: `npm run build` succeeds with 0 TypeScript errors

### Session: Render Deployment Prep (previous)
- ✅ Created `render.yaml` for full-stack deployment
- ✅ Fixed `build.sh` for Linux compatibility
- ✅ Updated all environment variables
- ✅ Fixed QR Generator TypeScript error (removed createTrackedQR)
- ✅ Built all apps to `dist/`

---

## 💡 Tips for Next Agent

1. **Single app** - All pages live in `frontend/src/pages/`. No more multiple builds.
2. **Auth is global** - `AuthContext` in `App.tsx` provides `user`, `setUser`, `showAuthModal`, `dark` to ALL pages via `useAuth()` hook.
3. **Navigation** - Use `<Link to="/tinylink">` or `<Link to="/qr">`, NOT `<a href>` or `window.location.href`.
4. **Build** - Run from `frontend/`: `npm install && npm run build` → outputs to `frontend/dist/`
5. **Backend** - All API endpoints in `backend/main.py`. Run: `cd backend && uvicorn main:app --reload`
6. **Theme** - `zapkit-theme` in localStorage + cookie, managed globally in `App.tsx`
7. **Dev** - Frontend: `cd frontend && npm run dev` (port 5173). Backend: `cd backend && uvicorn main:app --reload` (port 8000).

## 🚀 Deployment Commands

### Local Development:
```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Netlify (Frontend):
```bash
cd frontend && npm install && npm run build
# Upload frontend/dist/ to Netlify
# OR connect repo: base=frontend, build=npm run build, publish=dist
```

### Render (Backend):
- Connect repo, use render.yaml (auto-detects)
- Set env vars: DATABASE_URL, BASE_URL, ALLOWED_ORIGINS

---

## 📞 Support

- Backend API docs: `/docs` (FastAPI auto-generated)
- Health check: `/health`
- All endpoints: `/api/*`

---

**Status:** 🟢 Ready for deployment
**Last Build:** Successful
**Next Action:** Deploy to Render or connect to Firebase
