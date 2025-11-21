from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.db.models import Q, Count
from django_ratelimit.decorators import ratelimit
# from django.views.decorators.csrf import csrf_exempt



from django.utils.decorators import method_decorator
from .models import PasswordItem
from .serializers import RegisterSerializer, PasswordItemSerializer, FolderSerializer
from rest_framework.authentication import SessionAuthentication

 #class CsrfExemptSessionAuthentication(SessionAuthentication):
     #def enforce_csrf(self, request):
         #return  # Skip CSRF check


class LoginThrottle(AnonRateThrottle):
    scope = 'login'

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login_view(request):
    from django.contrib.auth import authenticate
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(request, username=username, password=password)
    if user:
        login(request, user)
        return Response({'message': 'Login successful', 'username': user.username})
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logout successful'})

class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_classes = [AnonRateThrottle]

class PasswordItemViewSet(viewsets.ModelViewSet):
    serializer_class = PasswordItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = PasswordItem.objects.filter(user=self.request.user)
        
        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(website__icontains=search) | Q(username__icontains=search)
            )
        
        # Folder filter
        folder = self.request.query_params.get('folder', None)
        if folder:
            queryset = queryset.filter(folder=folder)
        
        # Favorite filter
        favorite = self.request.query_params.get('favorite', None)
        if favorite == 'true':
            queryset = queryset.filter(favorite=True)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def folders(self, request):
        folders = PasswordItem.objects.filter(user=request.user).values('folder').annotate(
            count=Count('id')
        ).order_by('folder')
        serializer = FolderSerializer(folders, many=True)
        return Response(serializer.data)
