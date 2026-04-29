export interface ShortenRequest {
  url: string
  custom_alias?: string
  expires_at?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

export interface ShortenResponse {
  short_code: string
  short_url: string
  original_url: string
  created_at: string
  expires_at?: string
}

export interface LinkItem {
  short_code: string
  short_url: string
  original_url: string
  click_count: number
  created_at: string
  expires_at?: string
  is_active: boolean
}

export interface DailyClick {
  date: string
  count: number
}

export interface DeviceBreakdown {
  device_type: string
  count: number
}

export interface ReferrerItem {
  referrer: string
  count: number
}

export interface CountryItem {
  country: string
  count: number
}

export interface StatsResponse {
  total_clicks: number
  daily_clicks: DailyClick[]
  devices: DeviceBreakdown[]
  referrers: ReferrerItem[]
  countries: CountryItem[]
}
