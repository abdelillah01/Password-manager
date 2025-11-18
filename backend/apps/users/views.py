from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    EmailVerificationSerializer
)
from .models import LoginAttempt
import secrets

User = get_user_model()


class LoginRateThrottle(AnonRateThrottle):
    rate = '5/hour'


class RegisterView(generics.CreateAPIView):
    """
    Register a new user.
    Client generates KDF salt and sends it with registration.
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create user
        user = serializer.save()
        
        # Generate email verification token
        verification_token = secrets.token_urlsafe(32)
        user.email_verification_token = verification_token
        user.save()
        
        # Send verification email
        self.send_verification_email(user, verification_token)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Registration successful. Please verify your email.'
        }, status=status.HTTP_201_CREATED)
    
    def send_verification_email(self, user, token):
        """Send email verification link"""
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
        subject = 'Verify your email - Password Manager'
        message = f"""
        Hi {user.username},
        
        Thank you for registering with Password Manager.
        Please click the link below to verify your email address:
        
        {verification_url}
        
        This link will expire in 24 hours.
        
        If you didn't create this account, please ignore this email.
        
        Best regards,
        Password Manager Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_email(request):
    """
    Verify user's email address
    """
    serializer = EmailVerificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    token = serializer.validated_data['token']
    
    try:
        user = User.objects.get(email_verification_token=token)
        user.email_verified = True
        user.email_verification_token = None
        user.save()
        
        return Response({
            'message': 'Email verified successfully'
        }, status=status.HTTP_200_OK)
    
    except User.DoesNotExist:
        return Response({
            'error': 'Invalid verification token'
        }, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view with rate limiting and attempt tracking
    """
    throttle_classes = [LoginRateThrottle]
    
    def post(self, request, *args, **kwargs):
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        # Get user agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:255]
        
        # Attempt authentication
        response = super().post(request, *args, **kwargs)
        
        # Track login attempt
        email = request.data.get('email', '')
        success = response.status_code == 200
        
        try:
            user = User.objects.get(email=email) if success else None
        except User.DoesNotExist:
            user = None
        
        LoginAttempt.objects.create(
            user=user,
            email=email,
            ip_address=ip_address,
            success=success,
            user_agent=user_agent
        )
        
        # Add user data to response if successful
        if success and user:
            response.data['user'] = UserSerializer(user).data
            response.data['requires_2fa'] = user.two_factor_enabled
        
        return response


class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    Get or update current user details
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """
    Change user password.
    IMPORTANT: Client must re-encrypt all password entries with new master password
    before calling this endpoint.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Password changed successfully. All password entries have been re-encrypted.'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout(request):
    """
    Logout user by blacklisting refresh token
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_kdf_params(request):
    """
    Get KDF parameters for user (salt and iterations).
    Client needs this to derive encryption key from master password.
    """
    user = request.user
    
    import base64
    return Response({
        'kdf_salt': base64.b64encode(user.kdf_salt).decode('utf-8'),
        'kdf_iterations': user.kdf_iterations,
        'master_password_hint': user.master_password_hint or ''
    }, status=status.HTTP_200_OK)