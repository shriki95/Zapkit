import hashlib
from datetime import datetime, timezone
from user_agents import parse as parse_ua


def hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()


def get_device_type(user_agent_string: str) -> str:
    if not user_agent_string:
        return "unknown"
    ua = parse_ua(user_agent_string)
    if ua.is_mobile:
        return "mobile"
    if ua.is_tablet:
        return "tablet"
    return "desktop"


def clean_referrer(referrer: str | None) -> str:
    if not referrer:
        return "Direct"
    try:
        from urllib.parse import urlparse
        parsed = urlparse(referrer)
        return parsed.netloc or "Direct"
    except Exception:
        return "Direct"


async def lookup_country(ip: str) -> str:
    """Free IP geolocation via ip-api.com (no key needed, 45 req/min)."""
    if ip in ("127.0.0.1", "::1", "testclient"):
        return "Local"
    try:
        import httpx
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"http://ip-api.com/json/{ip}?fields=country")
            if r.status_code == 200:
                data = r.json()
                return data.get("country", "Unknown")
    except Exception:
        pass
    return "Unknown"
