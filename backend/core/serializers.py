from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, TrainerProfile, StudentProfile, Payment, ZoomSession, Message, PlatformSettings, Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'type', 'created_at', 'read', 'link']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'is_active', 'is_staff', 'password'
        ]
        read_only_fields = ['is_staff']

    def validate_username(self, value):
        qs = User.objects.filter(username=value)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value

    def validate_email(self, value):
        if not value:
            return value

        qs = User.objects.filter(email__iexact=value, role='admin')
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("Un administrateur avec cet email existe déjà.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None) or 'Befree2026'
        validated_data['role'] = 'admin'
        validated_data['is_staff'] = True
        user = User.objects.create_user(password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        validated_data.pop('is_staff', None)
        validated_data['role'] = 'admin'
        validated_data['is_staff'] = True

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

class TrainerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    assigned_student_ids = serializers.SerializerMethodField()
    
    # Extra fields for creation
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)

    class Meta:
        model = TrainerProfile
        fields = [
            'id', 'user', 'specialty', 'assigned_student_ids', 'raw_password',
            'username', 'password', 'first_name', 'last_name', 'email'
        ]
        read_only_fields = ['raw_password']

    def get_assigned_student_ids(self, obj):
        students = obj.user.assigned_students.all()
        return [student.user.id for student in students]

    def create(self, validated_data):
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', 'Befree2026')
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        email = validated_data.pop('email', '')

        # Create user
        if not username:
            f_name = first_name.strip().split(' ')[0].lower() if first_name else 'resp'
            l_name = last_name.strip().split(' ')[0].lower() if last_name else 'befree'
            username = f"trainer.{f_name}.{l_name}"
            
            # Ensure uniqueness
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
        
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=email,
            role='trainer'
        )

        # Create profile
        profile = TrainerProfile.objects.create(user=user, raw_password=password, **validated_data)
        return profile

class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = [
            'default_total_due', 'default_due_date', 'site_name', 'contact_email',
            'contact_phone',
            # Stripe mode
            'stripe_mode',
            # Test / Sandbox keys
            'stripe_public_key', 'stripe_secret_key', 'stripe_webhook_secret',
            # Live / Production keys
            'stripe_public_key_live', 'stripe_secret_key_live', 'stripe_webhook_secret_live',
            # Email / SMTP
            'email_host', 'email_port', 'email_use_tls',
            'email_host_user', 'email_host_password', 'default_from_email',
        ]

class PaymentSerializer(serializers.ModelSerializer):
    student_id = serializers.PrimaryKeyRelatedField(source='student', queryset=StudentProfile.objects.all())
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'student_id', 'student_name', 'amount', 'date', 'method', 'reference']

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    trainer_id = serializers.PrimaryKeyRelatedField(
        source='trainer', 
        queryset=User.objects.filter(role='trainer'), 
        allow_null=True,
        required=False
    )
    
    # Extra fields for creation
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'trainer_id', 'status', 'payment_status', 
            'phone', 'instalment2_paid', 'total_due', 'paid_amount', 
            'next_due_date', 'next_zoom_date', 'last_interaction',
            'username', 'password', 'first_name', 'last_name', 'email',
            'raw_password', 'kbis_file', 'notes',
            'has_business', 'current_offer', 'monthly_revenue', 'challenges'
        ]
        read_only_fields = ['raw_password']

    def validate(self, data):
        username = data.get('username')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        email = data.get('email')
        
        user_id = self.instance.user.id if self.instance else None

        if not self.instance and not username:
            # Creation only: generate username
            f_name = first_name.strip().split(' ')[0].lower() if first_name else 'cli'
            l_name = last_name.strip().split(' ')[0].lower() if last_name else 'befree'
            username = f"{f_name}.{l_name}"
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            data['username'] = username
        elif username:
            qs = User.objects.filter(username=username)
            if user_id: qs = qs.exclude(id=user_id)
            if qs.exists():
                raise serializers.ValidationError({"message": "Ce nom d'utilisateur est déjà pris."})

        if email:
            # Only check email uniqueness among other STUDENT users, not admins/trainers
            qs = User.objects.filter(email__iexact=email, role='student')
            if user_id:
                qs = qs.exclude(id=user_id)
            if qs.exists():
                raise serializers.ValidationError({"message": "Un compte étudiant avec cet email existe déjà."})
            
        return data

    def update(self, instance, validated_data):
        # Handle Nested User updates
        user_data = {}
        if 'first_name' in validated_data: user_data['first_name'] = validated_data.pop('first_name')
        if 'last_name' in validated_data: user_data['last_name'] = validated_data.pop('last_name')
        if 'email' in validated_data: user_data['email'] = validated_data.pop('email')
        if 'username' in validated_data: user_data['username'] = validated_data.pop('username')
        
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()
            
        return super().update(instance, validated_data)

    def create(self, validated_data):
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', 'Befree2026')
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        email = validated_data.pop('email', '')

        # Create user
        if not username:
            f_name = first_name.strip().split(' ')[0].lower() if first_name else 'cli'
            l_name = last_name.strip().split(' ')[0].lower() if last_name else 'befree'
            username = f"{f_name}.{l_name}"
            # Still need to handle potential collision if generate is called twice
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
        
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=email,
            role='student'
        )

        # Assign default total due and due date if not set
        settings = PlatformSettings.load()
        if 'total_due' not in validated_data or validated_data['total_due'] is None or validated_data.get('total_due') == 0:
            validated_data['total_due'] = settings.default_total_due
            
        if 'next_due_date' not in validated_data or validated_data['next_due_date'] is None:
            validated_data['next_due_date'] = settings.default_due_date

        # Create profile
        parsed_data = validated_data.copy()
        parsed_data['raw_password'] = password
        profile = StudentProfile.objects.create(user=user, **parsed_data)
        
        # If paid_amount > 0, create an automatic payment record
        if profile.paid_amount > 0:
            Payment.objects.create(
                student=profile,
                amount=profile.paid_amount,
                method='Dépôt Initial',
                reference='CREATION_COMPTE'
            )

        return profile

class ZoomSessionSerializer(serializers.ModelSerializer):
    trainer_id = serializers.PrimaryKeyRelatedField(source='trainer', queryset=User.objects.filter(role='trainer'))
    student_ids = serializers.PrimaryKeyRelatedField(source='students', queryset=User.objects.filter(role='student'), many=True)

    class Meta:
        model = ZoomSession
        fields = [
            'id', 'title', 'date', 'time', 'link', 'trainer_id', 
            'student_ids', 'is_recurring', 'recurrence_rule'
        ]

class MessageSerializer(serializers.ModelSerializer):
    from_student_id = serializers.PrimaryKeyRelatedField(source='sender', queryset=User.objects.all())
    to_trainer_id = serializers.PrimaryKeyRelatedField(source='receiver', queryset=User.objects.all())

    class Meta:
        model = Message
        fields = [
            'id', 'from_student_id', 'to_trainer_id', 'subject', 
            'body', 'created_at', 'read'
        ]

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect Credentials")
