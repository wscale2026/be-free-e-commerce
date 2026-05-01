from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework.authentication import SessionAuthentication
from decimal import Decimal
from django.db import transaction
from .models import User, TrainerProfile, StudentProfile, ZoomSession, Message, Payment, PlatformSettings, Notification
from .serializers import (
    UserSerializer, TrainerProfileSerializer, StudentProfileSerializer, 
    ZoomSessionSerializer, MessageSerializer, LoginSerializer, PaymentSerializer, 
    PlatformSettingsSerializer, NotificationSerializer
)

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # Do not enforce CSRF

@method_decorator(csrf_exempt, name='dispatch')
class NotificationViewSet(viewsets.ModelViewSet):
    authentication_classes = [CsrfExemptSessionAuthentication]
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Notification.objects.filter(user=user).order_by('-created_at')
        return Notification.objects.none()

    def perform_create(self, serializer):
        # Allow creating notifications for other users if admin, or for self
        serializer.save()

import os
import stripe
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


@method_decorator(csrf_exempt, name='dispatch')
class AuthLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        login(request, user)
        return Response({
            "user": UserSerializer(user).data
        })

@method_decorator(csrf_exempt, name='dispatch')
class AuthLogoutView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logout(request)
        return Response({"success": True})

class AuthMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(UserSerializer(request.user).data)

