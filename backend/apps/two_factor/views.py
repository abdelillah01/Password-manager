from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import TwoFactorSecret, TwoFactorAttempt
from .serializers import TwoFactorSetupSerializer, TwoFactorVerifySerializer
import pyotp
import qrcode
import io
import base64
from apps.passwords.encryption import EncryptionService

User = get_user_model()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def setup_2fa(request):
    """
    Initialize 2FA setup.
    Returns QR code and backup codes.
    """
    user = request.user
    
    # Check if 2FA already enabled
    if user.two_factor_enabled:
        return Response({
            'error': '2FA is already enabled. Disable it first to re-setup.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate TOTP secret
    secret = TwoFactorSecret.generate_secret()
    
    # Encrypt the secret for storage
    encryption_service = EncryptionService()
    encrypted_secret, iv, tag = encryption_service.encrypt_string(secret)
    
    # Generate backup codes
    backup_codes = TwoFactorSecret.generate_backup_codes()
    hashed_backup_codes = [
        TwoFactorSecret.hash_backup_code(code) for code in backup_codes
    ]
    
    # Store (but don't enable yet - wait for verification)
    two_factor_secret, created = TwoFactorSecret.objects.get_or_create(
        user=user,
        defaults={
            'encrypted_secret': encrypted_secret + iv + tag,  # Combine for storage
            'backup_codes': hashed_backup_codes
        }
    )
    
    if not created:
        # Update existing
        two_factor_secret.encrypted_secret = encrypted_secret + iv + tag
        two_factor_secret.backup_codes = hashed_backup_codes
        two_factor_secret.save()
    
    # Generate QR code
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user.email,
        issuer_name="Password Manager"
    )
    
    # Create QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return Response({
        'qr_code': f'data:image/png;base64,{img_str}',
        'secret': secret,  # For manual entry
        'backup_codes': backup_codes,
        'message': 'Scan the QR code with your authenticator app and verify with a code to enable 2FA.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_2fa_setup(request):
    """
    Verify 2FA setup with a TOTP code.
    This enables 2FA for the user.
    """
    user = request.user
    token = request.data.get('token')
    
    if not token:
        return Response({
            'error': 'Token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        two_factor_secret = TwoFactorSecret.objects.get(user=user)
    except TwoFactorSecret.DoesNotExist:
        return Response({
            'error': '2FA not set up. Call /setup-2fa first.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Decrypt secret
    encryption_service = EncryptionService()
    encrypted_data = two_factor_secret.encrypted_secret
    
    # Extract components (last 32 bytes: 16 IV + 16 tag)
    ciphertext = encrypted_data[:-32]
    iv = encrypted_data[-32:-16]
    tag = encrypted_data[-16:]
    
    try:
        secret = encryption_service.decrypt_string(ciphertext, iv, tag)
    except Exception:
        return Response({
            'error': 'Failed to decrypt 2FA secret'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Verify token
    totp = pyotp.TOTP(secret)
    if totp.verify(token, valid_window=1):
        # Enable 2FA
        user.two_factor_enabled = True
        user.save()
        
        return Response({
            'message': '2FA enabled successfully'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_2fa_login(request):
    """
    Verify 2FA token during login.
    This should be called after successful username/password authentication.
    """
    user = request.user
    token = request.data.get('token')
    use_backup_code = request.data.get('use_backup_code', False)
    
    if not token:
        return Response({
            'error': 'Token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get client IP for tracking
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(',')[0]
    else:
        ip_address = request.META.get('REMOTE_ADDR')
    
    try:
        two_factor_secret = TwoFactorSecret.objects.get(user=user)
    except TwoFactorSecret.DoesNotExist:
        return Response({
            'error': '2FA not configured'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify backup code
    if use_backup_code:
        if two_factor_secret.verify_backup_code(token):
            TwoFactorAttempt.objects.create(
                user=user,
                success=True,
                ip_address=ip_address,
                used_backup_code=True
            )
            
            return Response({
                'message': '2FA verification successful (backup code used)',
                'remaining_backup_codes': len(two_factor_secret.backup_codes)
            }, status=status.HTTP_200_OK)
        else:
            TwoFactorAttempt.objects.create(
                user=user,
                success=False,
                ip_address=ip_address,
                used_backup_code=True
            )
            
            return Response({
                'error': 'Invalid backup code'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify TOTP token
    encryption_service = EncryptionService()
    encrypted_data = two_factor_secret.encrypted_secret
    
    ciphertext = encrypted_data[:-32]
    iv = encrypted_data[-32:-16]
    tag = encrypted_data[-16:]
    
    try:
        secret = encryption_service.decrypt_string(ciphertext, iv, tag)
    except Exception:
        return Response({
            'error': 'Failed to decrypt 2FA secret'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    totp = pyotp.TOTP(secret)
    if totp.verify(token, valid_window=1):
        TwoFactorAttempt.objects.create(
            user=user,
            success=True,
            ip_address=ip_address
        )
        
        two_factor_secret.last_used = timezone.now()
        two_factor_secret.save()
        
        return Response({
            'message': '2FA verification successful'
        }, status=status.HTTP_200_OK)
    else:
        TwoFactorAttempt.objects.create(
            user=user,
            success=False,
            ip_address=ip_address
        )
        
        return Response({
            'error': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def disable_2fa(request):
    """
    Disable 2FA for user.
    Requires password confirmation.
    """
    user = request.user
    password = request.data.get('password')
    
    if not password:
        return Response({
            'error': 'Password is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not user.check_password(password):
        return Response({
            'error': 'Invalid password'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Delete 2FA secret
    try:
        two_factor_secret = TwoFactorSecret.objects.get(user=user)
        two_factor_secret.delete()
    except TwoFactorSecret.DoesNotExist:
        pass
    
    # Disable 2FA
    user.two_factor_enabled = False
    user.save()
    
    return Response({
        'message': '2FA disabled successfully'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_2fa_status(request):
    """
    Get 2FA status for current user
    """
    user = request.user
    
    backup_codes_count = 0
    if user.two_factor_enabled:
        try:
            two_factor_secret = TwoFactorSecret.objects.get(user=user)
            backup_codes_count = len(two_factor_secret.backup_codes)
        except TwoFactorSecret.DoesNotExist:
            pass
    
    return Response({
        'enabled': user.two_factor_enabled,
        'backup_codes_remaining': backup_codes_count
    }, status=status.HTTP_200_OK)


from django.utils import timezone