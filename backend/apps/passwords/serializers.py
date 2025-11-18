from rest_framework import serializers
from .models import PasswordEntry, PasswordHistory, SharedPassword
from .encryption import validate_encrypted_data


class PasswordEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for creating and viewing password entries.
    Note: The actual password is never decrypted or exposed.
    The client must handle encryption/decryption using the master key.
    """

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = PasswordEntry
        fields = [
            'id',
            'user',
            'name',
            'username',
            'website',
            'folder',
            'encrypted_password',
            'encryption_iv',
            'encryption_tag',
            'encrypted_notes',
            'notes_iv',
            'notes_tag',
            'is_favorite',
            'created_at',
            'updated_at',
            'last_accessed',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_accessed']

    def validate(self, attrs):
        """
        Validate encrypted fields format (lengths and presence).
        """
        encrypted_password = attrs.get('encrypted_password')
        iv = attrs.get('encryption_iv')
        tag = attrs.get('encryption_tag')

        if not validate_encrypted_data(encrypted_password, iv, tag):
            raise serializers.ValidationError(
                "Invalid encryption data: ensure IV=12 bytes and Tag=16 bytes."
            )

        # If notes are provided, validate their encryption structure too
        if attrs.get('encrypted_notes'):
            notes_iv = attrs.get('notes_iv')
            notes_tag = attrs.get('notes_tag')
            if not validate_encrypted_data(attrs['encrypted_notes'], notes_iv, notes_tag):
                raise serializers.ValidationError(
                    "Invalid encrypted notes: ensure IV=12 bytes and Tag=16 bytes."
                )

        return attrs

    def create(self, validated_data):
        """
        Create a new password entry and automatically assign it to the current user.
        """
        user = self.context['request'].user
        validated_data['user'] = user
        return PasswordEntry.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """
        On update, store old password in PasswordHistory (audit trail).
        """
        # Check if encrypted password changed
        new_encrypted_pw = validated_data.get('encrypted_password')
        if new_encrypted_pw and new_encrypted_pw != instance.encrypted_password:
            PasswordHistory.objects.create(
                password_entry=instance,
                encrypted_password=instance.encrypted_password,
                encryption_iv=instance.encryption_iv,
                encryption_tag=instance.encryption_tag,
            )

        # Standard update logic
        return super().update(instance, validated_data)


class PasswordHistorySerializer(serializers.ModelSerializer):
    """
    Read-only serializer for viewing password change history.
    (Never exposes decrypted passwords.)
    """

    class Meta:
        model = PasswordHistory
        fields = [
            'id',
            'encrypted_password',
            'encryption_iv',
            'encryption_tag',
            'changed_at',
        ]
        read_only_fields = fields


class SharedPasswordSerializer(serializers.ModelSerializer):
    """
    Serializer for future password sharing feature.
    """

    shared_by = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = SharedPassword
        fields = [
            'id',
            'password_entry',
            'shared_with',
            'shared_by',
            'encrypted_password',
            'encryption_iv',
            'encryption_tag',
            'can_edit',
            'shared_at',
            'expires_at',
        ]
        read_only_fields = ['id', 'shared_at']

    def validate(self, attrs):
        """
        Ensure IV and Tag validity for shared passwords.
        """
        if not validate_encrypted_data(
            attrs.get('encrypted_password'),
            attrs.get('encryption_iv'),
            attrs.get('encryption_tag'),
        ):
            raise serializers.ValidationError("Invalid shared password encryption data.")
        return attrs
