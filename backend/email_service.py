"""
Email service — SMTP (Gmail or any provider).
Set EMAIL_MOCK_MODE=true for local development (prints code to console).

Required env vars for production (Railway):
  EMAIL_MOCK_MODE=false
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-gmail@gmail.com
  SMTP_PASS=your-16-char-app-password  (Gmail → Account → Security → App Passwords)
"""

import asyncio
import base64
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from io import BytesIO
from typing import Optional

import qrcode
from dotenv import load_dotenv

load_dotenv()

MOCK_MODE  = os.getenv("EMAIL_MOCK_MODE", "true").lower() == "true"
SMTP_HOST  = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT  = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER  = os.getenv("SMTP_USER", "")
SMTP_PASS  = os.getenv("SMTP_PASS", "")
FROM_NAME  = os.getenv("FROM_NAME", "ZapKit")


# ── QR helper ────────────────────────────────────────────────────────────────

def generate_qr_code(data: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# ── SMTP sender ───────────────────────────────────────────────────────────────

async def _send_smtp(to_email: str, subject: str, html_body: str) -> bool:
    if not SMTP_USER or not SMTP_PASS:
        print("❌ SMTP_USER / SMTP_PASS not set — email not sent.")
        return False

    def _do_send() -> bool:
        try:
            msg = MIMEMultipart("alternative")
            msg["From"]    = f"{FROM_NAME} <{SMTP_USER}>"
            msg["To"]      = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SMTP_USER, to_email, msg.as_string())

            print(f"✅ Email sent via SMTP to {to_email}")
            return True
        except Exception as exc:
            print(f"❌ SMTP error: {exc}")
            return False

    # Run blocking smtplib call in a thread so we don't block the event loop
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _do_send)


# ── Password reset email ──────────────────────────────────────────────────────

async def send_password_reset_email(
    to_email: str,
    verification_code: str,
    reset_token: str,
    expires_in_minutes: int = 15,
) -> tuple[bool, Optional[str]]:

    qr_code_data = generate_qr_code(f"ZAPKIT-RESET:{verification_code}")
    subject      = "Your ZapKit Verification Code"

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body      {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f1f5f9; }}
    .wrap     {{ max-width: 560px; margin: 40px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.10); background: #fff; }}
    .header   {{ background: linear-gradient(135deg,#0f172a,#1e293b); color:#fff; padding: 36px 32px; text-align:center; }}
    .header h1{{ margin: 0 0 6px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }}
    .header p {{ margin: 0; font-size: 13px; opacity: .65; }}
    .body     {{ padding: 32px; }}
    .code-box {{ background: #f8fafc; border: 2px dashed #00C4A7; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }}
    .code     {{ font-size: 42px; font-weight: 900; color: #00C4A7; letter-spacing: 10px; font-family: monospace; }}
    .expire   {{ font-size: 12px; color: #94a3b8; margin: 8px 0 0; }}
    .warning  {{ background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #92400e; }}
    .footer   {{ text-align: center; color: #94a3b8; font-size: 11px; padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Password Reset</h1>
      <p>ZapKit - Free Digital Tools</p>
    </div>
    <div class="body">
      <p>Hi there,</p>
      <p>We received a request to reset your ZapKit password. Use the code below to continue:</p>

      <div class="code-box">
        <div style="font-size:12px;color:#64748b;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">Your Verification Code</div>
        <div class="code">{verification_code}</div>
        <div class="expire">Valid for {expires_in_minutes} minutes</div>
      </div>

      <div class="warning">
        <strong>Security notice:</strong> Never share this code with anyone. If you didn't request a password reset, you can safely ignore this email.
      </div>

      <p style="margin-top:28px;color:#64748b;font-size:14px;">Best regards,<br><strong style="color:#0f172a;">The ZapKit Team</strong></p>
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
        print("📧  MOCK EMAIL — Password Reset")
        print(f"    To:   {to_email}")
        print(f"    Code: {verification_code}  (expires in {expires_in_minutes} min)")
        print("=" * 70 + "\n")
        return True, qr_code_data

    ok = await _send_smtp(to_email, subject, html_body)
    return ok, qr_code_data


# ── Welcome email ─────────────────────────────────────────────────────────────

async def send_welcome_email(to_email: str, name: Optional[str] = None) -> bool:
    display_name = name or to_email.split("@")[0]
    subject      = f"Welcome to ZapKit, {display_name}!"

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body    {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f1f5f9; }}
    .wrap   {{ max-width: 560px; margin: 40px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.10); background: #fff; }}
    .header {{ background: linear-gradient(135deg,#00C4A7,#00B096); color:#fff; padding: 40px 32px; text-align:center; }}
    .header h1 {{ margin: 0 0 6px; font-size: 24px; font-weight: 800; }}
    .header p  {{ margin: 0; opacity: .85; font-size: 13px; }}
    .body   {{ padding: 32px; }}
    .feat   {{ background:#f8fafc; border-left: 4px solid #00C4A7; border-radius: 8px; padding: 14px 16px; margin: 10px 0; font-size: 14px; }}
    .btn    {{ display:inline-block; background:#00C4A7; color:#fff; padding: 12px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 20px 0; }}
    .footer {{ text-align:center; color:#94a3b8; font-size:11px; padding: 20px 32px; background:#f8fafc; border-top: 1px solid #e2e8f0; }}
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
      <p>Thanks for joining ZapKit! Here's what you can do:</p>

      <div class="feat"><strong>TinyLink Pro</strong> - Shorten URLs &amp; track clicks in real time</div>
      <div class="feat"><strong>QR Generator Pro</strong> - Create custom QR codes for any purpose</div>
      <div class="feat"><strong>Analytics Dashboard</strong> - Monitor all your links &amp; QR codes in one place</div>

      <p style="text-align:center;">
        <a href="https://zapkit2.netlify.app" class="btn">Get Started</a>
      </p>

      <p style="color:#64748b;font-size:14px;">Best regards,<br><strong style="color:#0f172a;">The ZapKit Team</strong></p>
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

    return await _send_smtp(to_email, subject, html_body)
