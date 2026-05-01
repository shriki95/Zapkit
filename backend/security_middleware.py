"""
Security Middleware for FastAPI
- DDoS protection
- Request validation
- Security headers
- Connection limiting
"""

import os
import time
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from ddos_protection import (
    ddos_protection,
    connection_limiter,
    validate_input_security,
    generate_request_fingerprint,
)


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive security middleware
    """
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Skip security checks for health check endpoint
        if request.url.path == "/health":
            return await call_next(request)
        
        # 1. Connection limiting
        if not connection_limiter.acquire(client_ip):
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"detail": "Too many concurrent connections from your IP"}
            )
        
        try:
            # 2. DDoS protection
            is_allowed, reason = ddos_protection.check_request(
                client_ip,
                request.url.path
            )
            
            if not is_allowed:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": reason}
                )
            
            # 3. Validate query parameters
            for key, value in request.query_params.items():
                is_safe, threat = validate_input_security(str(value), client_ip)
                if not is_safe:
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={"detail": f"Malicious input detected: {threat}"}
                    )
            
            # 4. Generate request fingerprint (for logging)
            fingerprint = generate_request_fingerprint(
                client_ip,
                request.headers.get("user-agent", ""),
                request.headers.get("accept-language", ""),
                request.headers.get("accept-encoding", "")
            )
            
            # Add fingerprint to request state
            request.state.fingerprint = fingerprint
            request.state.client_ip = client_ip
            
            # 5. Process request
            start_time = time.time()
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # 6. Add security headers
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
            response.headers["X-Process-Time"] = str(process_time)
            
            # 7. Detect slow loris attacks
            if process_time > 30:  # Request took more than 30 seconds
                ddos_protection.report_invalid_input(client_ip)
            
            return response
            
        finally:
            # Always release connection
            connection_limiter.release(client_ip)
    
    def _get_client_ip(self, request: Request) -> str:
        """
        Get real client IP (handles proxies)
        """
        # Check X-Forwarded-For header (for proxies/load balancers)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Take first IP (original client)
            return forwarded.split(",")[0].strip()
        
        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection
        if request.client:
            return request.client.host
        
        return "unknown"


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """
    Validate request body for malicious content
    """
    
    async def dispatch(self, request: Request, call_next):
        # Only check POST/PUT/PATCH requests
        if request.method in ["POST", "PUT", "PATCH"]:
            client_ip = request.client.host if request.client else "unknown"
            
            try:
                # Read body
                body = await request.body()
                
                # Check body size (prevent memory exhaustion)
                max_body_size = 10 * 1024 * 1024  # 10MB
                if len(body) > max_body_size:
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={"detail": "Request body too large"}
                    )
                
                # Validate body content
                if body:
                    body_str = body.decode('utf-8', errors='ignore')
                    is_safe, threat = validate_input_security(body_str, client_ip)
                    
                    if not is_safe:
                        return JSONResponse(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            content={"detail": f"Malicious content detected: {threat}"}
                        )
                
                # Recreate request with body
                async def receive():
                    return {"type": "http.request", "body": body}
                
                request._receive = receive
                
            except Exception as e:
                print(f"Error validating request: {e}")
        
        response = await call_next(request)
        return response


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection for state-changing operations
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip CSRF for health check
        if request.url.path == "/health":
            return await call_next(request)
            
        # Check CSRF token for state-changing methods
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            # Skip CSRF for API endpoints with Bearer token
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                # JWT token provides CSRF protection
                pass
            else:
                # For development: allow requests from localhost
                origin = request.headers.get("Origin")
                referer = request.headers.get("Referer")
                
                # Always-allowed origin substrings (production + dev)
                always_allowed = [
                    "localhost", "127.0.0.1",
                    "netlify.app", "railway.app",
                    "zapkit2.netlify.app", "zapkit.netlify.app",
                ]
                _env_origins = [
                    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()
                ]
                all_allowed = always_allowed + _env_origins

                if origin:
                    if any(allowed in origin for allowed in all_allowed):
                        pass  # Allow
                    else:
                        return JSONResponse(
                            status_code=status.HTTP_403_FORBIDDEN,
                            content={"detail": "Invalid origin"}
                        )
                elif referer:
                    if any(allowed in referer for allowed in all_allowed):
                        pass  # Allow
                    else:
                        return JSONResponse(
                            status_code=status.HTTP_403_FORBIDDEN,
                            content={"detail": "Invalid referer"}
                        )
                # If no origin/referer but has cookies, allow (same-origin)
                elif request.cookies:
                    pass  # Allow
        
        response = await call_next(request)
        return response


# ── Cleanup Task ──────────────────────────────────────────────────────────────

import asyncio

async def cleanup_security_data():
    """
    Periodic cleanup of old security data
    Runs every hour
    """
    while True:
        await asyncio.sleep(3600)  # 1 hour
        
        try:
            ddos_protection.cleanup_old_data()
            print("🧹 Security data cleanup completed")
        except Exception as e:
            print(f"❌ Cleanup error: {e}")
