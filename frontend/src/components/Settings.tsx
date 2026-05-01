import { useEffect, useState } from 'react'
import { User, Shield, Palette, CheckCircle, AlertCircle, Copy, Check, Lock, Eye, EyeOff, Link2, QrCode, TrendingUp, BarChart3, Trash2, Bell, Save } from 'lucide-react'
import { enable2FA, verify2FA, getUser, changePassword, getDashboard, type User as UserType } from '../lib/auth'
import { useAuth } from '../App'
import { applyAccentOverride } from '../lib/theme'

export default function Settings() {
  const { dark, setDark } = useAuth()
  const [user, setUser] = useState<UserType | null>(getUser())
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile')
  // Real stats from API
  const [stats, setStats] = useState<{ links: number; qr: number; clicks: number; scans: number } | null>(null)

  useEffect(() => {
    getDashboard().then(d => setStats({
      links: d.total_links ?? 0,
      qr: d.total_qr_codes ?? 0,
      clicks: d.total_clicks ?? 0,
      scans: d.total_scans ?? 0,
    })).catch(() => {})
  }, [])

  // 2FA state
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [secretCopied, setSecretCopied] = useState(false)

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  // Profile state
  const [displayName, setDisplayName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')

  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [analyticsEmails, setAnalyticsEmails] = useState(false)
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('zapkit-theme-mode') as 'light' | 'dark' | 'system') ?? (dark ? 'dark' : 'light')
  })
  const [accentKit, setAccentKit] = useState<string>(() => localStorage.getItem('zapkit-accent') ?? 'teal')
  const [pendingAccent, setPendingAccent] = useState<string>(() => localStorage.getItem('zapkit-accent') ?? 'teal')
  const [themeSaved, setThemeSaved] = useState(false)

  const ACCENT_KITS = [
    { id: 'teal',   name: 'ZapKit Teal',   color: '#00C4A7', desc: 'Original brand - always fresh' },
    { id: 'indigo', name: 'Midnight Indigo', color: '#6366f1', desc: 'Deep focus, professional tone' },
    { id: 'rose',   name: 'Rose Quartz',   color: '#f43f5e', desc: 'Bold and expressive' },
    { id: 'amber',  name: 'Amber Gold',    color: '#f59e0b', desc: 'Warm and premium' },
    { id: 'sky',    name: 'Sky Blue',      color: '#0ea5e9', desc: 'Clean and trustworthy' },
  ]

  const applyThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode)
    localStorage.setItem('zapkit-theme-mode', mode)
    if (mode === 'light') setDark(false)
    else if (mode === 'dark') setDark(true)
    else setDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
  }

  const saveAccent = () => {
    setAccentKit(pendingAccent)
    localStorage.setItem('zapkit-accent', pendingAccent)
    applyAccentOverride(pendingAccent)
    setThemeSaved(true)
    setTimeout(() => setThemeSaved(false), 2000)
  }

  const handle2FAEnable = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await enable2FA()
      setQrCode(result.qr_code)
      setSecret(result.secret)
      setShow2FASetup(true)
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handle2FAVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await verify2FA(verificationCode)
      setSuccess(result.message)
      setShow2FASetup(false)
      setQrCode(null)
      setSecret(null)
      setVerificationCode('')
      // Mark 2FA as enabled in local state
      if (user) {
        const updated = { ...user, two_fa_enabled: true } as any
        setUser(updated)
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const copySecret = async () => {
    if (secret) {
      await navigator.clipboard.writeText(secret)
      setSecretCopied(true)
      setTimeout(() => setSecretCopied(false), 2000)
    }
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'preferences' as const, label: 'Preferences', icon: Palette },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-[#00C4A7]/10 to-blue-500/10 rounded-2xl p-6 border border-[#00C4A7]/20">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C4A7] to-[#00B096] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user?.name?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Welcome back, {user?.name || user?.email.split('@')[0]}! 👋
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle size={16} />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[#00C4A7] text-[#00C4A7]'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Personal Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C4A7]"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Email cannot be changed
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button className="px-4 py-2 rounded-lg bg-[#00C4A7] text-white font-semibold hover:bg-[#00B096] transition-colors">
                  Save Changes
                </button>
                <button className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Account Stats — real data */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Account Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Link2, label: 'Shortened Links', value: stats?.links },
                { icon: QrCode, label: 'QR Codes Created', value: stats?.qr },
                { icon: TrendingUp, label: 'Total Link Clicks', value: stats?.clicks },
                { icon: BarChart3, label: 'Total QR Scans', value: stats?.scans },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className="text-[#00C4A7]" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats === null ? <span className="text-slate-300 dark:text-slate-600 text-base">Loading…</span> : (value ?? 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* 2FA Section */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Two-Factor Authentication</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Add an extra layer of security to your account
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                Recommended
              </div>
            </div>

            {!show2FASetup ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Shield size={24} className="text-[#00C4A7] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Two-Factor Authentication: <span className="text-slate-500 dark:text-slate-400">Not active</span>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Protect your account with a one-time code from your phone.
                      Even if someone steals your password, they can't log in without your device.
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 p-3 text-xs text-blue-700 dark:text-blue-300">
                  <strong>How it works:</strong> After enabling, you'll scan a QR code with Google Authenticator or Authy. Every time you log in, you'll enter a 6-digit code from the app in addition to your password.
                </div>

                <button
                  onClick={handle2FAEnable}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg bg-[#00C4A7] text-white font-semibold hover:bg-[#00B096] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Enable 2FA'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-semibold mb-1">Setup Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Install Google Authenticator on your phone</li>
                        <li>Scan the QR code below or enter the secret key manually</li>
                        <li>Enter the 6-digit code from the app to verify</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {qrCode && (
                  <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-lg" />
                    
                    {secret && (
                      <div className="w-full">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 text-center">
                          Can't scan? Enter this code manually:
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-sm font-mono text-center">
                            {secret}
                          </code>
                          <button
                            onClick={copySecret}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Copy secret"
                          >
                            {secretCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-slate-400" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#00C4A7]"
                    placeholder="000000"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handle2FAVerify}
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1 px-4 py-3 rounded-lg bg-[#00C4A7] text-white font-semibold hover:bg-[#00B096] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                  <button
                    onClick={() => {
                      setShow2FASetup(false)
                      setQrCode(null)
                      setSecret(null)
                      setVerificationCode('')
                    }}
                    className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={18} className="text-[#00C4A7]" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Change Password</h3>
            </div>

            {pwSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400">
                <CheckCircle size={16} /> {pwSuccess}
              </div>
            )}
            {pwError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                <AlertCircle size={16} /> {pwError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setPwError('')
                setPwSuccess('')
                if (newPassword !== confirmPassword) { setPwError('New passwords do not match'); return }
                if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return }
                setPwLoading(true)
                try {
                  const res = await changePassword(currentPassword, newPassword)
                  setPwSuccess(res.message)
                  setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
                } catch (err: any) {
                  setPwError(err.message || 'Failed to change password')
                } finally {
                  setPwLoading(false)
                }
              }}
              className="space-y-4"
            >
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C4A7]"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C4A7]"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Min 8 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C4A7]"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="px-6 py-2.5 rounded-lg bg-[#00C4A7] text-white font-semibold hover:bg-[#00B096] transition-colors disabled:opacity-50"
              >
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="card p-6 border-red-200 dark:border-red-800">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
              <Trash2 size={20} />
              Danger Zone
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Once you delete your account, there is no going back. All your links, QR codes, and analytics will be permanently deleted.
            </p>
            <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Notifications */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell size={20} />
              Notifications
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Email Notifications</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Receive updates about your account</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-[#00C4A7] focus:ring-[#00C4A7]"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Weekly Analytics Report</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Get weekly summaries of your link performance</div>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsEmails}
                  onChange={(e) => setAnalyticsEmails(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-[#00C4A7] focus:ring-[#00C4A7]"
                />
              </label>
            </div>
          </div>

          {/* Appearance */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Palette size={20} />
              Appearance
            </h3>
            <div className="space-y-3">
              {([
                { value: 'light', label: 'Light', desc: 'Light mode', bg: 'bg-white border-2 border-slate-300' },
                { value: 'dark',  label: 'Dark',  desc: 'Dark mode',  bg: 'bg-slate-900 border-2 border-slate-700' },
                { value: 'system',label: 'System',desc: 'Match system preference', bg: 'bg-gradient-to-br from-white to-slate-900 border-2 border-slate-400' },
              ] as const).map(option => (
                <label
                  key={option.value}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${option.bg}`} />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{option.label}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{option.desc}</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="theme"
                    checked={themeMode === option.value}
                    onChange={() => applyThemeMode(option.value)}
                    className="w-5 h-5 text-[#00C4A7] focus:ring-[#00C4A7]"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Color Theme Kits */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-1 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette size={20} />
                  Color Theme
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Choose an accent color kit and press Save to apply.
                </p>
              </div>
              <button
                onClick={saveAccent}
                disabled={pendingAccent === accentKit}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  themeSaved
                    ? 'bg-green-500 text-white'
                    : pendingAccent === accentKit
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-[#00C4A7] text-white hover:bg-[#00B096]'
                }`}
              >
                {themeSaved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Theme</>}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {ACCENT_KITS.map(kit => (
                <button
                  key={kit.id}
                  onClick={() => setPendingAccent(kit.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                    pendingAccent === kit.id
                      ? 'shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  style={pendingAccent === kit.id ? { borderColor: kit.color } : {}}
                >
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 shadow-sm" style={{ background: kit.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      {kit.name}
                      {accentKit === kit.id && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: kit.color }}>Active</span>
                      )}
                      {pendingAccent === kit.id && pendingAccent !== accentKit && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Selected</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{kit.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
