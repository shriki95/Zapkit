"""
Email service — Resend API (primary) with SMTP fallback.
Set RESEND_API_KEY in Railway env vars to enable real email.
Set EMAIL_MOCK_MODE=true for local development (prints to console).
"""

import json
import os
import base64
from io import BytesIO
from typing import Optional
import httpx
import qrcode
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_NAME      = os.getenv("FROM_NAME", "ZapKit")
# Resend free tier requires onboarding@resend.dev until you verify a domain
FROM_EMAIL     = "onboarding@resend.dev"

MOCK_MODE = os.getenv("EMAIL_MOCK_MODE", "true").lower() == "true"


# ── QR helper ────────────────────────────────────────────────────────────────

def generate_qr_code(data: str) -> str:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# ── Resend sender ─────────────────────────────────────────────────────────────

async def _send_resend(to_email: str, subject: str, html_body: str) -> bool:
    if not RESEND_API_KEY:
        print("❌ RESEND_API_KEY not set — email not sent.")
        return False

    payload = {
        "from":    f"{FROM_NAME} <{FROM_EMAIL}>",
        "to":      [to_email],
        "subject": subject,
        "html":    html_body,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                json=payload,
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            )
        ok = resp.status_code in (200, 201)
        if ok:
            print(f"✅ Email sent via Resend to {to_email}")
        else:
            print(f"❌ Resend HTTP {resp.status_code}: {resp.text}")
        return ok
    except Exception as e:
        print(f"❌ Resend error: {e}")
        return False


# ── Password reset email ──────────────────────────────────────────────────────

async def send_password_reset_email(
    to_email: str,
    verification_code: str,
    reset_token: str,
    expires_in_minutes: int = 15,
) -> tuple[bool, Optional[str]]:

    qr_code_data = generate_qr_code(f"ZAPKIT-RESET:{verification_code}")
    subject      = "Password Reset - ZapKit"

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body      {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
    .wrap     {{ max-width: 560px; margin: 40px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.10); }}
    .header   {{ background: linear-gradient(135deg,#0f172a,#1e293b); color:#fff; padding: 36px 32px; text-align:center; }}
    .header h1{{ margin: 0 0 6px; font-size: 22px; }}
    .header p {{ margin: 0; font-size: 13px; opacity: .7; }}
    .body     {{ background: #f8fafc; padding: 32px; }}
    .code-box {{ background: #fff; border: 2px dashed #00C4A7; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }}
    .code     {{ font-size: 38px; font-weight: 800; color: #00C4A7; letter-spacing: 8px; }}
    .expire   {{ font-size: 12px; color: #94a3b8; margin: 6px 0 0; }}
    .warning  {{ background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 16px; margin: 20px 0; font-size: 13px; }}
    .footer   {{ text-align: center; color: #94a3b8; font-size: 11px; padding: 20px 32px; background: #f1f5f9; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Password Reset Request</h1>
      <p>ZapKit &mdash; Free Digital Tools</p>
    </div>
    <div class="body">
      <p>Hello,</p>
      <p>We received a request to reset your ZapKit password. Enter the code below to continue:</p>

      <div class="code-box">
        <div style="font-size:13px;color:#64748b;margin-bottom:8px;">Your Verification Code</div>
        <div class="code">{verification_code}</div>
        <div class="expire">Valid for {expires_in_minutes} minutes</div>
      </div>

      <div class="warning">
        <strong>Security notice:</strong> Never share this code with anyone.
        If you didn&rsquo;t request a password reset, simply ignore this email &mdash; your account is safe.
      </div>

      <p style="margin-top:28px;">Best regards,<br><strong>The ZapKit Team</strong></p>
    </div>
    <div class="footer">
      &copy; {2025} ZapKit &nbsp;&bull;&nbsp; This is an automated message, please do not reply.
    </div>
  </div>
</body>
</html>
"""

    if MOCK_MODE:
        print("\n" + "=" * 70)
        print("📧  MOCK EMAIL — Password Reset")
        print(f"    To:   {to_email}")
        print(f"    Code: {verification_code}  (expires in {expires_in_minutes} min)")
        print("=" * 70 + "\n")
        return True, qr_code_data

    ok = await _send_resend(to_email, subject, html_body)
    return ok, qr_code_data


# ── Welcome email ─────────────────────────────────────────────────────────────

async def send_welcome_email(to_email: str, name: Optional[str] = None) -> bool:
    display_name = name or to_email.split("@")[0]
    subject      = "Welcome to ZapKit!"

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body    {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
    .wrap   {{ max-width: 560px; margin: 40px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.10); }}
    .header {{ background: linear-gradient(135deg,#00C4A7,#00B096); color:#fff; padding: 40px 32px; text-align:center; }}
    .header h1 {{ margin: 0 0 6px; font-size: 24px; }}
    .header p  {{ margin: 0; opacity: .85; font-size: 13px; }}
    .body   {{ background: #f8fafc; padding: 32px; }}
    .feat   {{ background:#fff; border-left: 4px solid #00C4A7; border-radius: 8px; padding: 14px 16px; margin: 10px 0; font-size: 14px; }}
    .btn    {{ display:inline-block; background:#00C4A7; color:#fff; padding: 12px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 20px 0; }}
    .footer {{ text-align:center; color:#94a3b8; font-size:11px; padding: 20px 32px; background:#f1f5f9; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Welcome to ZapKit!</h1>
      <p>Your free digital tools suite</p>
    </div>
    <div class="body">
      <p>Hi {display_name},</p>
      <p>Thanks for joining ZapKit! Here&rsquo;s what you can do:</p>

      <div class="feat"><strong>TinyLink Pro</strong> &mdash; Shorten URLs &amp; track clicks in real time</div>
      <div class="feat"><strong>QR Generator Pro</strong> &mdash; Create custom QR codes for any purpose</div>
      <div class="feat"><strong>Analytics Dashboard</strong> &mdash; Monitor all your links &amp; QR codes in one place</div>

      <p style="text-align:center;">
        <a href="https://zapkit2.netlify.app" class="btn">Get Started</a>
      </p>

      <p>Best regards,<br><strong>The ZapKit Team</strong></p>
    </div>
    <div class="footer">
      &copy; 2025 ZapKit &nbsp;&bull;&nbsp; This is an automated message, please do not reply.
    </div>
  </div>
</body>
</html>
"""

    if MOCK_MODE:
        print("\n" + "=" * 70)
        print("📧  MOCK EMAIL — Welcome")
        print(f"    To: {to_email}")
        print("=" * 70 + "\n")
        return True

    return await _send_resend(to_email, subject, html_body)
