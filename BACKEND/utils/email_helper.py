"""
Email Helper
Sends transactional email (currently just password resets) via SMTP.

Degrades gracefully when SMTP isn't configured: logs the message instead of
raising, so local/dev environments (and any deploy that hasn't set real SMTP
credentials yet) never crash a request over this being unset — same pattern
used for the WhatsApp Business API integration elsewhere in this app.
"""

import os
import smtplib
from email.mime.text import MIMEText
from flask import current_app

PLACEHOLDER_VALUES = {'', 'your-email@gmail.com', 'your-app-password'}


def _smtp_configured():
    server = os.getenv('SMTP_SERVER', '').strip()
    email = os.getenv('SMTP_EMAIL', '').strip()
    password = os.getenv('SMTP_PASSWORD', '').strip()
    return bool(server) and email not in PLACEHOLDER_VALUES and password not in PLACEHOLDER_VALUES


def send_email(to_email, subject, body):
    """
    Send a plain-text email. Returns True if actually sent, False if SMTP
    isn't configured or sending failed (never raises — callers should treat
    this as best-effort, matching how WhatsApp notification failures are
    handled elsewhere).
    """
    if not _smtp_configured():
        current_app.logger.warning(
            f"SMTP not configured — would have emailed '{subject}' to {to_email}:\n{body}"
        )
        return False

    try:
        smtp_server = os.getenv('SMTP_SERVER')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_email = os.getenv('SMTP_EMAIL')
        smtp_password = os.getenv('SMTP_PASSWORD')

        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = smtp_email
        msg['To'] = to_email

        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, [to_email], msg.as_string())
        return True
    except Exception as e:
        current_app.logger.exception(f"Failed to send email to {to_email}: {e}")
        return False
