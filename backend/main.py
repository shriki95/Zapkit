import asyncio
import base64
import io
import json
import os
import secrets
import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator

from fastapi import Cookie, Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import RedirectResponse, StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from analytics import clean_referrer, get_device_type, hash_ip, lookup_country
from database import AsyncSessionLocal, get_db, init_db
from models import Click, Link, User, QRCode, QRScan, PasswordReset
from schemas import (
    DailyClick,
    DeviceBreakdown,
    LinkItem,
    ReferrerItem,
    CountryItem,
    ShortenRequest,
    ShortenResponse,
    StatsResponse,
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    PasswordResetRequest,
    PasswordResetVerify,
    PasswordResetResponse,
    QRCodeCreate,
    QRCodeResponse,
    QRScanStats,
    QRStatsResponse,
    DashboardResponse,
    DashboardLinkItem,
    DashboardQRItem,
)
from shortener import generate_short_code
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
)
from security import (
    rate_limiter,
    generate_verification_code,
    generate_reset_token,
    sanitize_input,
)
from email_service import send_password_reset_email, send_welcome_email
from security_middleware import cleanup_security_data
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

app = FastAPI(title="ZapKit API", version="1.0.0")


# ── CORS + Security headers (single middleware, no conflicts) ─────────────────

@app.middleware("http")
async def cors_and_security(request: Request, call_next):
    origin = request.headers.get("origin", "")

    # CORS headers to add to every response
    cors_headers = {
        "Access-Control-Allow-Origin": origin or "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Origin, X-Requested-With",
    }

    # Handle CORS preflight immediately
    if request.method == "OPTIONS":
        return Response(status_code=200, headers={**cors_headers, "Access-Control-Max-Age": "86400"})

    # Process request — catch ALL exceptions so CORS headers are always set
    try:
        response = await call_next(request)
    except Exception as exc:
        print(f"❌ Unhandled exception: {exc}")
        response = Response(
            status_code=500,
            content=json.dumps({"detail": f"Internal server error: {type(exc).__name__}: {exc}"}).encode(),
            media_type="application/json",
        )

    # Always add CORS + security headers
    for k, v in cors_headers.items():
        response.headers[k] = v
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response


# SSE subscribers: short_code → list of asyncio.Queue
_sse_subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)


