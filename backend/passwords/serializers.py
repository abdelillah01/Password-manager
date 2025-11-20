from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PasswordItem

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']  # Argon2 hashed automatically
        )
        return user

class PasswordItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordItem
        fields = ['id', 'encrypted_data', 'iv', 'folder', 'favorite', 
                  'website', 'username', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class FolderSerializer(serializers.Serializer):
    folder = serializers.CharField()
    count = serializers.IntegerField()
