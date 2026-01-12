"""
URL configuration for mrd_system project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from api.health_views import health_check, readiness_check, version_info
from api.health_views import health_check, readiness_check, version_info

@require_http_methods(["GET"])
def api_root(request):
    """API Root - Shows available endpoints"""
    return JsonResponse({
        'message': 'KLH MedCare - Healthcare Management Platform API',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'api_root': '/api/',
            'patients': '/api/patients/',
            'treatments': '/api/treatments/',
            'medicines': '/api/medicines/',
            'medicine_transactions': '/api/medicine-transactions/',
            'stock_requests': '/api/stock-requests/',
            'beds': '/api/beds/',
            'bed_allocations': '/api/bed-allocations/',
            'cleaning_records': '/api/cleaning-records/',
            'cleaning_schedules': '/api/cleaning-schedules/',
            'users': '/api/users/',
            'dashboard_stats': '/api/dashboard/stats/',
        },
        'authentication': {
            'login': '/api/auth/login/',
            'logout': '/api/auth/logout/',
        },
        'documentation': 'Visit /api/ for detailed API documentation'
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    
    # Health Check & Monitoring Endpoints
    path('health/', health_check, name='health_check'),
    path('ready/', readiness_check, name='readiness_check'),
    path('version/', version_info, name='version_info'),
    
    # API Documentation URLs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
