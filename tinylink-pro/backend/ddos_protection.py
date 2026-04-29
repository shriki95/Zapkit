"""
DDoS Protection and Advanced Security
- Request throttling
- IP blocking
- Suspicious activity detection
- Connection limiting
"""

import time
from datetime import datetime, timedelta, timezone
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Optional
import hashlib


@dataclass
class IPStats:
    """Statistics for an IP address"""
    request_count: int = 0
    last_request: float = 0
    blocked_until: Optional[float] = None
    suspicious_score: int = 0
    request_times: deque = None
    
    def __post_init__(self):
        if self.request_times is None:
            self.request_times = deque(maxlen=100)


class DDoSProtection:
    """Advanced DDoS protection system"""
    
    def __init__(self):
        self.ip_stats: dict[str, IPStats] = defaultdict(IPStats)
        self.blocked_ips: set[str] = set()
        self.whitelist: set[str] = {'127.0.0.1', '::1'}  # Localhost
        
        # Thresholds
        self.MAX_REQUESTS_PER_SECOND = 10
        self.MAX_REQUESTS_PER_MINUTE = 100
        self.MAX_REQUESTS_PER_HOUR = 1000
        self.BLOCK_DURATION_SECONDS = 3600  # 1 hour
        self.SUSPICIOUS_THRESHOLD = 50
        
    def check_request(self, ip: str, endpoint: str) -> tuple[bool, Optional[str]]:
        """
        Check if request should be allowed
        Returns: (is_allowed, reason_if_blocked)
        """
        # Whitelist check
        if ip in self.whitelist:
            return True, None
        
        # Blocked IP check
        if ip in self.blocked_ips:
            stats = self.ip_stats[ip]
            if stats.blocked_until and time.time() < stats.blocked_until:
                remaining = int(stats.blocked_until - time.time())
                return False, f"IP blocked for {remaining} more seconds"
            else:
                # Unblock
                self.blocked_ips.remove(ip)
                stats.blocked_until = None
                stats.suspicious_score = max(0, stats.suspicious_score - 10)
        
        stats = self.ip_stats[ip]
        now = time.time()
        
        # Add request timestamp
        stats.request_times.append(now)
        stats.last_request = now
        stats.request_count += 1
        
        # Check requests per second
        recent_requests = [t for t in stats.request_times if now - t <= 1]
        if len(recent_requests) > self.MAX_REQUESTS_PER_SECOND:
            stats.suspicious_score += 10
            return False, "Too many requests per second"
        
        # Check requests per minute
        minute_requests = [t for t in stats.request_times if now - t <= 60]
        if len(minute_requests) > self.MAX_REQUESTS_PER_MINUTE:
            stats.suspicious_score += 5
            return False, "Too many requests per minute"
        
        # Check requests per hour
        hour_requests = [t for t in stats.request_times if now - t <= 3600]
        if len(hour_requests) > self.MAX_REQUESTS_PER_HOUR:
            stats.suspicious_score += 3
            return False, "Too many requests per hour"
        
        # Check for suspicious patterns
        if self._is_suspicious_pattern(stats, endpoint):
            stats.suspicious_score += 15
        
        # Block if suspicious score too high
        if stats.suspicious_score >= self.SUSPICIOUS_THRESHOLD:
            self._block_ip(ip, stats)
            return False, "Suspicious activity detected - IP blocked"
        
        return True, None
    
    def _is_suspicious_pattern(self, stats: IPStats, endpoint: str) -> bool:
        """Detect suspicious request patterns"""
        if len(stats.request_times) < 10:
            return False
        
        recent = list(stats.request_times)[-10:]
        
        # Check for too uniform timing (bot-like behavior)
        intervals = [recent[i+1] - recent[i] for i in range(len(recent)-1)]
        if intervals:
            avg_interval = sum(intervals) / len(intervals)
            # If all intervals are very similar (within 0.1s), it's suspicious
            if all(abs(interval - avg_interval) < 0.1 for interval in intervals):
                return True
        
        # Check for rapid-fire requests
        if recent[-1] - recent[0] < 1:  # 10 requests in less than 1 second
            return True
        
        return False
    
    def _block_ip(self, ip: str, stats: IPStats):
        """Block an IP address"""
        self.blocked_ips.add(ip)
        stats.blocked_until = time.time() + self.BLOCK_DURATION_SECONDS
        print(f"🚫 BLOCKED IP: {ip} (suspicious score: {stats.suspicious_score})")
    
    def report_failed_auth(self, ip: str):
        """Report failed authentication attempt"""
        stats = self.ip_stats[ip]
        stats.suspicious_score += 5
        
        if stats.suspicious_score >= self.SUSPICIOUS_THRESHOLD:
            self._block_ip(ip, stats)
    
    def report_invalid_input(self, ip: str):
        """Report invalid/malicious input attempt"""
        stats = self.ip_stats[ip]
        stats.suspicious_score += 10
        
        if stats.suspicious_score >= self.SUSPICIOUS_THRESHOLD:
            self._block_ip(ip, stats)
    
    def whitelist_ip(self, ip: str):
        """Add IP to whitelist"""
        self.whitelist.add(ip)
        if ip in self.blocked_ips:
            self.blocked_ips.remove(ip)
    
    def get_stats(self) -> dict:
        """Get protection statistics"""
        return {
            "total_ips_tracked": len(self.ip_stats),
            "blocked_ips": len(self.blocked_ips),
            "whitelisted_ips": len(self.whitelist),
            "top_requesters": self._get_top_requesters(10)
        }
    
    def _get_top_requesters(self, limit: int) -> list:
        """Get top requesting IPs"""
        sorted_ips = sorted(
            self.ip_stats.items(),
            key=lambda x: x[1].request_count,
            reverse=True
        )[:limit]
        
        return [
            {
                "ip": ip,
                "requests": stats.request_count,
                "suspicious_score": stats.suspicious_score,
                "blocked": ip in self.blocked_ips
            }
            for ip, stats in sorted_ips
        ]
    
    def cleanup_old_data(self):
        """Clean up old tracking data"""
        now = time.time()
        cutoff = now - 86400  # 24 hours
        
        # Remove old IP stats
        to_remove = [
            ip for ip, stats in self.ip_stats.items()
            if stats.last_request < cutoff and ip not in self.blocked_ips
        ]
        
        for ip in to_remove:
            del self.ip_stats[ip]


