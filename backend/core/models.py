from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        TRAINER = 'trainer', _('Trainer')
        STUDENT = 'student', _('Student')

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.username})"

class TrainerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='trainer_profile')
    specialty = models.CharField(max_length=100, blank=True, null=True)
    raw_password = models.CharField(max_length=128, blank=True, null=True)

    def __str__(self):
        return f"Trainer: {self.user.username}"

class StudentProfile(models.Model):
    class StudentStatus(models.TextChoices):
        KBIS = 'KBIS', _('KBIS')
        CIRE = 'CIRE', _('CIRE')
        FOURNISSEUR = 'fournisseur', _('Fournisseur')
        SITE = 'site', _('Site')
        FORMATION = 'formation', _('Formation')
        TERMINE = 'termine', _('Terminé')

    class PaymentStatus(models.TextChoices):
        OK = 'OK', _('Réglé')
        MISSED = 'missed', _('En attente')
        OVERDUE = 'overdue', _('En retard')

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    trainer = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='assigned_students', null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=StudentStatus.choices, default=StudentStatus.KBIS)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.OK)
    kbis_file = models.FileField(upload_to='kbis/', null=True, blank=True)
    
    phone = models.CharField(max_length=20, blank=True, null=True)
    instalment2_paid = models.BooleanField(default=False)
    total_due = models.DecimalField(max_digits=10, decimal_places=2, default=960.00)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    next_due_date = models.DateField(null=True, blank=True)
    next_zoom_date = models.DateTimeField(null=True, blank=True)
    last_interaction = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    raw_password = models.CharField(max_length=128, blank=True, null=True)
    
    # Fields from landing page diagnostic
    has_business = models.CharField(max_length=100, blank=True, null=True)
    current_offer = models.TextField(blank=True, null=True)
    monthly_revenue = models.CharField(max_length=100, blank=True, null=True)
    challenges = models.TextField(blank=True, null=True) # Stored as comma-separated or JSON

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_status = self.status

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        status_changed = not is_new and self.status != self._original_status
        
        super().save(*args, **kwargs)
        
        if status_changed:
            self.send_status_notification()
            self._original_status = self.status

    def send_status_notification(self):
        from .models import Notification
        from .email_templates import step_completed_email
        from django.core.mail import EmailMultiAlternatives
        from django.conf import settings

        status_label = dict(self.StudentStatus.choices).get(self.status, self.status)
        
        # 1. Create In-App Notification
        Notification.objects.create(
            user=self.user,
            title="Étape validée ! 🎉",
            message=f"Félicitations ! Votre formateur a validé l'étape : {status_label}.",
            type='success'
        )

        # 2. Send Email
        try:
            platform_settings = PlatformSettings.load()
            cfg = platform_settings.get_email_config()
            from_email = cfg.get('from_email') or cfg.get('username') or settings.DEFAULT_FROM_EMAIL
            
            subject, html_body = step_completed_email(
                receiver_first_name=self.user.first_name or self.user.username,
                step_label=status_label
            )

            msg = EmailMultiAlternatives(
                subject=subject,
                body=f"Félicitations ! Étape validée : {status_label}",
                from_email=from_email,
                to=[self.user.email]
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=True)
        except Exception as e:
            print(f"[StudentProfile] Error sending status email: {e}")

    def __str__(self):
        return f"Student: {self.user.username}"

class ZoomSession(models.Model):
    title = models.CharField(max_length=200)
    date = models.DateField()
    time = models.TimeField()
    link = models.URLField()
    trainer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='zoom_sessions')
    students = models.ManyToManyField(User, related_name='attended_sessions')
    is_recurring = models.BooleanField(default=False)
    recurrence_rule = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.date}"

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    subject = models.CharField(max_length=255)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    def __str__(self):
        return f"From {self.sender.username} To {self.receiver.username} - {self.subject}"

