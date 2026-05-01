"""
Dynamic SMTP Email Backend
--------------------------
Reads SMTP settings from PlatformSettings (DB) at each send, 
falling back to .env / Django settings if the DB fields are empty.

This means you can update the email config from the Admin UI
without restarting the server.
"""
from django.core.mail.backends.smtp import EmailBackend as SMTPBackend


class DynamicSMTPEmailBackend(SMTPBackend):
    def __init__(self, *args, **kwargs):
        try:
            from core.models import PlatformSettings
            cfg = PlatformSettings.load().get_email_config()
        except Exception:
            cfg = {}

        # Override SMTP params from DB config (fall through to Django defaults if empty)
        kwargs.setdefault('host',     cfg.get('host'))
        kwargs.setdefault('port',     cfg.get('port'))
        kwargs.setdefault('username', cfg.get('username'))
        kwargs.setdefault('password', cfg.get('password'))
        kwargs.setdefault('use_tls',  cfg.get('use_tls'))

        super().__init__(*args, **kwargs)
