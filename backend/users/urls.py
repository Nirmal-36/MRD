from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    
    # Authentication endpoints (additional direct routes for convenience)
    path('api/auth/login/', UserViewSet.as_view({'post': 'login'}), name='auth-login'),
    path('api/auth/logout/', UserViewSet.as_view({'post': 'logout'}), name='auth-logout'),
    path('api/auth/register/', UserViewSet.as_view({'post': 'register'}), name='auth-register'),
    path('api/auth/me/', UserViewSet.as_view({'get': 'me'}), name='auth-me'),
    path('api/auth/change-password/', UserViewSet.as_view({'post': 'change_password'}), name='auth-change-password'),
    path('api/auth/forgot-password/', UserViewSet.as_view({'post': 'forgot_password'}), name='auth-forgot-password'),
    path('api/auth/verify-otp/', UserViewSet.as_view({'post': 'verify_otp'}), name='auth-verify-otp'),
    path('api/auth/reset-password/', UserViewSet.as_view({'post': 'reset_password'}), name='auth-reset-password'),
]