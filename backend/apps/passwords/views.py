from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import PasswordEntry, PasswordHistory
from .serializers import PasswordEntrySerializer, PasswordHistorySerializer
from .encryption import generate_password
import base64


class PasswordEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CRUD operations on password entries.
    All passwords are encrypted client-side before being sent to server.
    """
    serializer_class = PasswordEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter passwords by current user"""
        user = self.request.user
        queryset = PasswordEntry.objects.filter(user=user)
        
        # Optional filtering
        folder = self.request.query_params.get('folder')
        is_favorite = self.request.query_params.get('is_favorite')
        search = self.request.query_params.get('search')
        
        if folder:
            queryset = queryset.filter(folder=folder)
        
        if is_favorite:
            queryset = queryset.filter(is_favorite=True)
        
        if search:
            queryset = queryset.filter(
                name__icontains=search
            ) | queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                website__icontains=search
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """Assign password entry to current user"""
        serializer.save(user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        """
        Update password entry.
        If password is changed, save old password to history.
        """
        instance = self.get_object()
        old_encrypted_password = instance.encrypted_password
        old_iv = instance.encryption_iv
        old_tag = instance.encryption_tag
        
        # Check if password is being updated
        new_encrypted_password = request.data.get('encrypted_password')
        password_changed = (
            new_encrypted_password and 
            base64.b64decode(new_encrypted_password) != old_encrypted_password
        )
        
        # Update the entry
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Save to history if password changed
        if password_changed:
            PasswordHistory.objects.create(
                password_entry=instance,
                encrypted_password=old_encrypted_password,
                encryption_iv=old_iv,
                encryption_tag=old_tag
            )
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_accessed(self, request, pk=None):
        """Mark password as accessed (for analytics)"""
        password_entry = self.get_object()
        password_entry.last_accessed = timezone.now()
        password_entry.save()
        
        return Response({
            'message': 'Password access recorded'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """Toggle favorite status"""
        password_entry = self.get_object()
        password_entry.is_favorite = not password_entry.is_favorite
        password_entry.save()
        
        return Response({
            'is_favorite': password_entry.is_favorite
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get password history"""
        password_entry = self.get_object()
        history = PasswordHistory.objects.filter(password_entry=password_entry)
        serializer = PasswordHistorySerializer(history, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def folders(self, request):
        """Get list of folders with counts"""
        user = request.user
        folders = PasswordEntry.objects.filter(user=user).values('folder').distinct()
        
        folder_counts = []
        for folder in folders:
            count = PasswordEntry.objects.filter(
                user=user,
                folder=folder['folder']
            ).count()
            folder_counts.append({
                'folder': folder['folder'],
                'count': count
            })
        
        return Response(folder_counts, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate a random password.
        This returns plain text - client should encrypt before storing.
        """
        length = request.data.get('length', 16)
        use_symbols = request.data.get('use_symbols', True)
        use_numbers = request.data.get('use_numbers', True)
        use_uppercase = request.data.get('use_uppercase', True)
        use_lowercase = request.data.get('use_lowercase', True)
        
        try:
            password = generate_password(
                length=int(length),
                use_symbols=use_symbols,
                use_numbers=use_numbers,
                use_uppercase=use_uppercase,
                use_lowercase=use_lowercase
            )
            
            return Response({
                'password': password
            }, status=status.HTTP_200_OK)
        
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user's password statistics"""
        user = request.user
        
        total_passwords = PasswordEntry.objects.filter(user=user).count()
        favorites = PasswordEntry.objects.filter(user=user, is_favorite=True).count()
        
        # Get recently accessed
        recent = PasswordEntry.objects.filter(
            user=user,
            last_accessed__isnull=False
        ).order_by('-last_accessed')[:5]
        
        return Response({
            'total_passwords': total_passwords,
            'favorites': favorites,
            'recently_accessed': PasswordEntrySerializer(recent, many=True).data
        }, status=status.HTTP_200_OK)


# Serializers
from rest_framework import serializers
from .models import PasswordEntry, PasswordHistory


class PasswordEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for password entries.
    Handles base64 encoding/decoding of encrypted data.
    """
    encrypted_password = serializers.CharField()
    encryption_iv = serializers.CharField()
    encryption_tag = serializers.CharField()
    encrypted_notes = serializers.CharField(required=False, allow_blank=True)
    notes_iv = serializers.CharField(required=False, allow_blank=True)
    notes_tag = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = PasswordEntry
        fields = [
            'id',
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
            'last_accessed'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validate encrypted data format"""
        try:
            # Decode base64 to validate format
            base64.b64decode(attrs['encrypted_password'])
            base64.b64decode(attrs['encryption_iv'])
            base64.b64decode(attrs['encryption_tag'])
            
            # Validate notes if provided
            if attrs.get('encrypted_notes'):
                base64.b64decode(attrs['encrypted_notes'])
                base64.b64decode(attrs.get('notes_iv', ''))
                base64.b64decode(attrs.get('notes_tag', ''))
        
        except Exception:
            raise serializers.ValidationError("Invalid encrypted data format")
        
        return attrs
    
    def to_representation(self, instance):
        """Convert binary fields to base64"""
        data = super().to_representation(instance)
        
        # Encode binary fields as base64
        data['encrypted_password'] = base64.b64encode(instance.encrypted_password).decode()
        data['encryption_iv'] = base64.b64encode(instance.encryption_iv).decode()
        data['encryption_tag'] = base64.b64encode(instance.encryption_tag).decode()
        
        if instance.encrypted_notes:
            data['encrypted_notes'] = base64.b64encode(instance.encrypted_notes).decode()
            data['notes_iv'] = base64.b64encode(instance.notes_iv).decode()
            data['notes_tag'] = base64.b64encode(instance.notes_tag).decode()
        
        return data
    
    def to_internal_value(self, data):
        """Convert base64 to binary"""
        internal = super().to_internal_value(data)
        
        # Decode base64 to binary
        internal['encrypted_password'] = base64.b64decode(internal['encrypted_password'])
        internal['encryption_iv'] = base64.b64decode(internal['encryption_iv'])
        internal['encryption_tag'] = base64.b64decode(internal['encryption_tag'])
        
        if internal.get('encrypted_notes'):
            internal['encrypted_notes'] = base64.b64decode(internal['encrypted_notes'])
            internal['notes_iv'] = base64.b64decode(internal['notes_iv'])
            internal['notes_tag'] = base64.b64decode(internal['notes_tag'])
        
        return internal


class PasswordHistorySerializer(serializers.ModelSerializer):
    """Serializer for password history"""
    encrypted_password = serializers.SerializerMethodField()
    encryption_iv = serializers.SerializerMethodField()
    encryption_tag = serializers.SerializerMethodField()
    
    class Meta:
        model = PasswordHistory
        fields = [
            'id',
            'encrypted_password',
            'encryption_iv',
            'encryption_tag',
            'changed_at'
        ]
    
    def get_encrypted_password(self, obj):
        return base64.b64encode(obj.encrypted_password).decode()
    
    def get_encryption_iv(self, obj):
        return base64.b64encode(obj.encryption_iv).decode()
    
    def get_encryption_tag(self, obj):
        return base64.b64encode(obj.encryption_tag).decode()