@method_decorator(csrf_exempt, name='dispatch')
class ChangePasswordView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            user = request.user
            current_password = request.data.get('current_password')
            new_password = request.data.get('new_password')

            if not user.check_password(current_password):
                return Response({"error": "L'ancien mot de passe est incorrect."}, status=400)

            if not new_password or len(new_password) < 6:
                return Response({"error": "Le nouveau mot de passe doit contenir au moins 6 caractères."}, status=400)

            user.set_password(new_password)
            user.save()

            # Update StudentProfile raw_password if exists (for display in admin)
            if hasattr(user, 'student_profile'):
                try:
                    user.student_profile.raw_password = new_password
                    user.student_profile.save(update_fields=['raw_password'])
                except:
                    pass
            elif hasattr(user, 'trainer_profile'):
                try:
                    user.trainer_profile.raw_password = new_password
                    user.trainer_profile.save(update_fields=['raw_password'])
                except:
                    pass

            return Response({"success": "Mot de passe mis à jour avec succès."})
        except Exception as e:
            return Response({"error": f"Erreur serveur: {str(e)}"}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class DeleteAccountView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        password = request.data.get('password')

        if not user.check_password(password):
            return Response({"error": "Le mot de passe est incorrect."}, status=400)

        with transaction.atomic():
            # Delete User (Cascade will handle StudentProfile/TrainerProfile etc.)
            user.delete()

        return Response({"success": "Compte supprimé avec succès."})

@method_decorator(csrf_exempt, name='dispatch')
class UserViewSet(viewsets.ModelViewSet):
    authentication_classes = [CsrfExemptSessionAuthentication]
    serializer_class = UserSerializer

    # permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admin list excluding our hidden root superuser
        return User.objects.filter(role='admin').exclude(username='admin')

    def perform_create(self, serializer):
        serializer.save(role='admin', is_staff=True)

    def perform_destroy(self, instance):
        if instance.username == 'admin' or instance.is_superuser:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cet administrateur système ne peut pas être supprimé.")
        instance.delete()

@method_decorator(csrf_exempt, name='dispatch')
class StudentViewSet(viewsets.ModelViewSet):
    authentication_classes = [CsrfExemptSessionAuthentication]
    queryset = StudentProfile.objects.all()

    serializer_class = StudentProfileSerializer
    # permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance):
        from django.db import transaction
        try:
            with transaction.atomic():
                user = instance.user
                # CASCADE handles payments automatically, but we ensure the User is gone
                user.delete()
        except Exception as e:
            from rest_framework.exceptions import APIException
            raise APIException(f"Détails de l'erreur: {str(e)}")

@method_decorator(csrf_exempt, name='dispatch')
class TrainerViewSet(viewsets.ModelViewSet):
    authentication_classes = [CsrfExemptSessionAuthentication]
    queryset = TrainerProfile.objects.all()

    serializer_class = TrainerProfileSerializer
    # permission_classes = [permissions.IsAuthenticated]

@method_decorator(csrf_exempt, name='dispatch')
class ZoomSessionViewSet(viewsets.ModelViewSet):
    authentication_classes = [CsrfExemptSessionAuthentication]
    queryset = ZoomSession.objects.all()

    serializer_class = ZoomSessionSerializer
    # permission_classes = [permissions.IsAuthenticated]

@method_decorator(csrf_exempt, name='dispatch')
class MessageViewSet(viewsets.ModelViewSet):
    authentication_classes = [CsrfExemptSessionAuthentication]
    queryset = Message.objects.all()

    serializer_class = MessageSerializer
    # permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Allow filtering messages by target/sender via query params if needed
        # Or showing only messages for current user
        # user = self.request.user
        # return Message.objects.filter(models.Q(sender=user) | models.Q(receiver=user))
        return super().get_queryset()

    def perform_create(self, serializer):
        message = serializer.save()
        try:
            from django.core.mail import send_mail
            from .email_templates import new_message_email

            sender   = message.sender
            receiver = message.receiver

            if not receiver.email:
                print(f"[MessageViewSet] Email non envoyé : l'utilisateur {receiver.username} n'a pas d'adresse e-mail configurée.")
                return

            # Detect sender role
            if hasattr(sender, 'student_profile'):
                role = "Étudiant"
            elif hasattr(sender, 'trainer_profile'):
                role = "Formateur"
            elif sender.is_staff or sender.is_superuser:
                role = "Administrateur"
            else:
                role = "Membre"

            platform_url = "http://localhost:5173"
            sender_name  = sender.get_full_name() or sender.username

            subject_line, html_body = new_message_email(
                receiver_first_name = receiver.first_name or receiver.username,
                sender_name         = sender_name,
                sender_role         = role,
                subject             = message.subject,
                body                = message.body,
                platform_url        = platform_url,
            )

            # Plain-text fallback for email clients that don't support HTML
            plain_body = (
                f"Bonjour {receiver.first_name or receiver.username},\n\n"
                f"Vous avez reçu un nouveau message de {sender_name} ({role}).\n\n"
                f"Sujet : {message.subject}\n\n"
                f"{message.body}\n\n"
                f"Connectez-vous sur la plateforme Be-Free pour y répondre.\n"
            )

            platform_settings = PlatformSettings.load()
            cfg = platform_settings.get_email_config()
            from_email = cfg.get('from_email') or cfg.get('username') or settings.DEFAULT_FROM_EMAIL

            from django.core.mail import EmailMultiAlternatives

            msg = EmailMultiAlternatives(
                subject=subject_line,
                body=plain_body,
                from_email=from_email,
                to=[receiver.email],
                reply_to=[sender.email] if sender.email else None
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=True)

        except Exception as e:
            print(f"[MessageViewSet] Failed to send email notification: {e}")


@method_decorator(csrf_exempt, name='dispatch')
class PaymentViewSet(viewsets.ModelViewSet):
    authentication_classes = [CsrfExemptSessionAuthentication]
    queryset = Payment.objects.all()

    serializer_class = PaymentSerializer
    # permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset.order_by('-date')

@method_decorator(csrf_exempt, name='dispatch')
class PlatformSettingsView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    # permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        settings = PlatformSettings.load()
        serializer = PlatformSettingsSerializer(settings)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        settings = PlatformSettings.load()
        serializer = PlatformSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            new_total = request.data.get('default_total_due')
            serializer.save()
            
            # Bulk update all students if total due or due date changed
            new_total = serializer.validated_data.get('default_total_due')
            new_due_date = serializer.validated_data.get('default_due_date')
            
            update_fields = {}
            if new_total:
                update_fields['total_due'] = new_total
            if new_due_date:
                update_fields['next_due_date'] = new_due_date
                
            if update_fields:
                StudentProfile.objects.all().update(**update_fields)
                
                # If total due changed, we might also want to recalculate payment_status for everyone
                if 'total_due' in update_fields:
                    for student in StudentProfile.objects.all():
                        if student.paid_amount >= student.total_due:
                            student.payment_status = 'OK'
                        else:
                            student.payment_status = 'missed'
                        student.save(update_fields=['payment_status'])
                    
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

def record_paid_stripe_checkout_session(session):
    # Ensure session is a dict-like object (it's usually a StripeObject)
    if hasattr(session, 'to_dict'):
        session_data = session.to_dict()
    else:
        session_data = session

    if session_data.get('payment_status') != 'paid':
        raise ValueError('Le paiement Stripe n’est pas encore confirmé.')

    session_id = session_data.get('id')
    metadata = session_data.get('metadata', {})
    student_id = metadata.get('student_id') or session_data.get('client_reference_id')
    amount_total = session_data.get('amount_total')

    if not session_id:
        raise ValueError('Identifiant de session Stripe introuvable.')
    if not amount_total:
        raise ValueError('Montant Stripe introuvable.')

    amount = Decimal(amount_total) / Decimal('100')
    reference = f"STRIPE_{session_id}"
    
    print(f"Recording Stripe Payment: Session={session_id}, Student={student_id}, Amount={amount}")

    # Standardize student_id (handle None, "None", empty strings)
    student_id_input = student_id # Save for email logic
    if student_id in [None, 'None', 'null', '']:
        student_id = None

    with transaction.atomic():
        if not student_id:
            # GUEST CHECKOUT - Create student now
            email = metadata.get('email')
            first_name = metadata.get('first_name', '')
            last_name = metadata.get('last_name', '')
            phone = metadata.get('phone', '')
            notes = metadata.get('notes', '')
            
            # Diagnostic fields
            has_business = ''
            current_offer = ''
            monthly_revenue = ''
            challenges = ''

            # Try to parse notes if it contains JSON from landing page
            if notes and notes.startswith('{'):
                try:
                    import json
                    diag = json.loads(notes)
                    if diag.get('landing_form_completed'):
                        has_business = diag.get('hasBusiness', '')
                        current_offer = diag.get('offre', '')
                        monthly_revenue = diag.get('ca', '')
                        challenges_list = diag.get('challenge', [])
                        challenges = ", ".join(challenges_list) if isinstance(challenges_list, list) else str(challenges_list)
                        # Make notes human readable for the profile
                        notes = f"Diagnostic Landing Page:\n- Business: {has_business}\n- CA: {monthly_revenue}\n- Offre: {current_offer}\n- Challenges: {challenges}"
                except Exception as e:
                    print(f"Error parsing landing notes: {e}")

            if not email:
                # Try to fallback to customer_details if metadata is missing
                customer_details = session_data.get('customer_details', {})
                email = customer_details.get('email')
                
            if not email:
                raise ValueError('Email manquant dans les données Stripe (metadata et customer_details). Impossible de créer le compte.')

            # Check if user already exists
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                # Generate username: [premier prenom].[premier nom]
                f_name = first_name.strip().split(' ')[0].lower() if first_name else 'cli'
                l_name = last_name.strip().split(' ')[0].lower() if last_name else 'befree'
                username = f"{f_name}.{l_name}"
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                password = 'Befree2026'
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    role='student'
                )
            
            # Create student profile if not exists
            student_profile, created_profile = StudentProfile.objects.get_or_create(
                user=user,
                defaults={
                    'phone': phone,
                    'notes': notes,
                    'has_business': has_business,
                    'current_offer': current_offer,
                    'monthly_revenue': monthly_revenue,
                    'challenges': challenges,
                    'total_due': Decimal('2000.00'),
                    'raw_password': 'Befree2026'
                }
            )
            student_id = student_profile.id
        else:
            try:
                student_profile = StudentProfile.objects.get(id=student_id)
            except (ValueError, StudentProfile.DoesNotExist):
                # Fallback to guest logic if student_id is invalid
                raise ValueError(f"ID client invalide: {student_id}")

        # Record payment
        payment, created = Payment.objects.get_or_create(
            reference=reference,
            defaults={
                'student': student_profile,
                'amount': amount,
                'method': 'Stripe',
            }
        )

        if created:
            student_profile.paid_amount = (student_profile.paid_amount or Decimal('0')) + amount
            student_profile.instalment2_paid = student_profile.paid_amount >= (student_profile.total_due * Decimal('0.5'))
            student_profile.payment_status = 'OK' if student_profile.paid_amount >= student_profile.total_due else 'missed'
            student_profile.save(update_fields=['paid_amount', 'instalment2_paid', 'payment_status'])

            # --- Email Notifications ---
            try:
                from django.core.mail import send_mail
                from django.conf import settings as django_settings
                from .email_templates import payment_confirmation_email, welcome_account_email
                
                platform_settings = PlatformSettings.load()
                cfg = platform_settings.get_email_config()
                from_email = cfg.get('from_email') or cfg.get('username') or getattr(django_settings, 'DEFAULT_FROM_EMAIL', '')

                student_user = student_profile.user
                if student_user.email:
                    # 1. Welcome Email (if it was a new account creation)
                    # We check if student_id_input was originally empty/None
                    if student_id_input in [None, 'None', 'null', '']:
                        subj, html = welcome_account_email(
                            receiver_first_name=student_user.first_name or student_user.username,
                            username=student_user.username,
                            password="Befree2026"
                        )
                        send_mail(subj, "", from_email, [student_user.email], html_message=html, fail_silently=True)

                    # 2. Payment Confirmation
                    subj, html = payment_confirmation_email(
                        receiver_first_name=student_user.first_name or student_user.username,
                        amount=float(amount),
                        method="Stripe",
                        reference=reference,
                        paid_total=float(student_profile.paid_amount),
                        total_due=float(student_profile.total_due)
                    )
                    send_mail(subj, "", from_email, [student_user.email], html_message=html, fail_silently=True)

            except Exception as e:
                print(f"Error sending Stripe confirmation emails: {e}")

    return payment, created


