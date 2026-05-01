import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from core.models import PlatformSettings
from django.core.mail import EmailMultiAlternatives

cfg = PlatformSettings.load().get_email_config()
print("Email Config:", cfg)

msg = EmailMultiAlternatives(
    subject="Test SMTP",
    body="This is a test message to verify SMTP.",
    from_email=cfg.get('from_email') or cfg.get('username') or 'test@example.com',
    to=['test@example.com'],
)
try:
    msg.send(fail_silently=False)
    print("Email sent successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
