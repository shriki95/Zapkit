# 🎯 ZapKit - Project Context

> **Last Updated:** 2025-01-XX  
> **Status:** ✅ Ready for Render Deployment

---

## 📋 Project Overview

**ZapKit** is an enterprise-grade digital tools suite with:
- **TinyLink Pro** - URL shortener with real-time analytics
- **QR Generator Pro** - Advanced QR code creator
- **Unified Backend** - FastAPI + PostgreSQL
- **Shared Authentication** - JWT-based auth across all apps

---

## 🏗️ Architecture

```
ZapKit/
├── home/                           # Landing page (static HTML)
│   ├── index.html                  # ✅ Production-ready (relative paths)
│   └── index-local.html            # For local testing
│
├── tinylink-pro/
│   ├── frontend/                   # React + TypeScript + Vite
│   │   ├── src/
│   │   ├── .env.production         # ✅ Updated for Netlify/Render
│   │   └── dist/                   # Built files
│   └── backend/                    # FastAPI + SQLAlchemy
│       ├── main.py                 # API endpoints
│       ├── auth.py                 # JWT authentication
│       ├── database.py             # PostgreSQL connection
│       ├── models.py               # DB models
│       ├── requirements.txt        # Python dependencies
│       └── render.yaml             # Render config (legacy)
│
├── qr-generator-pro/
│   └── frontend/                   # React + TypeScript + Vite
│       ├── src/
│       │   └── App.tsx             # ✅ Fixed: removed createTrackedQR
│       ├── .env.production         # ✅ Updated for Netlify/Render
│       └── dist/                   # Built files
│
├── dist/                           # 🎯 Deployment-ready files
│   ├── home/                       # Landing page
│   ├── tinylink/                   # TinyLink Pro built
│   ├── qr/                         # QR Generator built
│   └── netlify.toml                # Netlify redirects
│
├── build.sh                        # ✅ Build script (Linux/Render)
├── render.yaml                     # ✅ Render Blueprint config
├── netlify.toml                    # Netlify config
├── .gitignore                      # Git ignore rules
└── README.md                       # Project documentation
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

### Production (Render):
- **Landing:** `https://zapkit-frontend.onrender.com/`
- **TinyLink:** `https://zapkit-frontend.onrender.com/tinylink`
- **QR Generator:** `https://zapkit-frontend.onrender.com/qr`
- **API:** `https://zapkit-backend.onrender.com`

### Redirects (handled by Render/Netlify):
```
/tinylink/*  → /tinylink/index.html
/qr/*        → /qr/index.html
/*           → /home/index.html
```

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

### Session: Render Deployment Prep
- ✅ Created `render.yaml` for full-stack deployment
- ✅ Fixed `build.sh` for Linux compatibility
- ✅ Updated all environment variables
- ✅ Fixed QR Generator TypeScript error
- ✅ Removed all instruction files (kept only CONTEXT.md)
- ✅ Created `.gitignore`
- ✅ Built all apps to `dist/`

---

## 💡 Tips for Next Agent

1. **Don't rebuild unnecessarily** - `dist/` already has built files
2. **Check environment variables** - They're configured in `.env.production`
3. **Use `render.yaml`** - It's the single source of truth for deployment
4. **Authentication is shared** - All apps use same cookies
5. **Backend is required** - Frontend needs API to work fully

---

## 📞 Support

- Backend API docs: `/docs` (FastAPI auto-generated)
- Health check: `/health`
- All endpoints: `/api/*`

---

**Status:** 🟢 Ready for deployment
**Last Build:** Successful
**Next Action:** Deploy to Render or connect to Firebase
