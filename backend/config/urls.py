from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# Import views
from apps.users.views import (
    RegisterView,
    CustomTokenObtainPairView,
    UserDetailView,
    ChangePasswordView,
    logout,
    verify_email,
    get_kdf_params
)
from apps.passwords.views import PasswordEntryViewSet
from apps.two_factor import views as two_factor_views

# Create router for viewsets
router = DefaultRouter()
router.register(r'passwords', PasswordEntryViewSet, basename='password')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('api/auth/logout/', logout, name='logout'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify-email/', verify_email, name='verify_email'),
    path('api/auth/kdf-params/', get_kdf_params, name='kdf_params'),
    
    # User endpoints
    path('api/user/', UserDetailView.as_view(), name='user_detail'),
    path('api/user/change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # 2FA endpoints
    path('api/2fa/setup/', two_factor_views.setup_2fa, name='setup_2fa'),
    path('api/2fa/verify-setup/', two_factor_views.verify_2fa_setup, name='verify_2fa_setup'),
    path('api/2fa/verify/', two_factor_views.verify_2fa_login, name='verify_2fa_login'),
    path('api/2fa/disable/', two_factor_views.disable_2fa, name='disable_2fa'),
    path('api/2fa/status/', two_factor_views.get_2fa_status, name='2fa_status'),
    
    # Password management endpoints (from router)
    path('api/', include(router.urls)),
]