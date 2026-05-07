import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_smtp(to_email: str, subject: str, html: str) -> None:
    """Blocking SMTP send — run via asyncio.to_thread."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"KalaSetu <{settings.EMAIL_SENDER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(settings.EMAIL_SENDER, settings.EMAIL_PASSWORD)
        server.sendmail(settings.EMAIL_SENDER, to_email, msg.as_string())


async def send_welcome_email(name: str, to_email: str) -> None:
    if not settings.EMAIL_SENDER or not settings.EMAIL_PASSWORD:
        logger.warning("Email not configured — skipping welcome email to %s", to_email)
        return

    first_name = name.split()[0] if name else "there"
    html = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#7c3aed;padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">
                🎨 KalaSetu
              </h1>
              <p style="margin:8px 0 0;color:#ede9fe;font-size:14px;">India's Art Marketplace</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#18181b;font-size:22px;font-weight:700;">
                Welcome, {first_name}! 🙏
              </h2>
              <p style="margin:0 0 20px;color:#52525b;font-size:15px;line-height:1.6;">
                Your KalaSetu account is ready. You can now explore and collect authentic Indian
                artworks — from Madhubani to Warli, Pattachitra to Phad.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="background:#7c3aed;border-radius:8px;">
                    <a href="http://localhost:3001/marketplace"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                      Explore Paintings →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;">
                Questions? Just reply to this email — we're happy to help.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f0f0f0;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                © 2026 KalaSetu · Celebrating Indian Art
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    try:
        await asyncio.to_thread(_send_smtp, to_email, "Welcome to KalaSetu 🎨", html)
        logger.info("Welcome email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send welcome email to %s: %s", to_email, e)
