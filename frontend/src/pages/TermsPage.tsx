import { Link } from 'react-router-dom'
import { useAuth } from '../App'

export default function TermsPage() {
  const { dark } = useAuth()
  const bg = dark ? '#0f172a' : '#f8fafc'
  const text = dark ? '#f1f5f9' : '#0f172a'
  const sub = dark ? '#94a3b8' : '#64748b'
  const card = dark ? '#1e293b' : '#ffffff'
  const border = dark ? '#334155' : '#e2e8f0'

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "system-ui,'Segoe UI',Roboto,sans-serif" }}>
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
        <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Terms of Use</h1>
        <p style={{ color: sub, marginBottom: '2.5rem', fontSize: '0.9rem' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        {[
          {
            title: '1. Acceptance of Terms',
            content: `By accessing or using ZapKit ("the Service"), you agree to be bound by these Terms of Use. If you disagree with any part of these terms, you may not access the Service.`
          },
          {
            title: '2. Use of the Service',
            content: `ZapKit provides free URL shortening and QR code generation tools. You may use the Service for lawful purposes only.

You agree NOT to use ZapKit to:
• Shorten URLs that contain malware, phishing, or illegal content
• Spam or mass-distribute harmful links
• Violate intellectual property rights
• Circumvent security measures
• Generate QR codes for deceptive purposes`
          },
          {
            title: '3. User Accounts',
            content: `Creating an account is optional. If you register, you are responsible for:
• Maintaining the confidentiality of your password
• All activity that occurs under your account
• Notifying us immediately of any unauthorized use

We reserve the right to terminate accounts that violate these terms.`
          },
          {
            title: '4. Content Policy',
            content: `You retain ownership of the URLs and content you shorten or encode. You grant ZapKit a limited license to process this content solely to provide the Service.

We may remove links or QR codes that violate our policies without notice.`
          },
          {
            title: '5. Service Availability',
            content: `ZapKit is provided "as is" without warranty of any kind. We do not guarantee 100% uptime or that the Service will be error-free. We may modify or discontinue the Service at any time.`
          },
          {
            title: '6. Analytics Data',
            content: `Click and scan analytics are collected to provide you with insights about your links. This data is aggregated and anonymized (IP addresses are hashed). See our Privacy Policy for details.`
          },
          {
            title: '7. Limitation of Liability',
            content: `To the maximum extent permitted by law, ZapKit shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.`
          },
          {
            title: '8. Changes to Terms',
            content: `We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the new terms. We will indicate the date of the last update at the top of this page.`
          },
          {
            title: '9. Contact',
            content: `Questions about these terms? Contact us at legal@zapkit.app`
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
          <Link to="/privacy" style={{ color: '#00C4A7', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/contact" style={{ color: '#00C4A7', textDecoration: 'none' }}>Contact</Link>
          <Link to="/" style={{ color: '#00C4A7', textDecoration: 'none' }}>Home</Link>
        </div>
        © {new Date().getFullYear()} ZapKit. All rights reserved.
      </footer>
    </div>
  )
}
