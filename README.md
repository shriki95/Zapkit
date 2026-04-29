# 🚀 ZapKit - Enterprise Digital Tools Suite

Professional URL shortening and QR code generation platform.

## 🎯 What's Included

- **TinyLink Pro** - URL shortener with analytics
- **QR Generator Pro** - Advanced QR code creator
- **Unified Dashboard** - Track all your links and QR codes
- **Backend API** - FastAPI with PostgreSQL

## 🏗️ Architecture

```
ZapKit/
├── home/                    # Landing page
├── tinylink-pro/
│   ├── frontend/           # React + TypeScript
│   └── backend/            # FastAPI + PostgreSQL
├── qr-generator-pro/
│   └── frontend/           # React + TypeScript
├── dist/                   # Built files (auto-generated)
├── build.sh               # Build script
└── render.yaml            # Render.com config
```

## 🚀 Deploy to Render

1. Push to GitHub
2. Connect to Render
3. Render will auto-detect `render.yaml`
4. Set environment variables
5. Deploy!

See `RENDER-DEPLOY.md` for detailed instructions.

## 💻 Local Development

### Backend
```bash
cd tinylink-pro/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (TinyLink)
```bash
cd tinylink-pro/frontend
npm install
npm run dev
```

### Frontend (QR Generator)
```bash
cd qr-generator-pro/frontend
npm install
npm run dev
```

## 🌐 URLs After Deployment

- **Landing:** https://zapkit-frontend.onrender.com
- **TinyLink:** https://zapkit-frontend.onrender.com/tinylink
- **QR Generator:** https://zapkit-frontend.onrender.com/qr
- **API:** https://zapkit-backend.onrender.com

## 🔐 Features

- ✅ User authentication (JWT)
- ✅ Password reset with email
- ✅ Real-time analytics
- ✅ Custom short URLs
- ✅ QR code tracking
- ✅ Dark mode
- ✅ Responsive design
- ✅ GDPR compliant

## 📝 License

MIT
