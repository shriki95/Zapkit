import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../lib/auth'
import { useAuth } from '../App'

export default function HomePage() {
  const { user, setUser, dark, setDark, setShowAuthModal, setAuthMode } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!showUserMenu) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showUserMenu])

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
    setShowUserMenu(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif", background: dark ? '#0f172a' : '#f8fafc', color: dark ? '#f1f5f9' : '#0f172a', overflowX: 'hidden' }}>
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
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(m => !m)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'rgba(0,196,167,0.1)', border: '1px solid rgba(0,196,167,0.2)', borderRadius: 10, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: dark ? '#fff' : '#0f172a' }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#00C4A7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                  {(user.name ?? user.email)[0].toUpperCase()}
                </div>
                <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name ?? user.email.split('@')[0]}
                </span>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: showUserMenu ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {showUserMenu && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 210, background: dark ? '#0f172a' : '#fff', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 50 }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${dark ? '#1e293b' : '#f1f5f9'}` }}>
                    <div style={{ fontSize: '0.7rem', color: dark ? '#64748b' : '#94a3b8' }}>Signed in as</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: dark ? '#fff' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name ?? user.email.split('@')[0]}
                    </div>
                  </div>
                  <button
                    onClick={() => { navigate('/dashboard'); setShowUserMenu(false) }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: dark ? '#cbd5e1' : '#374151', textAlign: 'left' }}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#00C4A7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    My Dashboard
                  </button>
                  <button
                    onClick={() => { navigate('/dashboard?tab=settings'); setShowUserMenu(false) }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: dark ? '#cbd5e1' : '#374151', textAlign: 'left' }}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                    Settings
                  </button>
                  <div style={{ borderTop: `1px solid ${dark ? '#1e293b' : '#f1f5f9'}` }} />
                  <button
                    onClick={handleLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#ef4444', textAlign: 'left' }}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Log out
                  </button>
                </div>
              )}
            </div>
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
          50,000+ links created and counting
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 3.25rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-0.03em', wordBreak: 'break-word' }}>
          Shorten links. Create QR codes.<br/><span style={{ color: '#00C4A7' }}>Track everything.</span>
        </h1>
        <p className="zk-hero p" style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: 520, margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Free tools for URL shortening and QR code generation, with real-time analytics. No subscription, no limits.
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
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00C4A7', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>What users say</div>
            <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 2rem)', fontWeight: 800, color: dark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em' }}>
              See what people are saying
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '1.25rem' }}>
            {[
              { name: 'Sarah M.', role: 'Marketing Manager', avatar: 'SM', text: "ZapKit is the only link tool I use now. The click analytics are way more detailed than I expected from something free - I can see exactly where traffic is coming from.", stars: 5 },
              { name: 'David K.', role: 'Freelance Designer', avatar: 'DK', text: "The QR generator is great. Custom logos, colors, SVG export - all free. I use it for client projects all the time.", stars: 5 },
              { name: 'Rachel T.', role: 'E-commerce Owner', avatar: 'RT', text: "Was paying $29/month for a link shortener with similar features. Made the switch to ZapKit and haven't looked back.", stars: 5 },
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
      <section style={{ padding: '3.5rem 1.5rem', background: dark ? '#1e293b' : '#ffffff', borderTop: `1px solid ${dark ? '#334155' : '#e2e8f0'}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00C4A7', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Simple by design</div>
            <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 800, color: dark ? '#f1f5f9' : '#0f172a', marginBottom: 8 }}>Everything you need, nothing you don't</h2>
            <p style={{ fontSize: '0.875rem', color: dark ? '#94a3b8' : '#64748b', maxWidth: 480, margin: '0 auto' }}>
              Use both tools without an account. Sign up only if you want to track analytics and manage your links over time.
            </p>
          </div>
          {/* Two-column: TinyLink + QR */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px,100%), 1fr))', gap: '1.5rem' }}>
            {/* TinyLink steps */}
            <div style={{ background: dark ? '#0f172a' : '#f8fafc', borderRadius: 16, padding: '1.75rem', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,196,167,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#00C4A7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: dark ? '#f1f5f9' : '#0f172a' }}>TinyLink Pro</span>
              </div>
              {[
                { n: '01', title: 'Paste any URL', desc: 'Drop a long link into the field. No account needed to get started.' },
                { n: '02', title: 'Get a branded short link', desc: 'Your link is ready in milliseconds, with a custom alias option.' },
                { n: '03', title: 'Track performance', desc: 'Register for a free account to unlock real-time click analytics, device breakdown, and country data.' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 14, marginBottom: '1rem' }}>
                  <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: 'rgba(0,196,167,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#00C4A7' }}>{s.n}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: dark ? '#f1f5f9' : '#0f172a', marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: '0.78rem', color: dark ? '#94a3b8' : '#64748b', lineHeight: 1.55 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* QR steps */}
            <div style={{ background: dark ? '#0f172a' : '#f8fafc', borderRadius: 16, padding: '1.75rem', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,196,167,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#00C4A7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01"/></svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: dark ? '#f1f5f9' : '#0f172a' }}>QR Generator Pro</span>
              </div>
              {[
                { n: '01', title: 'Choose a QR type', desc: 'Select from 12+ types: URL, contact card, Wi-Fi, WhatsApp, calendar events, and more.' },
                { n: '02', title: 'Design and customize', desc: 'Add your logo, choose colors, and pick a frame style. Export in PNG or SVG at any resolution.' },
                { n: '03', title: 'Track scan activity', desc: 'Register for free to monitor who scans your QR codes, from which devices and countries.' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 14, marginBottom: '1rem' }}>
                  <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: 'rgba(0,196,167,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#00C4A7' }}>{s.n}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: dark ? '#f1f5f9' : '#0f172a', marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: '0.78rem', color: dark ? '#94a3b8' : '#64748b', lineHeight: 1.55 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Registration CTA */}
          <div style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', borderRadius: 14, background: 'rgba(0,196,167,0.06)', border: '1px solid rgba(0,196,167,0.2)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: dark ? '#f1f5f9' : '#0f172a', marginBottom: 3 }}>Want a full analytics dashboard?</div>
              <div style={{ fontSize: '0.78rem', color: dark ? '#94a3b8' : '#64748b' }}>Create a free account to track every click, scan, device, and country in one place.</div>
            </div>
            <button
              onClick={() => { setAuthMode('register'); setShowAuthModal(true) }}
              style={{ flexShrink: 0, background: '#00C4A7', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Create Free Account
            </button>
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