class Payment(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(auto_now_add=True)
    method = models.CharField(max_length=50, default='Virement')
    reference = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Payment {self.amount}€ for {self.student.user.username} on {self.date}"

class PlatformSettings(models.Model):
    STRIPE_MODE_CHOICES = [
        ('test', 'Sandbox (Test)'),
        ('live', 'Production (Live)'),
    ]

    default_total_due = models.DecimalField(max_digits=10, decimal_places=2, default=960.00)
    default_due_date = models.DateField(null=True, blank=True, help_text='Date d’échéance globale par défaut pour tous les clients')
    site_name = models.CharField(max_length=100, default="Be-Free E-commerce")
    contact_email = models.EmailField(default="contact@befree.fr")
    contact_phone = models.CharField(max_length=20, default="+33 1 23 45 67 89")

    # Stripe Mode
    stripe_mode = models.CharField(max_length=10, choices=STRIPE_MODE_CHOICES, default='test')

    # Sandbox / Test keys
    stripe_public_key = models.CharField(max_length=255, blank=True, null=True, help_text='Clé publique Stripe TEST (pk_test_...)')
    stripe_secret_key = models.CharField(max_length=255, blank=True, null=True, help_text='Clé secrète Stripe TEST (sk_test_...)')
    stripe_webhook_secret = models.CharField(max_length=255, blank=True, null=True, help_text='Secret Webhook Stripe TEST (whsec_...)')

    # Production / Live keys
    stripe_public_key_live = models.CharField(max_length=255, blank=True, null=True, help_text='Clé publique Stripe LIVE (pk_live_...)')
    stripe_secret_key_live = models.CharField(max_length=255, blank=True, null=True, help_text='Clé secrète Stripe LIVE (sk_live_...)')
    stripe_webhook_secret_live = models.CharField(max_length=255, blank=True, null=True, help_text='Secret Webhook Stripe LIVE (whsec_...)')

    def get_active_stripe_keys(self):
        """Returns the correct Stripe key set based on the current mode."""
        import os
        from django.conf import settings as django_settings

        if self.stripe_mode == 'live':
            return {
                'public_key': self.stripe_public_key_live or os.environ.get('STRIPE_PUBLIC_KEY_LIVE', ''),
                'secret_key': self.stripe_secret_key_live or os.environ.get('STRIPE_SECRET_KEY_LIVE', ''),
                'webhook_secret': self.stripe_webhook_secret_live or os.environ.get('STRIPE_WEBHOOK_SECRET_LIVE', ''),
                'mode': 'live',
            }
        else:
            return {
                'public_key': self.stripe_public_key or os.environ.get('STRIPE_PUBLIC_KEY', getattr(django_settings, 'STRIPE_PUBLIC_KEY', '')),
                'secret_key': self.stripe_secret_key or os.environ.get('STRIPE_SECRET_KEY', getattr(django_settings, 'STRIPE_SECRET_KEY', '')),
                'webhook_secret': self.stripe_webhook_secret or os.environ.get('STRIPE_WEBHOOK_SECRET', getattr(django_settings, 'STRIPE_WEBHOOK_SECRET', '')),
                'mode': 'test',
            }

    # --- Email / SMTP Configuration ---
    email_host = models.CharField(max_length=255, blank=True, null=True, help_text='Ex: smtp.gmail.com')
    email_port = models.PositiveIntegerField(null=True, blank=True, help_text='Ex: 587')
    email_use_tls = models.BooleanField(null=True, blank=True, help_text='Activer TLS (recommandé)')
    email_host_user = models.EmailField(blank=True, null=True, help_text="Adresse e-mail d'expédition")
    email_host_password = models.CharField(max_length=255, blank=True, null=True, help_text='Mot de passe ou App Password Google')
    default_from_email = models.CharField(max_length=255, blank=True, null=True, help_text='Ex: Be-Free <no-reply@befree.fr>')

    def get_email_config(self):
        """Returns active SMTP config, falling back to .env / Django settings if DB is empty."""
        import os
        from django.conf import settings as dj
        return {
            'host':       self.email_host         or os.environ.get('EMAIL_HOST',          getattr(dj, 'EMAIL_HOST',          'smtp.gmail.com')),
            'port':       self.email_port          or int(os.environ.get('EMAIL_PORT',      getattr(dj, 'EMAIL_PORT',          587))),
            'use_tls':    self.email_use_tls       if self.email_use_tls is not None
                          else (os.environ.get('EMAIL_USE_TLS', str(getattr(dj, 'EMAIL_USE_TLS', True))).lower() == 'true'),
            'username':   self.email_host_user     or os.environ.get('EMAIL_HOST_USER',     getattr(dj, 'EMAIL_HOST_USER',     '')),
            'password':   self.email_host_password or os.environ.get('EMAIL_HOST_PASSWORD', getattr(dj, 'EMAIL_HOST_PASSWORD', '')),
            'from_email': self.default_from_email  or os.environ.get('DEFAULT_FROM_EMAIL',  getattr(dj, 'DEFAULT_FROM_EMAIL',  '')),
        }

    def save(self, *args, **kwargs):
        self.pk = 1
        super(PlatformSettings, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"Platform Settings (Stripe: {self.stripe_mode})"
class Notification(models.Model):
    class NotificationType(models.TextChoices):
        INFO = 'info', _('Info')
        SUCCESS = 'success', _('Success')
        WARNING = 'warning', _('Warning')
        ERROR = 'error', _('Error')
        MESSAGE = 'message', _('Message')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.INFO)
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"
