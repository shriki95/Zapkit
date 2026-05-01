const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'zapkit_auth_token'
const USER_KEY = 'zapkit_user'
const LAST_ACTIVITY_KEY = 'zapkit_last_activity'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const IDLE_TIMEOUT_MS = Number(import.meta.env.VITE_IDLE_TIMEOUT_MS ?? 30 * 60 * 1000)

export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
  is_active: boolean
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface RegisterData {
  email: string
  password: string
  name?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface LinkStats {
  total_clicks: number
  daily_clicks: Array<{ date: string; count: number }>
  devices: Array<{ device_type: string; count: number }>
  referrers: Array<{ referrer: string; count: number }>
  countries: Array<{ country: string; count: number }>
}

export interface QRStats {
  total_scans: number
  daily_scans: Array<{ date: string; count: number }>
  devices: Array<{ device_type: string; count: number }>
  countries: Array<{ country: string; count: number }>
}

function setCookie(name: string, value: string, maxAge = SESSION_MAX_AGE_SECONDS) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax; max-age=${maxAge}`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; SameSite=Lax; max-age=0`
}

function syncAuthFromCookies() {
  const token = getCookie(TOKEN_KEY)
  const user = getCookie(USER_KEY)
  if (token && localStorage.getItem(TOKEN_KEY) !== token) localStorage.setItem(TOKEN_KEY, token)
  if (user && localStorage.getItem(USER_KEY) !== user) localStorage.setItem(USER_KEY, user)
}

function getLastActivity(): number {
  return Number(getCookie(LAST_ACTIVITY_KEY) ?? localStorage.getItem(LAST_ACTIVITY_KEY) ?? Date.now())
}

export function touchActivity() {
  const now = String(Date.now())
  localStorage.setItem(LAST_ACTIVITY_KEY, now)
  setCookie(LAST_ACTIVITY_KEY, now)
}

export function hasIdleSessionExpired(): boolean {
  return !!getToken(false) && Date.now() - getLastActivity() > IDLE_TIMEOUT_MS
}

export function getToken(sync = true): string | null {
  if (sync) syncAuthFromCookies()
  return localStorage.getItem(TOKEN_KEY) ?? getCookie(TOKEN_KEY)
}

export function getUser(): User | null {
  syncAuthFromCookies()
  const userStr = localStorage.getItem(USER_KEY) ?? getCookie(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function saveAuth(token: string, user: User) {
  const serializedUser = JSON.stringify(user)
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, serializedUser)
  setCookie(TOKEN_KEY, token)
  setCookie(USER_KEY, serializedUser)
  touchActivity()
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LAST_ACTIVITY_KEY)
  deleteCookie(TOKEN_KEY)
  deleteCookie(USER_KEY)
  deleteCookie(LAST_ACTIVITY_KEY)
}

export function isAuthenticated(): boolean {
  if (hasIdleSessionExpired()) {
    clearAuth()
    return false
  }
  return !!getToken()
}

export function initAutoLogout(onLogout?: () => void) {
  const activityEvents: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
  const markActive = () => {
    if (getToken(false)) touchActivity()
  }

  activityEvents.forEach(eventName => window.addEventListener(eventName, markActive, { passive: true }))

  const intervalId = window.setInterval(() => {
    syncAuthFromCookies()
    if (hasIdleSessionExpired()) {
      clearAuth()
      onLogout?.()
    }
  }, 30 * 1000)

  return () => {
    activityEvents.forEach(eventName => window.removeEventListener(eventName, markActive))
    window.clearInterval(intervalId)
  }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (res.status === 401) clearAuth()
  return res
}

async function parseApiError(res: Response, fallback: string) {
  try {
    const error = await res.json()
    if (Array.isArray(error.detail)) {
      return error.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
    }
    return error.detail || fallback
  } catch {
    return fallback
  }
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await parseApiError(res, 'Registration failed'))
  const authData: AuthResponse = await res.json()
  saveAuth(authData.access_token, authData.user)
  return authData
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await parseApiError(res, 'Login failed'))
  const authData: AuthResponse = await res.json()
  saveAuth(authData.access_token, authData.user)
  return authData
}

export function logout() {
  clearAuth()
  window.location.reload()
}

export async function trackLink(shortCode: string): Promise<void> {
  const res = await apiFetch(`/api/links/${shortCode}/track`, { method: 'POST' })
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to track link'))
}

export async function trackQR(qrCode: string): Promise<void> {
  const res = await apiFetch(`/api/qr/${qrCode}/track`, { method: 'POST' })
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to track QR'))
}

export async function getDashboard() {
  const res = await apiFetch('/api/dashboard')
  if (!res.ok) throw new Error(await parseApiError(res, res.status === 401 ? 'Session expired' : 'Failed to get dashboard'))
  touchActivity()
  return res.json()
}

export async function getLinkStats(shortCode: string): Promise<LinkStats> {
  const res = await apiFetch(`/api/dashboard/links/${shortCode}/analytics`)
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to get link analytics'))
  touchActivity()
  return res.json()
}

export async function getQRStats(qrCode: string): Promise<QRStats> {
  const res = await apiFetch(`/api/dashboard/qr/${qrCode}/analytics`)
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to get QR analytics'))
  touchActivity()
  return res.json()
}

export async function deleteLink(shortCode: string): Promise<void> {
  const res = await apiFetch(`/api/dashboard/links/${shortCode}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to delete link'))
}

export async function deleteQR(qrCode: string): Promise<void> {
  const res = await apiFetch(`/api/dashboard/qr/${qrCode}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to delete QR code'))
}

export async function requestPasswordReset(email: string): Promise<{ message: string; dev_code?: string }> {
  const res = await apiFetch('/api/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to request password reset'))
  return res.json()
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const res = await apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to change password'))
  return res.json()
}

export async function verifyPasswordReset(email: string, code: string, newPassword: string): Promise<{ message: string }> {
  const res = await apiFetch('/api/auth/password-reset/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code, new_password: newPassword }),
  })
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to verify code'))
  return res.json()
}

export async function enable2FA(): Promise<{ qr_code: string; secret: string }> {
  const res = await apiFetch('/api/auth/2fa/enable', { method: 'POST' })
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to enable 2FA'))
  return res.json()
}

export async function verify2FA(code: string): Promise<{ message: string }> {
  const res = await apiFetch('/api/auth/2fa/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to verify 2FA code'))
  return res.json()
}

export async function disable2FA(code: string): Promise<{ message: string }> {
  const res = await apiFetch('/api/auth/2fa/disable', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new Error(await parseApiError(res, 'Failed to disable 2FA'))
  return res.json()
}