# Global instance
ddos_protection = DDoSProtection()


# ── Connection Limiting ───────────────────────────────────────────────────────

class ConnectionLimiter:
    """Limit concurrent connections per IP"""
    
    def __init__(self, max_connections: int = 50):
        self.max_connections = max_connections
        self.active_connections: dict[str, int] = defaultdict(int)
    
    def acquire(self, ip: str) -> bool:
        """Try to acquire a connection slot"""
        if self.active_connections[ip] >= self.max_connections:
            return False
        
        self.active_connections[ip] += 1
        return True
    
    def release(self, ip: str):
        """Release a connection slot"""
        if ip in self.active_connections:
            self.active_connections[ip] = max(0, self.active_connections[ip] - 1)
            
            # Clean up if no connections
            if self.active_connections[ip] == 0:
                del self.active_connections[ip]
    
    def get_connection_count(self, ip: str) -> int:
        """Get current connection count for IP"""
        return self.active_connections.get(ip, 0)


connection_limiter = ConnectionLimiter()


# ── Request Fingerprinting ────────────────────────────────────────────────────

def generate_request_fingerprint(
    ip: str,
    user_agent: str,
    accept_language: str,
    accept_encoding: str
) -> str:
    """
    Generate unique fingerprint for request
    Used to detect distributed attacks from same source
    """
    data = f"{ip}:{user_agent}:{accept_language}:{accept_encoding}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]


# ── Honeypot Detection ────────────────────────────────────────────────────────

class HoneypotDetector:
    """Detect bots using honeypot fields"""
    
    def __init__(self):
        self.caught_ips: set[str] = set()
    
    def check_honeypot(self, ip: str, honeypot_value: Optional[str]) -> bool:
        """
        Check if honeypot field was filled (indicates bot)
        Returns: True if bot detected
        """
        if honeypot_value:
            self.caught_ips.add(ip)
            ddos_protection.report_invalid_input(ip)
            print(f"🍯 HONEYPOT: Bot detected from {ip}")
            return True
        return False
    
    def is_known_bot(self, ip: str) -> bool:
        """Check if IP is known bot"""
        return ip in self.caught_ips


honeypot_detector = HoneypotDetector()


# ── SQL Injection Detection ───────────────────────────────────────────────────

def detect_sql_injection(input_str: str) -> bool:
    """
    Detect potential SQL injection attempts
    """
    if not input_str:
        return False
    
    input_lower = input_str.lower()
    
    # Common SQL injection patterns
    sql_patterns = [
        "' or '1'='1",
        "' or 1=1",
        "admin'--",
        "' union select",
        "'; drop table",
        "'; delete from",
        "' and '1'='1",
        "<script>",
        "javascript:",
        "onerror=",
        "onload=",
    ]
    
    for pattern in sql_patterns:
        if pattern in input_lower:
            return True
    
    return False


# ── XSS Detection ─────────────────────────────────────────────────────────────

def detect_xss_attempt(input_str: str) -> bool:
    """
    Detect potential XSS attempts
    """
    if not input_str:
        return False
    
    input_lower = input_str.lower()
    
    xss_patterns = [
        "<script",
        "javascript:",
        "onerror=",
        "onload=",
        "onclick=",
        "onmouseover=",
        "<iframe",
        "<object",
        "<embed",
        "eval(",
        "alert(",
    ]
    
    for pattern in xss_patterns:
        if pattern in input_lower:
            return True
    
    return False


# ── Path Traversal Detection ──────────────────────────────────────────────────

def detect_path_traversal(input_str: str) -> bool:
    """
    Detect path traversal attempts
    """
    if not input_str:
        return False
    
    dangerous_patterns = [
        "../",
        "..\\",
        "%2e%2e",
        "..%2f",
        "..%5c",
    ]
    
    input_lower = input_str.lower()
    
    for pattern in dangerous_patterns:
        if pattern in input_lower:
            return True
    
    return False


# ── Comprehensive Input Validation ────────────────────────────────────────────

def validate_input_security(input_str: str, ip: str) -> tuple[bool, Optional[str]]:
    """
    Comprehensive security validation
    Returns: (is_safe, threat_type)
    """
    if detect_sql_injection(input_str):
        ddos_protection.report_invalid_input(ip)
        return False, "SQL Injection"
    
    if detect_xss_attempt(input_str):
        ddos_protection.report_invalid_input(ip)
        return False, "XSS Attack"
    
    if detect_path_traversal(input_str):
        ddos_protection.report_invalid_input(ip)
        return False, "Path Traversal"
    
    return True, None