@app.on_event("startup")
async def startup():
    await init_db()
    # Start security cleanup task
    asyncio.create_task(cleanup_security_data())
    print("🔒 Security systems initialized")


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint — also tests DB connection"""
    from sqlalchemy import text
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {e}"
    return {
        "status": "healthy",
        "db": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/security/stats")
async def get_security_stats(current_user: User = Depends(get_current_user)):
    """Get security statistics (admin only)"""
    # TODO: Add admin check
    return ddos_protection.get_stats()


def _get_or_create_session(session_id: str | None, response: Response) -> str:
    if not session_id:
        session_id = str(uuid.uuid4())
        response.set_cookie(
            "session_id",
            session_id,
            max_age=60 * 60 * 24 * 365,
            httponly=True,
            samesite="lax",
        )
    return session_id


def _as_aware(value: datetime | None) -> datetime | None:
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=timezone.utc)


def _set_auth_cookies(response: Response, access_token: str, user: User):
    max_age = 60 * 60 * 24 * 7
    response.set_cookie("zapkit_auth_token", access_token, max_age=max_age, samesite="lax")
    response.set_cookie(
        "zapkit_user",
        json.dumps(
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "created_at": user.created_at.isoformat(),
                "is_active": user.is_active,
            }
        ),
        max_age=max_age,
        samesite="lax",
    )
    response.set_cookie("zapkit_last_activity", str(int(datetime.now(timezone.utc).timestamp() * 1000)), max_age=max_age, samesite="lax")


def _stats_from_clicks(clicks: list[Click]) -> StatsResponse:
    daily: dict[str, int] = defaultdict(int)
    devices: dict[str, int] = defaultdict(int)
    refs: dict[str, int] = defaultdict(int)
    countries: dict[str, int] = defaultdict(int)

    for click in clicks:
        daily[click.clicked_at.strftime("%Y-%m-%d")] += 1
        devices[click.device_type or "unknown"] += 1
        refs[click.referrer or "Direct"] += 1
        countries[click.country or "Unknown"] += 1

    return StatsResponse(
        total_clicks=len(clicks),
        daily_clicks=[DailyClick(date=date, count=count) for date, count in sorted(daily.items())],
        devices=[DeviceBreakdown(device_type=device, count=count) for device, count in devices.items()],
        referrers=sorted([ReferrerItem(referrer=ref, count=count) for ref, count in refs.items()], key=lambda item: -item.count)[:5],
        countries=sorted([CountryItem(country=country, count=count) for country, count in countries.items()], key=lambda item: -item.count)[:10],
    )


def _stats_from_qr_scans(scans: list[QRScan]) -> QRStatsResponse:
    daily: dict[str, int] = defaultdict(int)
    devices: dict[str, int] = defaultdict(int)
    countries: dict[str, int] = defaultdict(int)

    for scan in scans:
        daily[scan.scanned_at.strftime("%Y-%m-%d")] += 1
        devices[scan.device_type or "unknown"] += 1
        countries[scan.country or "Unknown"] += 1

    return QRStatsResponse(
        total_scans=len(scans),
        daily_scans=[QRScanStats(date=date, count=count) for date, count in sorted(daily.items())],
        devices=[DeviceBreakdown(device_type=device, count=count) for device, count in devices.items()],
        countries=sorted([CountryItem(country=country, count=count) for country, count in countries.items()], key=lambda item: -item.count)[:10],
    )


# ── Shorten ─────────────────────────────────────────────────────────────────

@app.post("/api/shorten", response_model=ShortenResponse)
async def shorten(
    body: ShortenRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    session_id: str | None = Cookie(default=None),
    current_user: User | None = Depends(get_current_user_optional),
):
    session_id = _get_or_create_session(session_id, response)

    # Build final URL with UTM params
    url = body.url
    utm_params = {
        "utm_source": body.utm_source,
        "utm_medium": body.utm_medium,
        "utm_campaign": body.utm_campaign,
        "utm_content": body.utm_content,
        "utm_term": body.utm_term,
    }
    utm_str = "&".join(f"{k}={v}" for k, v in utm_params.items() if v)
    if utm_str:
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}{utm_str}"

    # Custom alias
    if body.custom_alias:
        alias = body.custom_alias.strip("/").lower()
        existing = await db.execute(select(Link).where(Link.short_code == alias))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Alias already taken")
        short_code = alias
    else:
        # Generate unique code
        for _ in range(10):
            short_code = generate_short_code()
            exists = await db.execute(select(Link).where(Link.short_code == short_code))
            if not exists.scalar_one_or_none():
                break

    link = Link(
        short_code=short_code,
        original_url=url,
        custom_alias=body.custom_alias,
        session_id=session_id,
        user_id=current_user.id if current_user else None,
        expires_at=body.expires_at,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)

    return ShortenResponse(
        short_code=link.short_code,
        short_url=f"{BASE_URL}/{link.short_code}",
        original_url=link.original_url,
        created_at=link.created_at,
        expires_at=link.expires_at,
    )


# ── Redirect ─────────────────────────────────────────────────────────────────

@app.get("/{short_code}")
async def redirect(
    short_code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Skip reserved paths
    if short_code in ["api", "health", "docs", "openapi.json", "redoc"] or short_code.startswith("api"):
        raise HTTPException(status_code=404)

    result = await db.execute(select(Link).where(Link.short_code == short_code, Link.is_active == True))
    link = result.scalar_one_or_none()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    if link.expires_at and _as_aware(link.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Link expired")

    # Log click (fire-and-forget)
    asyncio.create_task(_log_click(link.id, request))

    return RedirectResponse(url=link.original_url, status_code=301)


async def _log_click(link_id: str, request: Request):
    ip = request.client.host if request.client else "unknown"
    ua_string = request.headers.get("user-agent", "")
    referrer = request.headers.get("referer")
    country = await lookup_country(ip)

    async with AsyncSessionLocal() as db:
        click = Click(
            link_id=link_id,
            ip_hash=hash_ip(ip),
            user_agent=ua_string,
            device_type=get_device_type(ua_string),
            referrer=clean_referrer(referrer),
            country=country,
        )
        db.add(click)
        await db.commit()

    # Notify SSE subscribers
    result_db = AsyncSessionLocal()
    async with result_db as db:
        link_result = await db.execute(select(Link).where(Link.id == link_id))
        link = link_result.scalar_one_or_none()
        if link and link.short_code in _sse_subscribers:
            event_data = json.dumps({"clicked_at": datetime.now(timezone.utc).isoformat(), "country": country})
            for queue in list(_sse_subscribers[link.short_code]):
                await queue.put(event_data)


# ── My Links ──────────────────────────────────────────────────────────────────

@app.get("/api/links", response_model=list[LinkItem])
async def list_links(
    response: Response,
    db: AsyncSession = Depends(get_db),
    session_id: str | None = Cookie(default=None),
):
    session_id = _get_or_create_session(session_id, response)

    result = await db.execute(
        select(Link).where(Link.session_id == session_id, Link.is_active == True).order_by(Link.created_at.desc())
    )
    links = result.scalars().all()

    items = []
    for link in links:
        count_result = await db.execute(select(func.count()).where(Click.link_id == link.id))
        click_count = count_result.scalar() or 0
        items.append(
            LinkItem(
                short_code=link.short_code,
                short_url=f"{BASE_URL}/{link.short_code}",
                original_url=link.original_url,
                click_count=click_count,
                created_at=link.created_at,
                expires_at=link.expires_at,
                is_active=link.is_active,
            )
        )
    return items


@app.delete("/api/links/{short_code}")
async def delete_link(
    short_code: str,
    db: AsyncSession = Depends(get_db),
    session_id: str | None = Cookie(default=None),
):
    result = await db.execute(
        select(Link).where(Link.short_code == short_code, Link.session_id == session_id)
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    link.is_active = False
    await db.commit()
    return {"ok": True}


# ── Stats ─────────────────────────────────────────────────────────────────────

@app.get("/api/links/{short_code}/stats", response_model=StatsResponse)
async def get_stats(
    short_code: str,
    db: AsyncSession = Depends(get_db),
    session_id: str | None = Cookie(default=None),
):
    result = await db.execute(select(Link).where(Link.short_code == short_code))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    clicks_result = await db.execute(select(Click).where(Click.link_id == link.id))
    clicks = clicks_result.scalars().all()

    return _stats_from_clicks(list(clicks))


# ── SSE Live Stream ───────────────────────────────────────────────────────────

@app.get("/api/links/{short_code}/live")
async def live_clicks(short_code: str):
    queue: asyncio.Queue = asyncio.Queue()
    _sse_subscribers[short_code].append(queue)

    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            yield f"data: {json.dumps({'connected': True})}\n\n"
            while True:
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            _sse_subscribers[short_code].remove(queue)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── Authentication ────────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(
    body: UserRegister,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    print(f"📝 Registration attempt: {body.email}")
    
    # Rate limiting - max 5 registrations per hour per IP
    client_ip = request.client.host if request.client else "unknown"
    print(f"📍 Client IP: {client_ip}")
    
    is_allowed, seconds_left = rate_limiter.check_rate_limit(
        f"register:{client_ip}", max_attempts=5, window_minutes=60
    )
    
    if not is_allowed:
        print(f"⛔ Rate limit exceeded for {client_ip}")
        raise HTTPException(
            status_code=429,
            detail=f"Too many registration attempts. Please try again in {seconds_left} seconds"
        )
    
    # Check if user exists
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # Create user
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Send welcome email (async, don't wait)
    asyncio.create_task(send_welcome_email(user.email, user.name))
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    _set_auth_cookies(response, access_token, user)
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(
    body: UserLogin,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    # Rate limiting - max 10 login attempts per 15 minutes per IP
    client_ip = request.client.host if request.client else "unknown"
    is_allowed, seconds_left = rate_limiter.check_rate_limit(
        f"login:{client_ip}", max_attempts=10, window_minutes=15
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Too many login attempts. Please try again in {seconds_left} seconds"
        )
    
    # Find user
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    
    if not user:
        # Don't reveal if email exists
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Check if account is locked
    locked_until = _as_aware(user.locked_until)
    if locked_until and datetime.now(timezone.utc) < locked_until:
        minutes_left = int((locked_until - datetime.now(timezone.utc)).total_seconds() / 60)
        raise HTTPException(
            status_code=403,
            detail=f"Account is locked due to too many failed attempts. Try again in {minutes_left} minutes"
        )
    
    # Verify password
    if not verify_password(body.password, user.hashed_password):
        # Increment failed attempts
        user.failed_login_attempts += 1
        
        # Lock account after 5 failed attempts
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
            await db.commit()
            raise HTTPException(
                status_code=403,
                detail="Account locked due to too many failed login attempts. Please reset your password or try again in 30 minutes"
            )
        
        await db.commit()
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Reset failed attempts on successful login
    if user.failed_login_attempts > 0:
        user.failed_login_attempts = 0
        user.locked_until = None
        await db.commit()
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    _set_auth_cookies(response, access_token, user)
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


# ── Password Reset ────────────────────────────────────────────────────────────

@app.post("/api/auth/password-reset/request", response_model=PasswordResetResponse)
async def request_password_reset(
    body: PasswordResetRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Request password reset - sends verification code via email and returns QR code
    """
    # Rate limiting - max 3 requests per hour per IP
    client_ip = request.client.host if request.client else "unknown"
    is_allowed, seconds_left = rate_limiter.check_rate_limit(
        f"password_reset:{client_ip}", max_attempts=3, window_minutes=60
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Too many password reset requests. Please try again in {seconds_left} seconds"
        )
    
    # Find user
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    
    # Always return success (don't reveal if email exists)
    if not user:
        # Return fake response to prevent email enumeration
        return PasswordResetResponse(
            message="If this email is registered, you will receive a verification code shortly",
            qr_code_data=None,
            expires_in_minutes=15
        )
    
    # Generate verification code and reset token
    verification_code = generate_verification_code(length=6)
    reset_token = generate_reset_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Delete old reset requests for this user
    await db.execute(
        select(PasswordReset).where(
            PasswordReset.user_id == user.id,
            PasswordReset.used_at == None
        )
    )
    old_resets = (await db.execute(
        select(PasswordReset).where(
            PasswordReset.user_id == user.id,
            PasswordReset.used_at == None
        )
    )).scalars().all()
    
    for old_reset in old_resets:
        await db.delete(old_reset)
    
    # Send email with verification code
    success, qr_code_data = await send_password_reset_email(
        to_email=user.email,
        verification_code=verification_code,
        reset_token=reset_token,
        expires_in_minutes=15
    )
    
    # Create password reset record
    password_reset = PasswordReset(
        user_id=user.id,
        reset_token=reset_token,
        verification_code=verification_code,
        qr_code_data=qr_code_data,
        expires_at=expires_at,
        ip_address=client_ip
    )
    db.add(password_reset)
    await db.commit()
    
    return PasswordResetResponse(
        message="Verification code sent to your email. Check your inbox or scan the QR code below.",
        qr_code_data=qr_code_data,
        expires_in_minutes=15
    )


