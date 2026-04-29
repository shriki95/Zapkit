export type QrStep = 'content' | 'design' | 'download'

export type QrType =
  | 'link'
  | 'text'
  | 'email'
  | 'call'
  | 'sms'
  | 'whatsapp'
  | 'wifi'
  | 'vcard'
  | 'event'
  | 'media'
  | 'app'
  | 'social'

export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter' | 'facebook' | 'snapchat'

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass'

export type AppStore = 'appstore' | 'playstore' | 'both'

export type QrContentState = {
  linkUrl: string
  text: string

  emailTo: string
  emailSubject: string
  emailBody: string

  phoneNumber: string
  smsMessage: string

  whatsappNumber: string
  whatsappMessage: string

  wifiSsid: string
  wifiPassword: string
  wifiEncryption: WifiEncryption
  wifiHidden: boolean

  vcardFirstName: string
  vcardLastName: string
  vcardEmail: string
  vcardPhone: string
  vcardCompany: string
  vcardTitle: string
  vcardWebsite: string

  eventTitle: string
  eventLocation: string
  eventStart: string
  eventEnd: string
  eventDescription: string

  // media: PDF / image / video URL
  mediaUrl: string

  // app store links
  appStoreUrl: string
  playStoreUrl: string

  socialPlatform: SocialPlatform
  socialHandle: string
}

export type DotStyle = 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded'

export type CornerSquareStyle = 'square' | 'dot' | 'extra-rounded'
export type CornerDotStyle = 'square' | 'dot'

export type DesignOptions = {
  previewSize: number
  exportSize: number
  margin: number

  foreground: string
  background: string
  transparentBackground: boolean

  dotsStyle: DotStyle
  cornersSquareStyle: CornerSquareStyle
  cornersDotStyle: CornerDotStyle

  logoDataUrl: string | null
  logoScale: number

  frameStyle: 'none' | 'above' | 'below' | 'both'
  frameText: string
  frameColor: string
  frameBorder: boolean
}

export type QrDesignPreset = {
  id: string
  name: string
  description: string
  options: Pick<
    DesignOptions,
    | 'foreground'
    | 'background'
    | 'transparentBackground'
    | 'dotsStyle'
    | 'cornersSquareStyle'
    | 'cornersDotStyle'
    | 'margin'
    | 'logoScale'
  >
}
