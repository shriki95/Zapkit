import { useState } from 'react'
import { X, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { register, login, loginWithGoogle, requestPasswordReset, verifyPasswordReset, type RegisterData, type LoginData } from '../lib/auth'

function GoogleButton({ mode, setLoading, setError, onSuccess, onClose }: {
  mode: string
  setLoading: (v: boolean) => void
  setError: (v: string) => void
  onSuccess: () => void
  onClose: () => void
}) {
  const googleLogin = useGoogleLogin({
    uxMode: 'popup',
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      setError('')
      try {
        await loginWithGoogle(tokenResponse.access_token)
        onSuccess()
        onClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Google sign-in failed')
      } finally {
        setLoading(false)
      }
    },
    onError: () => setError('Google sign-in failed. Please try again.'),
  })

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      {mode === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
    </button>
  )
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, onSuccess, mode: initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const data: RegisterData = { email, password }
        if (name.trim()) data.name = name.trim()
        await register(data)
        onSuccess()
        onClose()
      } else if (mode === 'login') {
        const data: LoginData = { email, password }
        await login(data)
        onSuccess()
        onClose()
      } else if (mode === 'forgot') {
        const result = await requestPasswordReset(email)
        setSuccess(result.message)
        if (result.dev_code) setDevCode(result.dev_code)
        setMode('reset')
      } else if (mode === 'reset') {
        const result = await verifyPasswordReset(email, resetCode, newPassword)
        setSuccess(result.message)
        setTimeout(() => {
          setMode('login')
          setSuccess('')
          setResetCode('')
          setNewPassword('')
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setSuccess('')
  }

  const goToForgotPassword = () => {
    setMode('forgot')
    setError('')
    setSuccess('')
  }

  const backToLogin = () => {
    setMode('login')
    setError('')
    setSuccess('')
    setResetCode('')
    setNewPassword('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="relative w-full max-w-md my-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {mode === 'login' && 'Sign In'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset' && 'Enter Verification Code'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' && 'Sign in to track your links and view analytics'}
            {mode === 'register' && 'Sign up to start tracking your links'}
            {mode === 'forgot' && 'Enter your email to receive a verification code'}
            {mode === 'reset' && 'Check your email for the 6-digit code'}
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400">
            <div className="flex items-center gap-2"><CheckCircle size={16} />{success}</div>
            {devCode && (
              <div className="mt-2 rounded-md bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 p-2 text-center">
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">⚠️ Dev Mode — your code:</div>
                <div className="text-2xl font-mono font-bold tracking-[0.3em] text-amber-800 dark:text-amber-300">{devCode}</div>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Google Sign In — only on login / register screens */}
        {(mode === 'login' || mode === 'register') && (
          <div className="mb-5">
            <GoogleButton mode={mode} setLoading={setLoading} setError={setError} onSuccess={onSuccess} onClose={onClose} />
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="name"
                  autoComplete="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C4A7] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="email"
                  autoComplete="username"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C4A7] focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C4A7] focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Min 8 chars · uppercase · lowercase · number · special char (!@#$%)
                </p>
              )}
              {mode === 'login' && (
                <div className="mt-1.5 text-left">
                  <button
                    type="button"
                    onClick={goToForgotPassword}
                    className="text-xs text-[#00C4A7] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'register' && (
            <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#00C4A7] focus:ring-[#00C4A7]"
              />
              <span>
                I agree to the <a href="#" className="text-[#00C4A7] hover:underline">Terms of Service</a> and <a href="#" className="text-[#00C4A7] hover:underline">Privacy Policy</a>. My data will be processed according to GDPR.
              </span>
            </label>
          )}

          {mode === 'reset' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Verification Code
                </label>
                <input
                  name="one-time-code"
                  autoComplete="one-time-code"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C4A7] focus:border-transparent text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="new-password"
                    autoComplete="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C4A7] focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  At least 6 characters
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#00C4A7] text-white font-semibold hover:bg-[#00B096] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && 'Please wait...'}
            {!loading && mode === 'login' && 'Sign In'}
            {!loading && mode === 'register' && 'Create Account'}
            {!loading && mode === 'forgot' && 'Send Verification Code'}
            {!loading && mode === 'reset' && 'Reset Password'}
          </button>
        </form>

        {/* Switch mode */}
        {(mode === 'login' || mode === 'register') && (
          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={switchMode}
              className="font-semibold text-[#00C4A7] hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        )}

        {/* Back to login */}
        {(mode === 'forgot' || mode === 'reset') && (
          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            <button
              onClick={backToLogin}
              className="font-semibold text-[#00C4A7] hover:underline"
            >
              ← Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
