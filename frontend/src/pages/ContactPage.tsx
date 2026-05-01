import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MessageSquare, HelpCircle, Bug, Lightbulb, CheckCircle } from 'lucide-react'
import { useAuth } from '../App'

export default function ContactPage() {
  const { dark } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('general')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const bg = dark ? '#0f172a' : '#f8fafc'
  const text = dark ? '#f1f5f9' : '#0f172a'
  const sub = dark ? '#94a3b8' : '#64748b'
  const card = dark ? '#1e293b' : '#ffffff'
  const border = dark ? '#334155' : '#e2e8f0'
  const inputCls = `w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C4A7]`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would POST to a contact endpoint
    // For now, open mailto as fallback
    const mailto = `mailto:hello@zapkit.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\n\n${message}`)}`
    window.open(mailto)
    setSent(true)
  }

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

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Contact Us</h1>
        <p style={{ color: sub, marginBottom: '2.5rem', fontSize: '0.95rem' }}>We'd love to hear from you. Pick a topic below and send us a message.</p>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
          {[
            { icon: HelpCircle, label: 'General Help', desc: 'Questions about how ZapKit works', color: '#00C4A7' },
            { icon: Bug, label: 'Report a Bug', desc: 'Something not working right?', color: '#ef4444' },
            { icon: Lightbulb, label: 'Feature Request', desc: 'Ideas to make ZapKit better', color: '#f59e0b' },
            { icon: Mail, label: 'Business Inquiry', desc: 'Partnerships or enterprise use', color: '#6366f1' },
          ].map(({ icon: Icon, label, desc, color }) => (
            <button
              key={label}
              onClick={() => setSubject(label)}
              style={{
                background: subject === label ? `${color}15` : card,
                border: `1.5px solid ${subject === label ? color : border}`,
                borderRadius: 12, padding: '0.875rem', textAlign: 'left', cursor: 'pointer',
                color: text, transition: 'all 0.15s',
              }}
            >
              <Icon size={18} color={color} style={{ marginBottom: 6 }} />
              <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: '0.72rem', color: sub, lineHeight: 1.4 }}>{desc}</div>
            </button>
          ))}
        </div>

        {sent ? (
          <div style={{ background: 'rgba(0,196,167,0.1)', border: '1px solid rgba(0,196,167,0.3)', borderRadius: 14, padding: '2rem', textAlign: 'center' }}>
            <CheckCircle size={48} color="#00C4A7" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: text, marginBottom: 8 }}>Message sent!</h2>
            <p style={{ color: sub, fontSize: '0.875rem' }}>Thank you for reaching out. We typically respond within 1-2 business days.</p>
            <Link to="/" style={{ display: 'inline-block', marginTop: '1.5rem', color: '#00C4A7', fontWeight: 600, textDecoration: 'none' }}>← Back to ZapKit</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: text, marginBottom: 6 }}>Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className={inputCls}
                  style={{ borderColor: border, background: dark ? '#0f172a' : '#fff', color: text }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: text, marginBottom: 6 }}>Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className={inputCls}
                  style={{ borderColor: border, background: dark ? '#0f172a' : '#fff', color: text }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: text, marginBottom: 6 }}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: `1px solid ${border}`, background: dark ? '#0f172a' : '#fff', color: text, fontSize: '0.875rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: text, marginBottom: 6 }}>
                Message <span style={{ color: sub, fontWeight: 400 }}>— please be as detailed as possible</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="Describe your question, issue or idea in detail..."
                style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: `1px solid ${border}`, background: dark ? '#0f172a' : '#fff', color: text, fontSize: '0.875rem', outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="submit"
                style={{ background: '#00C4A7', color: '#fff', fontWeight: 700, fontSize: '0.9rem', padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
              >
                Send Message
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: sub }}>
                <MessageSquare size={14} />
                Usual reply time: 1-2 business days
              </div>
            </div>
          </form>
        )}

        {/* Direct email fallback */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: sub }}>
          Prefer email directly? Write to <a href="mailto:hello@zapkit.app" style={{ color: '#00C4A7' }}>hello@zapkit.app</a>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem', fontSize: '0.75rem', color: sub, borderTop: `1px solid ${border}` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <Link to="/privacy" style={{ color: '#00C4A7', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: '#00C4A7', textDecoration: 'none' }}>Terms of Use</Link>
          <Link to="/" style={{ color: '#00C4A7', textDecoration: 'none' }}>Home</Link>
        </div>
        © {new Date().getFullYear()} ZapKit. All rights reserved.
      </footer>
    </div>
  )
}