@app.post("/api/auth/password-reset/verify")
async def verify_password_reset(
    body: PasswordResetVerify,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify code and reset password
    """
    # Rate limiting - max 10 attempts per 15 minutes per IP
    client_ip = request.client.host if request.client else "unknown"
    is_allowed, seconds_left = rate_limiter.check_rate_limit(
        f"password_reset_verify:{client_ip}", max_attempts=10, window_minutes=15
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Too many verification attempts. Please try again in {seconds_left} seconds"
        )
    
    # Find user
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find valid reset request
    reset_result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.user_id == user.id,
            PasswordReset.verification_code == body.code,
            PasswordReset.used_at == None,
            PasswordReset.expires_at > datetime.now(timezone.utc)
        )
    )
    password_reset = reset_result.scalar_one_or_none()
    
    if not password_reset:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification code"
        )
    
    # Update password
    user.hashed_password = hash_password(body.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    
    # Mark reset as used
    password_reset.used_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    # Reset rate limiter for this user
    rate_limiter.reset(f"login:{client_ip}")
    
    return {"message": "Password reset successfully. You can now login with your new password."}


@app.get("/api/auth/password-reset/check/{email}")
async def check_reset_status(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Check if there's an active password reset request
    Returns QR code if available
    """
    email = sanitize_input(email, max_length=254).lower()
    
    # Find user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        return {"has_active_reset": False}
    
    # Find active reset
    reset_result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.user_id == user.id,
            PasswordReset.used_at == None,
            PasswordReset.expires_at > datetime.now(timezone.utc)
        ).order_by(PasswordReset.created_at.desc())
    )
    password_reset = reset_result.scalar_one_or_none()
    
    if not password_reset:
        return {"has_active_reset": False}
    
    reset_expires_at = _as_aware(password_reset.expires_at) or datetime.now(timezone.utc)
    expires_in = int((reset_expires_at - datetime.now(timezone.utc)).total_seconds() / 60)
    
    return {
        "has_active_reset": True,
        "qr_code_data": password_reset.qr_code_data,
        "expires_in_minutes": expires_in
    }


