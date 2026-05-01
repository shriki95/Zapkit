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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif", background: dark ? '#0f172a' : '#f8fafc', color: dark ? '#f1f5f9' : '#0f172a', overflowX: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 600px) {
          .zk-header-btns { gap: 4px !important; }
          .zk-header-btns a, .zk-header-btns button { padding: 5px 8px !important; font-size: 0.78rem !important; }
          .zk-stats-grid { grid-template-columns: repeat(3,1fr) !important; gap: 0.5rem !important; }
          .zk-stats-grid > div > div:first-child { font-size: 1.4rem !important; }
          .zk-cards-grid { grid-template-columns: 1fr !important; padding: 0 1rem 2.5rem !important; margin-top: -1.5rem !important; }
          .zk-hero { padding: 3rem 1rem 2.5rem !important; }
          .zk-hero h1 { font-size: 1.8rem !important; }
          .zk-hero p { font-size: 0.9rem !important; }
          .zk-badge { font-size: 0.65rem !important; padding: 3px 8px !important; }
          .zk-footer { padding: 1rem !important; font-size: 0.7rem !important; }
        }
        @media (max-width: 400px) {
          .zk-stats-grid { grid-template-columns: 1fr !important; }
          .zk-header-logo span { font-size: 0.95rem !important; }
          .zk-hero h1 { font-size: 1.5rem !important; }
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
      <section className="zk-hero" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', padding: '5rem 1.5rem 4rem', textAlign: 'center', width: '100%' }}>
        <div className="zk-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,196,167,0.15)', border: '1px solid rgba(0,196,167,0.3)', color: '#00C4A7', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: 999, marginBottom: '1.5rem', letterSpacing: '0.05em', textTransform: 'uppercase', maxWidth: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{ flexShrink: 0 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Trusted by professionals worldwide
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 3.25rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-0.03em', wordBreak: 'break-word' }}>
          Enterprise-Grade Tools.<br/><span style={{ color: '#00C4A7' }}>Zero Cost.</span>
        </h1>
        <p className="zk-hero p" style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: 520, margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Professional link management and QR code generation. Built for businesses, free for everyone. No registration required.
        </p>
      </section>

      {/* ── Tool Cards ── */}
      <section className="zk-cards-grid" style={{ maxWidth: 860, width: '100%', margin: '-2.5rem auto 0', padding: '0 1.5rem 4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '1.25rem' }}>

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
      <section className="zk-stats-grid" style={{ background: dark ? '#1e293b' : '#ffffff', borderTop: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, borderBottom: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
          {[
            { num: '50K+', label: 'Links Created' },
            { num: '100%', label: 'Free Forever' },
            { num: '∞', label: 'Unlimited Usage' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#00C4A7', letterSpacing: '-0.03em' }}>{s.num}</div>
              <div style={{ fontSize: '0.8rem', color: dark ? '#94a3b8' : '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '3.5rem 1.5rem', background: dark ? '#0f172a' : '#f8fafc' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00C4A7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>What users say</div>
            <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 2rem)', fontWeight: 800, color: dark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em' }}>
              Trusted by professionals worldwide
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '1.25rem' }}>
            {[
              { name: 'Sarah M.', role: 'Marketing Manager', avatar: 'SM', text: "ZapKit is the only link tool I need. The analytics are surprisingly detailed for a free product — I can see exactly where my traffic comes from.", stars: 5 },
              { name: 'David K.', role: 'Freelance Designer', avatar: 'DK', text: "The QR Generator Pro is insane. Custom logos, colors, SVG export — all free. I use it for every client deliverable.", stars: 5 },
              { name: 'Rachel T.', role: 'E-commerce Owner', avatar: 'RT', text: "I was paying $29/month for a link shortener. ZapKit gives me the same features at zero cost. Switched and never looked back.", stars: 5 },
            ].map((t) => (
              <div key={t.name} style={{ background: dark ? '#1e293b' : '#ffffff', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(t.stars)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
                <p style={{ fontSize: '0.85rem', color: dark ? '#cbd5e1' : '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#00C4A7,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: dark ? '#f1f5f9' : '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: '0.7rem', color: dark ? '#94a3b8' : '#64748b' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '3rem 1.5rem', background: dark ? '#1e293b' : '#ffffff', borderTop: `1px solid ${dark ? '#334155' : '#e2e8f0'}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00C4A7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Super simple</div>
          <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 800, color: dark ? '#f1f5f9' : '#0f172a', marginBottom: '2rem' }}>Get started in seconds</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '1.5rem' }}>
            {[
              { step: '1', icon: '🔗', title: 'Paste your URL', desc: 'Drop any long link into the box — no account needed' },
              { step: '2', icon: '⚡', title: 'Get your short link', desc: 'Your branded link is ready in under a second' },
              { step: '3', icon: '📊', title: 'Track your results', desc: 'See clicks, devices, countries — all in real time' },
            ].map((s) => (
              <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,196,167,0.1)', border: '2px solid rgba(0,196,167,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: dark ? '#f1f5f9' : '#0f172a' }}>{s.title}</div>
                <div style={{ fontSize: '0.78rem', color: dark ? '#94a3b8' : '#64748b', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="zk-footer" style={{ marginTop: 'auto', padding: '2rem 1.5rem', background: dark ? '#0f172a' : '#f8fafc', borderTop: `1px solid ${dark ? '#334155' : '#e2e8f0'}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#00C4A7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span style={{ fontWeight: 800, color: dark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em' }}>Zap<span style={{ color: '#00C4A7' }}>Kit</span></span>
            <span style={{ fontSize: '0.75rem', color: dark ? '#94a3b8' : '#64748b' }}>· Free digital tools, built to last</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem 1.5rem', fontSize: '0.78rem' }}>
            <Link to="/tinylink" style={{ color: '#00C4A7', textDecoration: 'none' }}>TinyLink Pro</Link>
            <Link to="/qr" style={{ color: '#00C4A7', textDecoration: 'none' }}>QR Generator Pro</Link>
            <Link to="/privacy" style={{ color: dark ? '#94a3b8' : '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: dark ? '#94a3b8' : '#64748b', textDecoration: 'none' }}>Terms of Use</Link>
            <Link to="/contact" style={{ color: dark ? '#94a3b8' : '#64748b', textDecoration: 'none' }}>Contact</Link>
          </div>
          <p style={{ fontSize: '0.72rem', color: dark ? '#475569' : '#94a3b8' }}>
            © {new Date().getFullYear()} ZapKit. All rights reserved. Built with ❤️ for creators & businesses worldwide.
          </p>
        </div>
      </footer>

    </div>
  )
}
