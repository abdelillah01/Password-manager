from rest_framework import serializers
from .models import TwoFactorSecret, TwoFactorAttempt


class TwoFactorSetupSerializer(serializers.Serializer):
    """
    Used when setting up 2FA — returns QR code, secret, and backup codes.
    """
    qr_code = serializers.CharField()
    secret = serializers.CharField()
    backup_codes = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=False
    )
    message = serializers.CharField()


class TwoFactorVerifySerializer(serializers.Serializer):
    """
    Used to verify a TOTP token when enabling or logging in with 2FA.
    """
    token = serializers.CharField(required=True)
    use_backup_code = serializers.BooleanField(default=False)


class TwoFactorStatusSerializer(serializers.Serializer):
    """
    Used to get the 2FA status for the current user.
    """
    enabled = serializers.BooleanField()
    backup_codes_remaining = serializers.IntegerField()


class TwoFactorAttemptSerializer(serializers.ModelSerializer):
    """
    Serializer for logging or viewing 2FA attempts (optional for admin or debugging).
    """
    class Meta:
        model = TwoFactorAttempt
        fields = ['id', 'user', 'success', 'ip_address', 'timestamp', 'used_backup_code']


class TwoFactorSecretSerializer(serializers.ModelSerializer):
    """
    Serializer for debugging or admin interface (optional).
    """
    class Meta:
        model = TwoFactorSecret
        fields = ['id', 'user', 'created_at', 'last_used']
        read_only_fields = ['id', 'created_at', 'last_used']
