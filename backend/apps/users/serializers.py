from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
import os
import base64

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Client sends KDF salt and iterations for key derivation.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    kdf_salt = serializers.CharField(
        required=True,
        help_text="Base64-encoded salt for PBKDF2 key derivation"
    )
    kdf_iterations = serializers.IntegerField(
        default=100000,
        help_text="Number of PBKDF2 iterations"
    )
    master_password_hint = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255
    )
    
    class Meta:
        model = User
        fields = [
            'email',
            'username',
            'password',
            'password_confirm',
            'kdf_salt',
            'kdf_iterations',
            'master_password_hint'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        
        # Validate KDF salt
        try:
            salt = base64.b64decode(attrs['kdf_salt'])
            if len(salt) != 32:
                raise ValueError("Salt must be 32 bytes")
        except Exception:
            raise serializers.ValidationError({
                "kdf_salt": "Invalid salt format. Must be base64-encoded 32 bytes."
            })
        
        # Validate iterations
        if attrs['kdf_iterations'] < 100000:
            raise serializers.ValidationError({
                "kdf_iterations": "Minimum 100,000 iterations required for security."
            })
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        
        # Decode and store salt as binary
        kdf_salt = base64.b64decode(validated_data.pop('kdf_salt'))
        
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            kdf_salt=kdf_salt,
            kdf_iterations=validated_data.get('kdf_iterations', 100000),
            master_password_hint=validated_data.get('master_password_hint', '')
        )
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user details
    """
    kdf_salt = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'email_verified',
            'two_factor_enabled',
            'kdf_salt',
            'kdf_iterations',
            'master_password_hint',
            'created_at',
            'last_password_change'
        ]
        read_only_fields = [
            'id',
            'email_verified',
            'created_at',
            'last_password_change'
        ]
    
    def get_kdf_salt(self, obj):
        """Return salt as base64 string"""
        return base64.b64encode(obj.kdf_salt).decode('utf-8')


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password.
    Client must re-encrypt all passwords with new master password.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_kdf_salt = serializers.CharField(
        required=True,
        help_text="New base64-encoded salt for key derivation"
    )
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value
    
    def validate_new_kdf_salt(self, value):
        try:
            salt = base64.b64decode(value)
            if len(salt) != 32:
                raise ValueError()
        except Exception:
            raise serializers.ValidationError(
                "Invalid salt format. Must be base64-encoded 32 bytes."
            )
        return value
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.kdf_salt = base64.b64decode(self.validated_data['new_kdf_salt'])
        user.save()
        return user


class EmailVerificationSerializer(serializers.Serializer):
    """
    Serializer for email verification
    """
    token = serializers.CharField(required=True)
    
    def validate_token(self, value):
        try:
            user = User.objects.get(email_verification_token=value)
            if user.email_verified:
                raise serializers.ValidationError("Email already verified")
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token")
        return value