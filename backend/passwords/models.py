from django.db import models
from django.contrib.auth.models import User

class PasswordItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_items')
    encrypted_data = models.TextField()  # Client-encrypted password
    iv = models.CharField(max_length=32)  # Initialization vector
    folder = models.CharField(max_length=100, blank=True, default='')
    favorite = models.BooleanField(default=False)
    website = models.CharField(max_length=255, blank=True, default='')
    username = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'folder']),
            models.Index(fields=['user', 'favorite']),
        ]

    def __str__(self):
        return f"{self.username}@{self.website}"
