from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid


class User(AbstractUser):
    """
    Custom user model with additional fields for password manager.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True, null=True)
    
    # Security fields
    master_password_hint = models.CharField(max_length=255, blank=True, null=True)
    kdf_iterations = models.IntegerField(default=100000)
    kdf_salt = models.BinaryField(max_length=32)  # Salt for PBKDF2
    
    # 2FA fields
    two_factor_enabled = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_password_change = models.DateTimeField(auto_now_add=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        verbose_name = _('user')
        verbose_name_plural = _('users')
    
    def __str__(self):
        return self.email
    
    @property
    def has_2fa_enabled(self):
        """Check if user has 2FA enabled and configured"""
        return self.two_factor_enabled and hasattr(self, 'two_factor_secret')


class LoginAttempt(models.Model):
    """
    Track login attempts for rate limiting and security monitoring
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    email = models.EmailField()
    ip_address = models.GenericIPAddressField()
    success = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    user_agent = models.CharField(max_length=255, blank=True)
    
    class Meta:
        db_table = 'login_attempts'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['email', 'timestamp']),
            models.Index(fields=['ip_address', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.email} - {self.timestamp} - {'Success' if self.success else 'Failed'}"