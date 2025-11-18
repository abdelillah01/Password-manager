from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet
import pyotp
import uuid
import os


class TwoFactorSecret(models.Model):
    """
    Stores encrypted TOTP secrets for two-factor authentication
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='two_factor_secret'
    )
    
    # Encrypted TOTP secret (encrypted with app's encryption key, not user's)
    encrypted_secret = models.BinaryField()
    
    # Backup codes (hashed)
    backup_codes = models.JSONField(default=list)  # Store hashed backup codes
    
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'two_factor_secrets'
    
    def __str__(self):
        return f"2FA Secret for {self.user.email}"
    
    @staticmethod
    def generate_secret():
        """Generate a new TOTP secret"""
        return pyotp.random_base32()
    
    def get_totp_uri(self, secret, issuer="Password Manager"):
        """Generate TOTP URI for QR code"""
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=self.user.email,
            issuer_name=issuer
        )
    
    def verify_token(self, token, secret):
        """Verify a TOTP token"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)
    
    @staticmethod
    def generate_backup_codes(count=8):
        """Generate backup codes"""
        import secrets
        import string
        
        codes = []
        for _ in range(count):
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) 
                          for _ in range(8))
            codes.append(code)
        return codes
    
    @staticmethod
    def hash_backup_code(code):
        """Hash a backup code for storage"""
        from django.contrib.auth.hashers import make_password
        return make_password(code)
    
    def verify_backup_code(self, code):
        """Verify and consume a backup code"""
        from django.contrib.auth.hashers import check_password
        
        for hashed_code in self.backup_codes:
            if check_password(code, hashed_code):
                # Remove used backup code
                self.backup_codes.remove(hashed_code)
                self.save()
                return True
        return False


class TwoFactorAttempt(models.Model):
    """
    Track 2FA attempts for security monitoring
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='two_factor_attempts'
    )
    success = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField()
    timestamp = models.DateTimeField(auto_now_add=True)
    used_backup_code = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'two_factor_attempts'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.email} - {self.timestamp} - {'Success' if self.success else 'Failed'}"