@method_decorator(csrf_exempt, name='dispatch')
class CreateStripeCheckoutSessionView(APIView):
    """
    Crée une vraie session Stripe Checkout côté serveur (architecture officielle).
    Pré-remplit email, nom et téléphone du client.
    """
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, *args, **kwargs):
        try:
            amount = request.data.get('amount')
            student_id = request.data.get('student_id')
            
            # Guest checkout data
            first_name = request.data.get('first_name')
            last_name = request.data.get('last_name')
            email = request.data.get('email')
            phone = request.data.get('phone')
            notes = request.data.get('notes')

            if not amount:
                return Response({'error': 'amount est requis'}, status=400)

            student_profile = None
            if student_id:
                student_profile = StudentProfile.objects.get(id=student_id)
            elif not (first_name and last_name and email):
                 return Response({'error': 'student_id ou (first_name, last_name, email) requis'}, status=400)

            amount_num = round(float(amount), 2)
            amount_in_cents = int(amount_num * 100)

            platform_settings = PlatformSettings.load()
            active_keys = platform_settings.get_active_stripe_keys()
            stripe.api_key = active_keys['secret_key']
            stripe_mode = active_keys['mode']

            if not active_keys['secret_key'] or not active_keys['public_key']:
                return Response({
                    'error': f'Clés Stripe ({stripe_mode.upper()}) non configurées.',
                    'stripe_unavailable': True,
                }, status=500)

            frontend_origin = request.headers.get('Origin') or 'http://localhost:5173'
            
            if student_profile:
                success_url = f"{frontend_origin}/payments?payment=success&session_id={{CHECKOUT_SESSION_ID}}&student_id={student_id}&amount={amount_num}"
                full_name = student_profile.user.get_full_name() or student_profile.user.username
                student_email = student_profile.user.email or None
            else:
                success_url = f"{frontend_origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&email={email}"
                full_name = f"{first_name} {last_name}"
                student_email = email

            cancel_url = f"{frontend_origin}/#hero-form" if not student_profile else f"{frontend_origin}/payments?payment=cancelled"

            # Build session params
            session_params = {
                'payment_method_types': ['card'],
                'line_items': [{
                    'price_data': {
                        'currency': 'eur',
                        'unit_amount': amount_in_cents,
                        'product_data': {
                            'name': f'Scolarité Be-Free — {full_name}',
                            'description': f'Règlement formation e-commerce · Mode {stripe_mode.upper()}',
                        },
                    },
                    'quantity': 1,
                }],
                'mode': 'payment',
                'success_url': success_url,
                'cancel_url': cancel_url,
                'client_reference_id': str(student_id),
                'metadata': {
                    'student_id': str(student_id) if student_id else '',
                    'email': email or '',
                    'first_name': first_name or '',
                    'last_name': last_name or '',
                    'phone': phone or '',
                    'notes': (notes or '')[:500],
                    'formation': request.data.get('formation', ''),
                    'frequence': request.data.get('frequence', ''),
                    'experience': request.data.get('experience', ''),
                },
                # Pre-fill customer info
                'billing_address_collection': 'auto',
                'phone_number_collection': {'enabled': True},
            }

            # Pre-fill email if available
            if student_email:
                session_params['customer_email'] = student_email

            checkout_session = stripe.checkout.Session.create(**session_params)

            return Response({
                'url': checkout_session.url,
                'session_id': checkout_session.id,
                'stripe_mode': stripe_mode,
            })

        except StudentProfile.DoesNotExist:
            return Response({'error': 'Client introuvable.'}, status=404)
        except stripe.error.AuthenticationError:
            return Response({
                'error': 'Clé Stripe invalide. Vérifiez vos paramètres.',
                'stripe_unavailable': True,
            }, status=500)
        except Exception as e:
            err_msg = str(e)
            is_network = any(k in err_msg.lower() for k in ['connection', 'network', 'resolve', 'timeout', 'refused'])
            return Response({
                'error': err_msg,
                'stripe_unavailable': is_network,
            }, status=500)


