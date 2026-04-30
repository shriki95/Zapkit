import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { logout } from '../lib/auth'
import { useAuth } from '../App'

export default function HomePage() {
  const { user, setUser, dark, setDark, setShowAuthModal, setAuthMode } = useAuth()

  // Update activity timestamp
  useEffect(() => {
    const updateActivity = () => {
      if (!user) return
      const now = String(Date.now())
      localStorage.setItem('zapkit_last_activity', now)
      document.cookie = `zapkit_last_activity=${now}; path=/; SameSite=Lax; max-age=604800`
    }
    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }))
    return () => events.forEach(e => window.removeEventListener(e, updateActivity))
  }, [user])

  const handleLoginClick = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  const handleLogout = () => {
    logout()
    setUser(null)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif", background: dark ? '#0f172a' : '#f8fafc', color: dark ? '#f1f5f9' : '#0f172a' }}>
      <style>{`
        @media (max-width: 600px) {
          .zk-header-btns { gap: 4px !important; }
          .zk-header-btns a, .zk-header-btns button { padding: 5px 8px !important; font-size: 0.78rem !important; }
          .zk-stats-grid { grid-template-columns: repeat(3,1fr) !important; gap: 0.5rem !important; }
          .zk-stats-grid > div > div:first-child { font-size: 1.4rem !important; }
          .zk-cards-grid { padding: 0 1rem 2.5rem !important; margin-top: -1.5rem !important; }
          .zk-hero { padding: 3rem 1rem 2.5rem !important; }
          .zk-footer { padding: 1rem !important; font-size: 0.7rem !important; }
        }
        @media (max-width: 400px) {
          .zk-stats-grid { grid-template-columns: 1fr !important; }
          .zk-header-logo span { font-size: 0.95rem !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: dark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
        padding: '0 1.5rem', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#00C4A7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: dark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em' }}>
            Zap<span style={{ color: '#00C4A7' }}>Kit</span>
          </span>
        </Link>

        <div className="zk-header-btns" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <Link
                to="/tinylink"
                style={{ padding: '6px 14px', background: '#00C4A7', color: 'white', textDecoration: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600 }}
              >
                My Dashboard
              </Link>
              <button
                onClick={handleLogout}
                style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, color: dark ? '#94a3b8' : '#64748b', borderRadius: 8, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleLoginClick}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'transparent', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, color: dark ? '#f1f5f9' : '#0f172a', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Login
            </button>
          )}
          <button
            onClick={() => setDark((d: boolean) => !d)}
            aria-label="Toggle dark mode"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: dark ? '#94a3b8' : '#64748b' }}
          >
            {dark ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', padding: '5rem 1.5rem 4rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,196,167,0.15)', border: '1px solid rgba(0,196,167,0.3)', color: '#00C4A7', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: 999, marginBottom: '1.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Trusted by professionals worldwide
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
          Enterprise-Grade Tools.<br/><span style={{ color: '#00C4A7' }}>Zero Cost.</span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: 520, margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Professional link management and QR code generation. Built for businesses, free for everyone. No registration required.
        </p>
      </section>

      {/* ── Tool Cards ── */}
      <section style={{ maxWidth: 860, margin: '-2.5rem auto 0', padding: '0 1.5rem 4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>

        {/* TinyLink Pro */}
        <Link to="/tinylink" style={{ background: dark ? '#1e293b' : '#ffffff', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, borderRadius: 20, padding: '2rem 1.75rem', textDecoration: 'none', color: dark ? '#f1f5f9' : '#0f172a', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,196,167,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = '#00C4A7' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = dark ? '#334155' : '#e2e8f0' }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(0,196,167,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#00C4A7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>TinyLink <span style={{ color: '#00C4A7' }}>Pro</span></div>
            <div style={{ fontSize: '0.875rem', color: dark ? '#94a3b8' : '#64748b', lineHeight: 1.5, marginTop: 4 }}>Professional URL shortening with enterprise-grade analytics and tracking.</div>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: dark ? '#94a3b8' : '#64748b' }}>
            {['Instant branded short links', 'Real-time click analytics', 'Geographic & device insights', 'Seamless QR code integration'].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#00C4A7', fontWeight: 700 }}>✓</span> {f}
              </li>
            ))}
          </ul>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#00C4A7', color: '#fff', fontSize: '0.875rem', fontWeight: 700, padding: '10px 20px', borderRadius: 10, marginTop: 'auto', alignSelf: 'flex-start' }}>
            Launch TinyLink Pro
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </Link>

        {/* QR Generator Pro */}
        <Link to="/qr" style={{ background: dark ? '#1e293b' : '#ffffff', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, borderRadius: 20, padding: '2rem 1.75rem', textDecoration: 'none', color: dark ? '#f1f5f9' : '#0f172a', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,196,167,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = '#00C4A7' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = dark ? '#334155' : '#e2e8f0' }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(0,196,167,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#00C4A7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>QR Generator <span style={{ color: '#00C4A7' }}>Pro</span></div>
            <div style={{ fontSize: '0.875rem', color: dark ? '#94a3b8' : '#64748b', lineHeight: 1.5, marginTop: 4 }}>Create stunning, customizable QR codes with advanced design options.</div>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: dark ? '#94a3b8' : '#64748b' }}>
            {['12+ QR code types supported', 'Custom branding & logos', 'Batch generation & scanning', 'High-resolution export (PNG/SVG)'].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#00C4A7', fontWeight: 700 }}>✓</span> {f}
              </li>
            ))}
          </ul>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#00C4A7', color: '#fff', fontSize: '0.875rem', fontWeight: 700, padding: '10px 20px', borderRadius: 10, marginTop: 'auto', alignSelf: 'flex-start' }}>
            Launch QR Generator Pro
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </Link>

      </section>

      {/* ── Stats ── */}
      <section style={{ background: dark ? '#1e293b' : '#ffffff', borderTop: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, borderBottom: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
          {[
            { num: '100%', label: 'Free Forever' },
            { num: '∞', label: 'Unlimited Usage' },
            { num: '0', label: 'Registration Required' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#00C4A7', letterSpacing: '-0.03em' }}>{s.num}</div>
              <div style={{ fontSize: '0.8rem', color: dark ? '#94a3b8' : '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ marginTop: 'auto', padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: dark ? '#94a3b8' : '#64748b', borderTop: `1px solid ${dark ? '#334155' : '#e2e8f0'}` }}>
        <p>
          © {new Date().getFullYear()} <strong>ZapKit</strong> · Free digital tools, built to last. &nbsp;·&nbsp;
          <Link to="/tinylink" style={{ color: '#00C4A7', textDecoration: 'none' }}>TinyLink Pro</Link>
          &nbsp;·&nbsp;
          <Link to="/qr" style={{ color: '#00C4A7', textDecoration: 'none' }}>QR Generator Pro</Link>
        </p>
      </footer>

    </div>
  )
}
