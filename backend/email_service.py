"""
Email service for sending verification codes and notifications
Supports both real email (SMTP) and mock mode for development
"""

import os
import base64
from io import BytesIO
from typing import Optional
import qrcode
from dotenv import load_dotenv

load_dotenv()

# Email configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@zapkit.com")
FROM_NAME = os.getenv("FROM_NAME", "ZapKit")

# Mock mode for development
MOCK_MODE = os.getenv("EMAIL_MOCK_MODE", "true").lower() == "true"


def generate_qr_code(data: str) -> str:
    """
    Generate QR code image as base64 string
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


async def send_password_reset_email(
    to_email: str,
    verification_code: str,
    reset_token: str,
    expires_in_minutes: int = 15
) -> tuple[bool, Optional[str]]:
    """
    Send password reset email with verification code
    Returns: (success, qr_code_data)
    """
    
    # Generate QR code with the verification code
    qr_data = f"ZAPKIT-RESET:{verification_code}"
    qr_code_data = generate_qr_code(qr_data)
    
    subject = "Password Reset - ZapKit"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
            .code-box {{ background: white; border: 2px dashed #00C4A7; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }}
            .code {{ font-size: 32px; font-weight: bold; color: #00C4A7; letter-spacing: 5px; }}
            .qr-section {{ background: white; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }}
            .button {{ display: inline-block; background: #00C4A7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 0; }}
            .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }}
            .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p>ZapKit - Free Digital Tools</p>
            </div>
            
            <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset your password. Use the verification code below to complete the process:</p>
                
                <div class="code-box">
                    <p style="margin: 0; font-size: 14px; color: #64748b;">Your Verification Code</p>
                    <div class="code">{verification_code}</div>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">Valid for {expires_in_minutes} minutes</p>
                </div>
                
                <div class="qr-section">
                    <p style="margin: 0 0 15px 0; font-weight: bold;">📱 Can't receive email?</p>
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #64748b;">Scan this QR code with your phone:</p>
                    <img src="{qr_code_data}" alt="QR Code" style="max-width: 200px; border: 2px solid #e2e8f0; border-radius: 10px; padding: 10px;">
                    <p style="margin: 15px 0 0 0; font-size: 12px; color: #64748b;">The QR code contains your verification code</p>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                        <li>Never share this code with anyone</li>
                        <li>ZapKit will never ask for your password via email</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>This code expires in {expires_in_minutes} minutes</li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px;">If you have any questions, please contact our support team.</p>
                
                <p style="margin-top: 20px;">
                    Best regards,<br>
                    <strong>The ZapKit Team</strong>
                </p>
            </div>
            
            <div class="footer">
                <p>© {2024} ZapKit. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    if MOCK_MODE:
        # Mock mode - just print to console
        print("\n" + "="*80)
        print("📧 MOCK EMAIL - Password Reset")
        print("="*80)
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Verification Code: {verification_code}")
        print(f"Reset Token: {reset_token}")
        print(f"Expires in: {expires_in_minutes} minutes")
        print(f"QR Code: Generated (base64 data available)")
        print("="*80 + "\n")
        return True, qr_code_data
    
    # Real email sending
    return await _send_smtp(to_email, subject, html_body), qr_code_data


async def send_welcome_email(to_email: str, name: Optional[str] = None) -> bool:
    """
    Send welcome email to new users
    """
    display_name = name or to_email.split('@')[0]
    
    subject = "Welcome to ZapKit!"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #00C4A7 0%, #00B096 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
            .feature {{ background: white; border-radius: 8px; padding: 15px; margin: 10px 0; border-left: 4px solid #00C4A7; }}
            .button {{ display: inline-block; background: #00C4A7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚡ Welcome to ZapKit!</h1>
                <p>Your free digital tools suite</p>
            </div>
            
            <div class="content">
                <p>Hi {display_name},</p>
                <p>Thank you for joining ZapKit! You now have access to powerful tools for managing your links and QR codes.</p>
                
                <h3>🚀 What you can do:</h3>
                
                <div class="feature">
                    <strong>🔗 TinyLink Pro</strong><br>
                    Shorten URLs, track clicks, and analyze your audience
                </div>
                
                <div class="feature">
                    <strong>📱 QR Generator Pro</strong><br>
                    Create custom QR codes for any purpose
                </div>
                
                <div class="feature">
                    <strong>📊 Unified Dashboard</strong><br>
                    Monitor all your links and QR codes in one place
                </div>
                
                <p style="text-align: center;">
                    <a href="http://localhost:8080" class="button">Get Started →</a>
                </p>
                
                <p style="margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>
                
                <p>
                    Best regards,<br>
                    <strong>The ZapKit Team</strong>
                </p>
            </div>
            
            <div class="footer">
                <p>© 2024 ZapKit. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    if MOCK_MODE:
        print("\n" + "="*80)
        print("📧 MOCK EMAIL - Welcome")
        print("="*80)
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print("="*80 + "\n")
        return True
    
    # Real email sending
    return await _send_smtp(to_email, subject, html_body)


async def _send_smtp(to_email: str, subject: str, html_body: str) -> bool:
    """Send via SMTP — supports both STARTTLS (port 587) and SSL (port 465)."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    if not SMTP_USER or not SMTP_PASSWORD:
        print("❌ SMTP credentials not configured (SMTP_USER / SMTP_PASSWORD missing)")
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html'))

    try:
        if SMTP_PORT == 465:
            import ssl
            ctx = ssl.create_default_context()
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False