# Keep old route name as alias
PrepareStripeCheckoutView = CreateStripeCheckoutSessionView


@method_decorator(csrf_exempt, name='dispatch')
class RecordPaymentView(APIView):
    """
    Enregistre un paiement confirmé dans la base de données.
    PAS d'appel réseau externe - juste une écriture en DB.
    """
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, *args, **kwargs):
        try:
            student_id = request.data.get('student_id')
            amount = request.data.get('amount')
            method = request.data.get('method', 'Stripe')
            reference = request.data.get('reference', '')

            if not student_id or not amount:
                return Response({'error': 'student_id et amount sont requis'}, status=400)

            amount_decimal = Decimal(str(amount))
            ref = reference or f"STRIPE_{student_id}_{int(amount_decimal * 100)}"

            with transaction.atomic():
                student_profile = StudentProfile.objects.get(id=student_id)
                payment, created = Payment.objects.get_or_create(
                    reference=ref,
                    defaults={
                        'student': student_profile,
                        'amount': amount_decimal,
                        'method': method,
                    }
                )

                if created:
                    student_profile.paid_amount = (student_profile.paid_amount or Decimal('0')) + amount_decimal
                    student_profile.instalment2_paid = student_profile.paid_amount >= (student_profile.total_due * Decimal('0.5'))
                    student_profile.payment_status = 'OK' if student_profile.paid_amount >= student_profile.total_due else 'missed'
                    student_profile.save(update_fields=['paid_amount', 'instalment2_paid', 'payment_status'])

                print(f"RecordPayment: student={student_id}, amount={amount_decimal}, created={created}, ref={ref}")

            # Send payment confirmation email to the student
            if created:
                try:
                    from django.core.mail import send_mail
                    from .email_templates import payment_confirmation_email

                    student_user = student_profile.user
                    if student_user.email:
                        platform_settings = PlatformSettings.load()
                        cfg = platform_settings.get_email_config()
                        from_email = cfg.get('from_email') or cfg.get('username') or settings.DEFAULT_FROM_EMAIL

                        subject_line, html_body = payment_confirmation_email(
                            receiver_first_name = student_user.first_name or student_user.username,
                            amount      = float(amount_decimal),
                            method      = method,
                            reference   = ref,
                            paid_total  = float(student_profile.paid_amount),
                            total_due   = float(student_profile.total_due),
                        )
                        plain_body = (
                            f"Bonjour {student_user.first_name or student_user.username},\n\n"
                            f"Votre paiement de {float(amount_decimal):,.0f} € a bien été enregistré.\n"
                            f"Référence : {ref}\nMéthode : {method}\n\n"
                            f"Total payé : {float(student_profile.paid_amount):,.0f} € / {float(student_profile.total_due):,.0f} €\n\n"
                            f"Merci de votre confiance,\nL'équipe Be-Free"
                        )
                        send_mail(
                            subject       = subject_line,
                            message       = plain_body,
                            from_email    = from_email,
                            recipient_list= [student_user.email],
                            html_message  = html_body,
                            fail_silently = True,
                        )
                except Exception as mail_err:
                    print(f"[RecordPaymentView] Email confirmation failed: {mail_err}")

            return Response({
                'success': True,
                'created': created,
                'payment': PaymentSerializer(payment).data,
                'student': StudentProfileSerializer(payment.student).data,
            })
        except StudentProfile.DoesNotExist:
            return Response({'error': 'Client introuvable.'}, status=404)
        except Exception as e:
            import traceback
            print("RecordPaymentView Error:", traceback.format_exc())
            return Response({'error': str(e)}, status=500)



