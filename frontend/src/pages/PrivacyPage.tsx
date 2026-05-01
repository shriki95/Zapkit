import { Link } from 'react-router-dom'
import { useAuth } from '../App'

export default function PrivacyPage() {
  const { dark } = useAuth()
  const bg = dark ? '#0f172a' : '#f8fafc'
  const text = dark ? '#f1f5f9' : '#0f172a'
  const sub = dark ? '#94a3b8' : '#64748b'
  const card = dark ? '#1e293b' : '#ffffff'
  const border = dark ? '#334155' : '#e2e8f0'

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "system-ui,'Segoe UI',Roboto,sans-serif" }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: dark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}`, padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#00C4A7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: text, letterSpacing: '-0.02em' }}>Zap<span style={{ color: '#00C4A7' }}>Kit</span></span>
        </Link>
        <Link to="/" style={{ fontSize: '0.875rem', color: '#00C4A7', textDecoration: 'none', fontWeight: 600 }}>← Back to Home</Link>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Privacy Policy</h1>
        <p style={{ color: sub, marginBottom: '2.5rem', fontSize: '0.9rem' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        {[
          {
            title: '1. Information We Collect',
            content: `We collect information you provide directly when creating an account (name, email address, password) and information generated through your use of our services (shortened URLs, QR codes, click analytics including approximate location by country, device type, and referrer).

We do NOT collect: precise GPS location, payment information, or sensitive personal data.`
          },
          {
            title: '2. How We Use Your Information',
            content: `• To provide and improve ZapKit services
• To display click and scan analytics on your dashboard
• To send transactional emails (password reset, welcome)
• To prevent abuse and maintain security
• We do NOT sell your personal data to third parties`
          },
          {
            title: '3. Cookies & Local Storage',
            content: `We use cookies and localStorage to:
• Keep you logged in across sessions (authentication token)
• Remember your theme preference (dark/light mode)
• Track session activity for auto-logout

You can clear these at any time via your browser settings.`
          },
          {
            title: '4. Analytics Data',
            content: `When someone clicks your shortened link or scans your QR code, we record:
• Timestamp of the click/scan
• Country (derived from IP — IP is immediately hashed and not stored in plain text)
• Device type (mobile/desktop/tablet)
• Referrer domain (e.g. "twitter.com")

This data is visible only to you (the link owner) and is used solely to power your analytics dashboard.`
          },
          {
            title: '5. Data Retention',
            content: `Your account data is retained as long as your account is active. Analytics data is retained for up to 12 months. You may request deletion of your account and all associated data by contacting us at privacy@zapkit.app.`
          },
          {
            title: '6. GDPR Rights (EU Users)',
            content: `If you are located in the European Union, you have the right to:
• Access your personal data
• Correct inaccurate data
• Request deletion ("right to be forgotten")
• Object to processing
• Data portability

To exercise these rights, contact: privacy@zapkit.app`
          },
          {
            title: '7. Security',
            content: `We protect your data using industry-standard security measures including encrypted passwords (bcrypt), HTTPS-only connections, JWT authentication tokens, and automatic session expiration after inactivity.`
          },
          {
            title: '8. Contact',
            content: `Questions about this policy? Email us at privacy@zapkit.app or use the Contact page.`
          },
        ].map(section => (
          <div key={section.title} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: '1.5rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: text }}>{section.title}</h2>
            <p style={{ fontSize: '0.875rem', color: sub, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem', fontSize: '0.75rem', color: sub, borderTop: `1px solid ${border}` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <Link to="/terms" style={{ color: '#00C4A7', textDecoration: 'none' }}>Terms of Use</Link>
          <Link to="/contact" style={{ color: '#00C4A7', textDecoration: 'none' }}>Contact</Link>
          <Link to="/" style={{ color: '#00C4A7', textDecoration: 'none' }}>Home</Link>
        </div>
        © {new Date().getFullYear()} ZapKit. All rights reserved.
      </footer>
    </div>
  )
}
