from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, TrainerProfile, StudentProfile, ZoomSession, Message

class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Info', {'fields': ('role',)}),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'first_name', 'last_name', 'email')

admin.site.register(User, UserAdmin)

@admin.register(TrainerProfile)
class TrainerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialty')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'specialty')

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'trainer', 'status', 'payment_status', 'instalment2_paid', 'total_due', 'paid_amount', 'next_due_date')
    list_filter = ('status', 'payment_status', 'instalment2_paid')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'trainer__username')

    def progress(self, obj):
        try:
            return f"{int((obj.paid_amount / obj.total_due) * 100)}%"
        except:
            return "0%"
    list_display = ('user', 'trainer', 'status', 'payment_status', 'progress', 'next_due_date')

@admin.register(ZoomSession)
class ZoomSessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'time', 'trainer', 'is_recurring')
    list_filter = ('date', 'trainer', 'is_recurring')
    search_fields = ('title', 'trainer__username', 'trainer__first_name')
    filter_horizontal = ('students',)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('subject', 'sender', 'receiver', 'created_at', 'read')
    list_filter = ('read', 'created_at')
    search_fields = ('subject', 'sender__username', 'receiver__username')
