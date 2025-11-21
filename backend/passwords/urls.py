from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PasswordItemViewSet, RegisterView, login_view, logout_view

router = DefaultRouter()
router.register(r'items', PasswordItemViewSet, basename='password-item')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('', include(router.urls)),
]