# Kept for backward compat but now just wraps RecordPaymentView logic
@method_decorator(csrf_exempt, name='dispatch')
class ConfirmStripeCheckoutSessionView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, *args, **kwargs):
        """
        Accept a manual confirmation with session_id.
        Since the backend may not have internet access to verify with Stripe,
        we trust the session_id from the frontend (already redirected from Stripe success URL).
        We just record the payment using the pre-stored reference.
        """
        try:
            session_id = request.data.get('session_id')
            student_id = request.data.get('student_id')
            amount = request.data.get('amount')

            if not session_id:
                return Response({'error': 'session_id est requis'}, status=400)

            # If student_id and amount provided (from frontend), record directly
            if student_id and amount:
                amount_decimal = Decimal(str(amount))
                reference = f"STRIPE_{session_id}"

                with transaction.atomic():
                    try:
                        if student_id in [None, 'None', 'null', '']:
                             raise ValueError("student_id invalide")
                        student_profile = StudentProfile.objects.get(id=student_id)
                    except (ValueError, StudentProfile.DoesNotExist):
                        return Response({'error': f'Client introuvable (ID: {student_id})'}, status=404)
                    
                    payment, created = Payment.objects.get_or_create(
                        reference=reference,
                        defaults={
                            'student': student_profile,
                            'amount': amount_decimal,
                            'method': 'Stripe',
                        }
                    )
                    if created:
                        student_profile.paid_amount = (student_profile.paid_amount or Decimal('0')) + amount_decimal
                        student_profile.instalment2_paid = student_profile.paid_amount >= (student_profile.total_due * Decimal('0.5'))
                        student_profile.payment_status = 'OK' if student_profile.paid_amount >= student_profile.total_due else 'missed'
                        student_profile.save(update_fields=['paid_amount', 'instalment2_paid', 'payment_status'])

                return Response({
                    'success': True,
                    'created': created,
                    'payment': PaymentSerializer(payment).data,
                    'student': StudentProfileSerializer(payment.student).data,
                })
            else:
                # Try Stripe API call (may fail if no network)
                try:
                    platform_settings = PlatformSettings.load()
                    active_keys = platform_settings.get_active_stripe_keys()
                    stripe.api_key = active_keys['secret_key']
                    
                    if not stripe.api_key:
                        raise ValueError("Clé secrète Stripe non configurée.")

                    session = stripe.checkout.Session.retrieve(session_id)
                    payment, created = record_paid_stripe_checkout_session(session)
                    return Response({
                        'success': True,
                        'created': created,
                        'payment': PaymentSerializer(payment).data,
                        'student': StudentProfileSerializer(payment.student).data,
                    })
                except ValueError as e:
                    return Response({'error': str(e)}, status=400)
                except Exception as stripe_err:
                    import traceback
                    tb = traceback.format_exc()
                    print(f"--- STRIPE CONFIRMATION ERROR ---")
                    print(f"Session ID: {session_id}")
                    print(f"Error Type: {type(stripe_err).__name__}")
                    print(f"Error Message: {str(stripe_err)}")
                    print(f"Traceback:\n{tb}")
                    print(f"---------------------------------")
                    
                    return Response({
                        'error': f'Erreur lors de la confirmation: {str(stripe_err)}',
                        'detail': 'Le paiement a réussi sur Stripe mais le serveur Be-Free n\'a pas pu valider la session.',
                        'session_id': session_id
                    }, status=502) # Bad Gateway/Service error

        except StudentProfile.DoesNotExist:
            return Response({'error': 'Client introuvable pour cette session Stripe.'}, status=404)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            print("ConfirmStripeCheckoutSessionView Error:", tb)
            return Response({'error': str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        platform_settings = PlatformSettings.load()
        active_keys = platform_settings.get_active_stripe_keys()
        stripe.api_key = active_keys['secret_key']
        endpoint_secret = active_keys['webhook_secret']
        
        payload = request._request.body
        sig_header = request.headers.get('Stripe-Signature')

        if not endpoint_secret:
            return Response({'error': 'STRIPE_WEBHOOK_SECRET is not configured'}, status=500)

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except ValueError:
            return Response({'error': 'Invalid payload'}, status=400)
        except stripe.error.SignatureVerificationError:
            return Response({'error': 'Invalid signature'}, status=400)

        event_type = event.get('type')
        session = event.get('data', {}).get('object', {})

        if event_type in ['checkout.session.completed', 'checkout.session.async_payment_succeeded']:
            try:
                payment, created = record_paid_stripe_checkout_session(session)
                return Response({
                    'received': True,
                    'created': created,
                    'payment_id': payment.id,
                })
            except StudentProfile.DoesNotExist:
                print(f"Stripe Webhook Error: Student {session.get('client_reference_id')} not found")
                return Response({'error': 'Client introuvable pour cette session Stripe.'}, status=404)
            except ValueError as e:
                print(f"Stripe Webhook Error: {str(e)}")
                return Response({'error': str(e)}, status=400)
            except Exception as e:
                print(f"Stripe Webhook Error: {str(e)}")
                return Response({'error': str(e)}, status=500)

        return Response({'received': True, 'ignored': event_type})


@method_decorator(csrf_exempt, name='dispatch')
class TestEmailView(APIView):
    """
    Sends a test email using the current SMTP configuration (from DB or .env).
    POST { "recipient": "test@example.com" }
    """
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, *args, **kwargs):
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        recipient = request.data.get('recipient', '').strip()
        if not recipient:
            return Response({'error': "Le champ 'recipient' (adresse e-mail de test) est requis."}, status=400)

        try:
            platform = PlatformSettings.load()
            cfg = platform.get_email_config()

            if not cfg['username'] or not cfg['password']:
                return Response({
                    'error': "Configuration SMTP incomplète : renseignez l'adresse et le mot de passe SMTP."
                }, status=400)

            # Build message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "✅ Test e-mail Be-Free — Configuration SMTP OK"
            msg['From']    = cfg['from_email'] or cfg['username']
            msg['To']      = recipient

            html = f"""
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border-radius:12px;background:#f9fafb;border:1px solid #e5e7eb">
              <h2 style="color:#1e293b;margin-bottom:8px">✅ Configuration e-mail fonctionnelle</h2>
              <p style="color:#64748b">Ce message confirme que vos paramètres SMTP sont correctement configurés sur <strong>Be-Free</strong>.</p>
              <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px">
                <tr><td style="padding:8px;color:#94a3b8">Serveur</td><td style="padding:8px;font-weight:600">{cfg['host']}:{cfg['port']}</td></tr>
                <tr style="background:#f1f5f9"><td style="padding:8px;color:#94a3b8">TLS</td><td style="padding:8px;font-weight:600">{'Activé' if cfg['use_tls'] else 'Désactivé'}</td></tr>
                <tr><td style="padding:8px;color:#94a3b8">Expéditeur</td><td style="padding:8px;font-weight:600">{cfg['from_email'] or cfg['username']}</td></tr>
              </table>
              <p style="color:#94a3b8;font-size:12px;margin-top:24px">Be-Free E-commerce · Système de notification automatique</p>
            </div>"""

            msg.attach(MIMEText(html, 'html'))

            # Send
            server_cls = smtplib.SMTP_SSL if not cfg['use_tls'] and cfg['port'] == 465 else smtplib.SMTP
            with server_cls(cfg['host'], cfg['port'], timeout=15) as server:
                if cfg['use_tls']:
                    server.starttls()
                server.login(cfg['username'], cfg['password'])
                server.sendmail(cfg['from_email'] or cfg['username'], recipient, msg.as_string())

            return Response({
                'success': True,
                'message': f"E-mail de test envoyé à {recipient} via {cfg['host']}:{cfg['port']}",
                'config': {
                    'host': cfg['host'],
                    'port': cfg['port'],
                    'use_tls': cfg['use_tls'],
                    'from': cfg['from_email'] or cfg['username'],
                }
            })

        except smtplib.SMTPAuthenticationError:
            return Response({'error': "Authentification SMTP échouée. Vérifiez votre adresse e-mail et mot de passe (ou App Password)."}, status=400)
        except smtplib.SMTPConnectError:
            return Response({'error': f"Impossible de se connecter au serveur SMTP {cfg.get('host')}:{cfg.get('port')}."}, status=400)
        except TimeoutError:
            return Response({'error': "Le serveur SMTP ne répond pas (timeout). Vérifiez le port et le pare-feu."}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
