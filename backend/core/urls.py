from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, TrainerViewSet, ZoomSessionViewSet, MessageViewSet,
    AuthLoginView, AuthLogoutView, AuthMeView, UserViewSet, PaymentViewSet,
    PlatformSettingsView, CreateStripeCheckoutSessionView, PrepareStripeCheckoutView,
    RecordPaymentView, ConfirmStripeCheckoutSessionView, StripeWebhookView, TestEmailView,
    NotificationViewSet, ChangePasswordView, DeleteAccountView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'students', StudentViewSet)
router.register(r'trainers', TrainerViewSet)
router.register(r'zoom-sessions', ZoomSessionViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('auth/login/', AuthLoginView.as_view(), name='auth_login'),
    path('auth/logout/', AuthLogoutView.as_view(), name='auth_logout'),
    path('auth/me/', AuthMeView.as_view(), name='auth_me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/delete-account/', DeleteAccountView.as_view(), name='delete_account'),
    path('platform/settings/', PlatformSettingsView.as_view(), name='platform_settings'),
    # Primary Stripe session creation (server-side, official Stripe architecture)
    path('create-checkout-session/', CreateStripeCheckoutSessionView.as_view(), name='create_checkout_session'),
    path('prepare-checkout/', PrepareStripeCheckoutView.as_view(), name='prepare_checkout'),  # alias
    path('record-payment/', RecordPaymentView.as_view(), name='record_payment'),
    # Confirmation & webhook
    path('confirm-checkout-session/', ConfirmStripeCheckoutSessionView.as_view(), name='confirm_checkout_session'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe_webhook'),
    # Email
    path('test-email/', TestEmailView.as_view(), name='test_email'),
    path('', include(router.urls)),
]