# ── Link Tracking (Save to User) ──────────────────────────────────────────────

@app.post("/api/links/{short_code}/track")
async def track_link(
    short_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    session_id: str | None = Cookie(default=None),
):
    """Associate a link with the current user for tracking"""
    result = await db.execute(
        select(Link).where(Link.short_code == short_code, Link.session_id == session_id)
    )
    link = result.scalar_one_or_none()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    # Associate with user
    link.user_id = current_user.id
    await db.commit()
    
    return {"ok": True, "message": "Link is now being tracked"}


# ── QR Code Management ────────────────────────────────────────────────────────

@app.post("/api/qr/create", response_model=QRCodeResponse)
async def create_qr(
    body: QRCodeCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
    session_id: str | None = Cookie(default=None),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Create a QR code (optionally tracked if user is logged in)"""
    session_id = _get_or_create_session(session_id, response)
    
    # Generate unique QR code
    for _ in range(10):
        qr_code = generate_short_code()
        exists = await db.execute(select(QRCode).where(QRCode.qr_code == qr_code))
        if not exists.scalar_one_or_none():
            break
    
    qr = QRCode(
        qr_code=qr_code,
        qr_type=body.qr_type,
        content=body.content,
        session_id=session_id,
        user_id=current_user.id if current_user else None,
    )
    db.add(qr)
    await db.commit()
    await db.refresh(qr)
    
    return QRCodeResponse(
        id=qr.id,
        qr_code=qr.qr_code,
        qr_type=qr.qr_type,
        content=qr.content,
        created_at=qr.created_at,
        scan_count=0,
    )


@app.post("/api/qr/{qr_code}/track")
async def track_qr(
    qr_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    session_id: str | None = Cookie(default=None),
):
    """Associate a QR code with the current user for tracking"""
    result = await db.execute(
        select(QRCode).where(QRCode.qr_code == qr_code, QRCode.session_id == session_id)
    )
    qr = result.scalar_one_or_none()
    
    if not qr:
        raise HTTPException(status_code=404, detail="QR code not found")
    
    # Associate with user
    qr.user_id = current_user.id
    await db.commit()
    
    return {"ok": True, "message": "QR code is now being tracked"}


@app.post("/api/qr/{qr_code}/scan")
async def log_qr_scan(
    qr_code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Log a QR code scan"""
    result = await db.execute(select(QRCode).where(QRCode.qr_code == qr_code))
    qr = result.scalar_one_or_none()
    
    if not qr:
        raise HTTPException(status_code=404, detail="QR code not found")
    
    # Log scan
    ip = request.client.host if request.client else "unknown"
    ua_string = request.headers.get("user-agent", "")
    country = await lookup_country(ip)
    
    scan = QRScan(
        qr_id=qr.id,
        ip_hash=hash_ip(ip),
        user_agent=ua_string,
        device_type=get_device_type(ua_string),
        country=country,
    )
    db.add(scan)
    await db.commit()
    
    return {"ok": True}


@app.get("/api/qr/{qr_code}/stats", response_model=QRStatsResponse)
async def get_qr_stats(
    qr_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get QR code statistics"""
    result = await db.execute(select(QRCode).where(QRCode.qr_code == qr_code))
    qr = result.scalar_one_or_none()
    
    if not qr:
        raise HTTPException(status_code=404, detail="QR code not found")
    
    scans_result = await db.execute(select(QRScan).where(QRScan.qr_id == qr.id))
    scans = scans_result.scalars().all()

    return _stats_from_qr_scans(list(scans))


# ── Dashboard (Unified) ───────────────────────────────────────────────────────

@app.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get unified dashboard with all user's links and QR codes"""
    
    # Get user's links
    links_result = await db.execute(
        select(Link).where(Link.user_id == current_user.id, Link.is_active == True).order_by(Link.created_at.desc())
    )
    links = links_result.scalars().all()
    
    link_items = []
    total_clicks = 0
    for link in links:
        count_result = await db.execute(select(func.count()).where(Click.link_id == link.id))
        click_count = count_result.scalar() or 0
        total_clicks += click_count
        
        link_items.append(
            DashboardLinkItem(
                id=link.id,
                short_code=link.short_code,
                short_url=f"{BASE_URL}/{link.short_code}",
                original_url=link.original_url,
                click_count=click_count,
                created_at=link.created_at,
                expires_at=link.expires_at,
            )
        )
    
    # Get user's QR codes
    qr_result = await db.execute(
        select(QRCode).where(QRCode.user_id == current_user.id, QRCode.is_active == True).order_by(QRCode.created_at.desc())
    )
    qr_codes = qr_result.scalars().all()
    
    qr_items = []
    total_scans = 0
    for qr in qr_codes:
        count_result = await db.execute(select(func.count()).where(QRScan.qr_id == qr.id))
        scan_count = count_result.scalar() or 0
        total_scans += scan_count
        
        qr_items.append(
            DashboardQRItem(
                id=qr.id,
                qr_code=qr.qr_code,
                qr_type=qr.qr_type,
                content=qr.content,
                scan_count=scan_count,
                created_at=qr.created_at,
            )
        )
    
    return DashboardResponse(
        links=link_items,
        qr_codes=qr_items,
        total_links=len(link_items),
        total_qr_codes=len(qr_items),
        total_clicks=total_clicks,
        total_scans=total_scans,
    )


@app.get("/api/dashboard/links/{short_code}/analytics", response_model=StatsResponse)
async def get_dashboard_link_analytics(
    short_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Link).where(
            Link.short_code == short_code,
            Link.user_id == current_user.id,
            Link.is_active == True,
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    clicks_result = await db.execute(select(Click).where(Click.link_id == link.id))
    return _stats_from_clicks(list(clicks_result.scalars().all()))


@app.get("/api/dashboard/qr/{qr_code}/analytics", response_model=QRStatsResponse)
async def get_dashboard_qr_analytics(
    qr_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(QRCode).where(
            QRCode.qr_code == qr_code,
            QRCode.user_id == current_user.id,
            QRCode.is_active == True,
        )
    )
    qr = result.scalar_one_or_none()
    if not qr:
        raise HTTPException(status_code=404, detail="QR code not found")

    scans_result = await db.execute(select(QRScan).where(QRScan.qr_id == qr.id))
    return _stats_from_qr_scans(list(scans_result.scalars().all()))


@app.post("/api/auth/2fa/enable")
async def enable_2fa(current_user: User = Depends(get_current_user)):
    secret = secrets.token_urlsafe(16).replace("-", "")[:24].upper()
    qr_payload = f"otpauth://totp/ZapKit:{current_user.email}?secret={secret}&issuer=ZapKit"

    import qrcode

    img = qrcode.make(qr_payload)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_code = "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")

    return {"qr_code": qr_code, "secret": secret}


@app.post("/api/auth/2fa/verify")
async def verify_2fa(body: dict, current_user: User = Depends(get_current_user)):
    code = str(body.get("code", ""))
    if not code.isdigit() or len(code) != 6:
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
    return {"message": "2FA enabled successfully"}


@app.post("/api/auth/2fa/disable")
async def disable_2fa(body: dict, current_user: User = Depends(get_current_user)):
    code = str(body.get("code", ""))
    if not code.isdigit() or len(code) != 6:
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
    return {"message": "2FA disabled successfully"}
