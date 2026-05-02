from datetime import datetime
from pydantic import BaseModel, HttpUrl, field_validator


class ShortenRequest(BaseModel):
    url: str
    custom_alias: str | None = None
    expires_at: datetime | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_content: str | None = None
    utm_term: str | None = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            v = "https://" + v
        return v


class ShortenResponse(BaseModel):
    short_code: str
    short_url: str
    original_url: str
    created_at: datetime
    expires_at: datetime | None = None


class LinkItem(BaseModel):
    short_code: str
    short_url: str
    original_url: str
    click_count: int
    created_at: datetime
    expires_at: datetime | None = None
    is_active: bool

    model_config = {"from_attributes": True}


class DailyClick(BaseModel):
    date: str
    count: int


class DeviceBreakdown(BaseModel):
    device_type: str
    count: int


class ReferrerItem(BaseModel):
    referrer: str
    count: int


class CountryItem(BaseModel):
    country: str
    count: int


class StatsResponse(BaseModel):
    total_clicks: int
    daily_clicks: list[DailyClick]
    devices: list[DeviceBreakdown]
    referrers: list[ReferrerItem]
    countries: list[CountryItem]


# ── Google OAuth ─────────────────────────────────────────────────────────────

class GoogleAuthRequest(BaseModel):
    access_token: str  # Google OAuth access token


# ── User Authentication Schemas ──────────────────────────────────────────────

class UserRegister(BaseModel):
    email: str
    password: str
    name: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        from security import validate_email, sanitize_input
        v = sanitize_input(v, max_length=254).lower()
        is_valid, error = validate_email(v)
        if not is_valid:
            raise ValueError(error)
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        from security import validate_password
        is_valid, error = validate_password(v)
        if not is_valid:
            raise ValueError(error)
        return v
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        from security import validate_username, sanitize_input
        v = sanitize_input(v, max_length=50)
        is_valid, error = validate_username(v)
        if not is_valid:
            raise ValueError(error)
        return v


class UserLogin(BaseModel):
    email: str
    password: str
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        from security import sanitize_input
        return sanitize_input(v, max_length=254).lower()


class PasswordResetRequest(BaseModel):
    email: str
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        from security import sanitize_input
        return sanitize_input(v, max_length=254).lower()


class PasswordResetVerify(BaseModel):
    email: str
    code: str
    new_password: str
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        from security import sanitize_input
        return sanitize_input(v, max_length=254).lower()
    
    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        from security import sanitize_input
        v = sanitize_input(v, max_length=10).strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Invalid verification code format")
        return v
    
    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        from security import validate_password
        is_valid, error = validate_password(v)
        if not is_valid:
            raise ValueError(error)
        return v


class PasswordResetResponse(BaseModel):
    message: str
    qr_code_data: str | None = None  # Base64 QR code image
    expires_in_minutes: int
    dev_code: str | None = None  # Only populated in mock/dev mode — shown in UI


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None
    created_at: datetime
    is_active: bool
    two_fa_enabled: bool = False

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── QR Code Schemas ──────────────────────────────────────────────────────────

class QRCodeCreate(BaseModel):
    qr_type: str
    content: str  # JSON string with QR data


class QRCodeResponse(BaseModel):
    id: str
    qr_code: str
    qr_type: str
    content: str
    created_at: datetime
    scan_count: int = 0

    model_config = {"from_attributes": True}


class QRScanStats(BaseModel):
    date: str
    count: int


class QRStatsResponse(BaseModel):
    total_scans: int
    daily_scans: list[QRScanStats]
    devices: list[DeviceBreakdown]
    countries: list[CountryItem]


# ── Dashboard Schemas ────────────────────────────────────────────────────────

class DashboardLinkItem(BaseModel):
    id: str
    short_code: str
    short_url: str
    original_url: str
    click_count: int
    created_at: datetime
    expires_at: datetime | None = None

    model_config = {"from_attributes": True}


class DashboardQRItem(BaseModel):
    id: str
    qr_code: str
    qr_type: str
    content: str
    scan_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    links: list[DashboardLinkItem]
    qr_codes: list[DashboardQRItem]
    total_links: int
    total_qr_codes: int
    total_clicks: int
    total_scans: int
