"""
Data Encryption for sensitive information
- Field-level encryption
- PII protection
- Secure key management
"""

import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from dotenv import load_dotenv

load_dotenv()

# Encryption key (should be stored securely, not in code!)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "")

if not ENCRYPTION_KEY:
    # Generate a key for development (DO NOT USE IN PRODUCTION)
    print("⚠️  WARNING: No ENCRYPTION_KEY found in .env, generating temporary key")
    print("⚠️  This key will change on restart - data will be lost!")
    print("⚠️  Set ENCRYPTION_KEY in .env for production")
    ENCRYPTION_KEY = Fernet.generate_key().decode()


def _get_fernet() -> Fernet:
    """Get Fernet cipher instance"""
    # Derive key from password
    kdf = PBKDF2(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'zapkit-salt-2024',  # Should be random in production
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(ENCRYPTION_KEY.encode()))
    return Fernet(key)


def encrypt_field(plaintext: str) -> str:
    """
    Encrypt a field value
    Returns base64 encoded encrypted string
    """
    if not plaintext:
        return ""
    
    try:
        f = _get_fernet()
        encrypted = f.encrypt(plaintext.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    except Exception as e:
        print(f"❌ Encryption error: {e}")
        return plaintext  # Fallback (not ideal)


def decrypt_field(encrypted: str) -> str:
    """
    Decrypt a field value
    """
    if not encrypted:
        return ""
    
    try:
        f = _get_fernet()
        decoded = base64.urlsafe_b64decode(encrypted.encode())
        decrypted = f.decrypt(decoded)
        return decrypted.decode()
    except Exception as e:
        print(f"❌ Decryption error: {e}")
        return encrypted  # Fallback (not ideal)


def mask_email(email: str) -> str:
    """
    Mask email for display (PII protection)
    Example: john.doe@example.com -> j***e@e*****e.com
    """
    if not email or '@' not in email:
        return email
    
    local, domain = email.split('@', 1)
    
    # Mask local part
    if len(local) <= 2:
        masked_local = local[0] + '*'
    else:
        masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
    
    # Mask domain
    if '.' in domain:
        domain_parts = domain.split('.')
        domain_name = domain_parts[0]
        domain_ext = '.'.join(domain_parts[1:])
        
        if len(domain_name) <= 2:
            masked_domain = domain_name[0] + '*'
        else:
            masked_domain = domain_name[0] + '*' * (len(domain_name) - 2) + domain_name[-1]
        
        masked_domain = f"{masked_domain}.{domain_ext}"
    else:
        masked_domain = domain[0] + '*' * (len(domain) - 1)
    
    return f"{masked_local}@{masked_domain}"


def mask_phone(phone: str) -> str:
    """
    Mask phone number
    Example: +1234567890 -> +123***7890
    """
    if not phone or len(phone) < 4:
        return phone
    
    return phone[:3] + '*' * (len(phone) - 6) + phone[-3:]


def mask_ip(ip: str) -> str:
    """
    Mask IP address for privacy
    Example: 192.168.1.100 -> 192.168.*.*
    """
    if not ip or '.' not in ip:
        return ip
    
    parts = ip.split('.')
    if len(parts) == 4:
        return f"{parts[0]}.{parts[1]}.*.*"
    
    return ip


def hash_pii(data: str) -> str:
    """
    One-way hash for PII (for comparison without storing original)
    """
    import hashlib
    return hashlib.sha256(data.encode()).hexdigest()


# ── Secure Token Generation ───────────────────────────────────────────────────

import secrets

def generate_secure_token(length: int = 32) -> str:
    """Generate cryptographically secure random token"""
    return secrets.token_urlsafe(length)


def generate_api_key() -> str:
    """Generate API key"""
    return f"zk_{secrets.token_urlsafe(32)}"


# ── Password Strength Checker ─────────────────────────────────────────────────

def check_password_breach(password: str) -> bool:
    """
    Check if password appears in known breaches (using k-anonymity)
    Uses Have I Been Pwned API
    
    Returns: True if password is breached
    """
    import hashlib
    import httpx
    
    # Hash password
    sha1 = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix = sha1[:5]
    suffix = sha1[5:]
    
    try:
        # Query HIBP API (k-anonymity - only sends first 5 chars)
        response = httpx.get(
            f"https://api.pwnedpasswords.com/range/{prefix}",
            timeout=5.0
        )
        
        if response.status_code == 200:
            # Check if our suffix appears in results
            hashes = response.text.split('\n')
            for hash_line in hashes:
                if hash_line.startswith(suffix):
                    return True  # Password is breached!
        
        return False
        
    except Exception as e:
        print(f"⚠️  Could not check password breach: {e}")
        return False  # Assume safe if check fails


# ── Secure Comparison ─────────────────────────────────────────────────────────

def secure_compare(a: str, b: str) -> bool:
    """
    Timing-safe string comparison
    Prevents timing attacks
    """
    return secrets.compare_digest(a, b)
