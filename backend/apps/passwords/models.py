from django.db import models
from django.conf import settings
import uuid


class PasswordEntry(models.Model):
    """
    Stores encrypted password entries.
    The server never knows the actual passwords - they are encrypted client-side.
    """
    FOLDER_CHOICES = [
        ('personal', 'Personal'),
        ('work', 'Work'),
        ('finance', 'Finance'),
        ('social', 'Social'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_entries'
    )
    
    # Metadata (unencrypted for search/display)
    name = models.CharField(max_length=255)  # e.g., "Gmail Account"
    username = models.CharField(max_length=255, blank=True)  # Optional username/email
    website = models.URLField(max_length=500, blank=True)
    folder = models.CharField(max_length=50, choices=FOLDER_CHOICES, default='other')
    
    # Encrypted data
    encrypted_password = models.BinaryField()  # AES-256-GCM encrypted password
    encryption_iv = models.BinaryField(max_length=16)  # Initialization vector
    encryption_tag = models.BinaryField(max_length=16)  # Authentication tag for GCM
    
    # Optional encrypted notes
    encrypted_notes = models.BinaryField(blank=True, null=True)
    notes_iv = models.BinaryField(max_length=16, blank=True, null=True)
    notes_tag = models.BinaryField(max_length=16, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_accessed = models.DateTimeField(null=True, blank=True)
    
    # Favorites
    is_favorite = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'password_entries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'folder']),
            models.Index(fields=['user', 'is_favorite']),
            models.Index(fields=['user', 'created_at']),
        ]
        verbose_name = 'Password Entry'
        verbose_name_plural = 'Password Entries'
    
    def __str__(self):
        return f"{self.name} - {self.user.email}"


class PasswordHistory(models.Model):
    """
    Track password history for audit purposes
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    password_entry = models.ForeignKey(
        PasswordEntry,
        on_delete=models.CASCADE,
        related_name='history'
    )
    
    # Store encrypted old password
    encrypted_password = models.BinaryField()
    encryption_iv = models.BinaryField(max_length=16)
    encryption_tag = models.BinaryField(max_length=16)
    
    changed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'password_history'
        ordering = ['-changed_at']
        verbose_name = 'Password History'
        verbose_name_plural = 'Password Histories'
    
    def __str__(self):
        return f"{self.password_entry.name} - {self.changed_at}"


class SharedPassword(models.Model):
    """
    For future feature: securely sharing passwords with other users
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    password_entry = models.ForeignKey(
        PasswordEntry,
        on_delete=models.CASCADE,
        related_name='shares'
    )
    shared_with = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shared_passwords'
    )
    shared_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='passwords_shared_by_me'
    )
    
    # Encrypted password re-encrypted with shared_with user's public key
    encrypted_password = models.BinaryField()
    encryption_iv = models.BinaryField(max_length=16)
    encryption_tag = models.BinaryField(max_length=16)
    
    can_edit = models.BooleanField(default=False)
    shared_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'shared_passwords'
        unique_together = [['password_entry', 'shared_with']]
        ordering = ['-shared_at']
    
    def __str__(self):
        return f"{self.password_entry.name} shared with {self.shared_with.email}"