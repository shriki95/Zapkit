"""
Security utilities for ZapKit
- Rate limiting
- Password validation
- Email validation
- CSRF protection
- XSS sanitization
"""

import re
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from collections import defaultdict
from dataclasses import dataclass


# ── Rate Limiting ─────────────────────────────────────────────────────────────

@dataclass
class RateLimitEntry:
    count: int
    reset_at: datetime


class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        self.attempts: dict[str, RateLimitEntry] = {}
    
    def check_rate_limit(self, key: str, max_attempts: int, window_minutes: int) -> tuple[bool, Optional[int]]:
        """
        Check if rate limit is exceeded
        Returns: (is_allowed, seconds_until_reset)
        """
        now = datetime.now(timezone.utc)
        
        if key in self.attempts:
            entry = self.attempts[key]
            
            # Reset if window expired
            if now >= entry.reset_at:
                self.attempts[key] = RateLimitEntry(
                    count=1,
                    reset_at=now + timedelta(minutes=window_minutes)
                )
                return True, None
            
            # Check if limit exceeded
            if entry.count >= max_attempts:
                seconds_left = int((entry.reset_at - now).total_seconds())
                return False, seconds_left
            
            # Increment counter
            entry.count += 1
            return True, None
        
        # First attempt
        self.attempts[key] = RateLimitEntry(
            count=1,
            reset_at=now + timedelta(minutes=window_minutes)
        )
        return True, None
    
    def reset(self, key: str):
        """Reset rate limit for a key"""
        if key in self.attempts:
            del self.attempts[key]


# Global rate limiter instance
rate_limiter = RateLimiter()


# ── Password Validation ───────────────────────────────────────────────────────

def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate password strength
    Returns: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password is too long (max 128 characters)"
    
    # Check for at least one uppercase letter
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    # Check for at least one lowercase letter
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    # Check for at least one digit
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    # Check for at least one special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character (!@#$%^&*...)"
    
    # Check for common weak passwords
    weak_passwords = [
        'password', '12345678', 'qwerty', 'abc123', 'password1',
        'password123', '123456789', 'letmein', 'welcome', 'admin123'
    ]
    if password.lower() in weak_passwords:
        return False, "This password is too common. Please choose a stronger password"
    
    return True, ""


# ── Email Validation ──────────────────────────────────────────────────────────

def validate_email(email: str) -> tuple[bool, str]:
    """
    Validate email format and check for disposable domains
    Returns: (is_valid, error_message)
    """
    email = email.strip().lower()
    
    # Basic format check
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return False, "Invalid email format"
    
    # Check length
    if len(email) > 254:
        return False, "Email is too long"
    
    # Extract domain
    domain = email.split('@')[1]
    
    # Block disposable email domains
    disposable_domains = [
        'tempmail.com', 'throwaway.email', '10minutemail.com',
        'guerrillamail.com', 'mailinator.com', 'trashmail.com',
        'temp-mail.org', 'fakeinbox.com', 'yopmail.com'
    ]
    
    if domain in disposable_domains:
        return False, "Disposable email addresses are not allowed"
    
    # Block suspicious patterns
    if re.search(r'\d{5,}', email):  # Too many consecutive numbers
        return False, "Email looks suspicious"
    
    return True, ""


# ── Input Sanitization ────────────────────────────────────────────────────────

def sanitize_input(text: str, max_length: int = 1000) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks
    """
    if not text:
        return ""
    
    # Trim to max length
    text = text[:max_length]
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Remove control characters except newlines and tabs
    text = ''.join(char for char in text if char.isprintable() or char in '\n\t')
    
    # Strip leading/trailing whitespace
    text = text.strip()
    
    return text


def sanitize_url(url: str) -> str:
    """
    Sanitize URL to prevent XSS and open redirect attacks
    """
    url = sanitize_input(url, max_length=2048)
    
    # Block javascript: and data: URLs
    if url.lower().startswith(('javascript:', 'data:', 'vbscript:')):
        return ""
    
    # Ensure URL has a valid protocol
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    return url


# ── Verification Code Generation ──────────────────────────────────────────────

def generate_verification_code(length: int = 6) -> str:
    """
    Generate a random verification code
    Default: 6-digit numeric code
    """
    return ''.join(secrets.choice(string.digits) for _ in range(length))


def generate_reset_token(length: int = 32) -> str:
    """
    Generate a secure random token for password reset
    """
    return secrets.token_urlsafe(length)


# ── Username Validation ───────────────────────────────────────────────────────

def validate_username(username: str) -> tuple[bool, str]:
    """
    Validate username format
    Returns: (is_valid, error_message)
    """
    if not username:
        return True, ""  # Username is optional
    
    username = username.strip()
    
    if len(username) < 2:
        return False, "Name must be at least 2 characters"
    
    if len(username) > 50:
        return False, "Name is too long (max 50 characters)"
    
    # Allow letters, numbers, spaces, and common punctuation
    if not re.match(r'^[a-zA-Z0-9\s\-_.]+$', username):
        return False, "Name contains invalid characters"
    
    return True, ""


# ── IP Address Utilities ──────────────────────────────────────────────────────

def is_valid_ip(ip: str) -> bool:
    """Check if IP address is valid"""
    try:
        parts = ip.split('.')
        if len(parts) != 4:
            return False
        return all(0 <= int(part) <= 255 for part in parts)
    except:
        return False


def is_private_ip(ip: str) -> bool:
    """Check if IP is private/local"""
    if not is_valid_ip(ip):
        return False
    
    parts = [int(p) for p in ip.split('.')]
    
    # Private ranges
    if parts[0] == 10:
        return True
    if parts[0] == 172 and 16 <= parts[1] <= 31:
        return True
    if parts[0] == 192 and parts[1] == 168:
        return True
    if parts[0] == 127:  # Localhost
        return True
    
    return False


# ── CSRF Token ────────────────────────────────────────────────────────────────

def generate_csrf_token() -> str:
    """Generate CSRF token"""
    return secrets.token_urlsafe(32)


def verify_csrf_token(token: str, expected: str) -> bool:
    """Verify CSRF token"""
    return secrets.compare_digest(token, expected)
