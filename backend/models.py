import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    failed_login_attempts: Mapped[int] = mapped_column(default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    two_fa_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    two_fa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    links: Mapped[list["Link"]] = relationship("Link", back_populates="user")
    qr_codes: Mapped[list["QRCode"]] = relationship("QRCode", back_populates="user")
    password_resets: Mapped[list["PasswordReset"]] = relationship("PasswordReset", back_populates="user", cascade="all, delete-orphan")


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    reset_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    verification_code: Mapped[str] = mapped_column(String(10), nullable=False)
    qr_code_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # QR code as base64
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="password_resets")


class Link(Base):
    __tablename__ = "links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    short_code: Mapped[str] = mapped_column(String(12), unique=True, index=True, nullable=False)
    original_url: Mapped[str] = mapped_column(Text, nullable=False)
    custom_alias: Mapped[str | None] = mapped_column(String(50), nullable=True)
    session_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    clicks: Mapped[list["Click"]] = relationship("Click", back_populates="link", cascade="all, delete-orphan")
    user: Mapped["User"] = relationship("User", back_populates="links")


class Click(Base):
    __tablename__ = "clicks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    link_id: Mapped[str] = mapped_column(String(36), ForeignKey("links.id"), nullable=False, index=True)
    clicked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    device_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    referrer: Mapped[str | None] = mapped_column(Text, nullable=True)
    country: Mapped[str | None] = mapped_column(String(50), nullable=True)

    link: Mapped["Link"] = relationship("Link", back_populates="clicks")


class QRCode(Base):
    __tablename__ = "qr_codes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    qr_code: Mapped[str] = mapped_column(String(12), unique=True, index=True, nullable=False)
    qr_type: Mapped[str] = mapped_column(String(20), nullable=False)  # link, wifi, vcard, etc.
    content: Mapped[str] = mapped_column(Text, nullable=False)  # JSON with QR data
    session_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    scans: Mapped[list["QRScan"]] = relationship("QRScan", back_populates="qr_code", cascade="all, delete-orphan")
    user: Mapped["User"] = relationship("User", back_populates="qr_codes")


class QRScan(Base):
    __tablename__ = "qr_scans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    qr_id: Mapped[str] = mapped_column(String(36), ForeignKey("qr_codes.id"), nullable=False, index=True)
    scanned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    device_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country: Mapped[str | None] = mapped_column(String(50), nullable=True)

    qr_code: Mapped["QRCode"] = relationship("QRCode", back_populates="scans")
