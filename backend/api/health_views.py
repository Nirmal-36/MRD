"""
Health Check and Monitoring Endpoints
For load balancers, monitoring systems, and deployment verification
"""

from django.http import JsonResponse
from django.conf import settings
from django.db import connection
from django.core.cache import cache
import logging
import time

logger = logging.getLogger(__name__)


def health_check(request):
    """
    Basic health check endpoint
    Returns 200 OK if service is running
    Used by load balancers for quick health verification
    """
    return JsonResponse({
        'status': 'healthy',
        'service': 'MRD System',
        'timestamp': time.time(),
    }, status=200)


def readiness_check(request):
    """
    Comprehensive readiness check
    Verifies all dependencies (database, cache, etc.) are ready
    Used by orchestration systems (Kubernetes, Docker Swarm) before routing traffic
    """
    checks = {
        'database': False,
        'cache': False,
        'overall': False,
    }
    
    errors = []
    
    # Check database connectivity
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        checks['database'] = True
    except Exception as e:
        errors.append(f"Database error: {str(e)}")
        logger.error(f"Readiness check - Database failed: {e}")
    
    # Check cache connectivity
    try:
        cache_key = '_health_check_'
        cache.set(cache_key, 'ok', timeout=10)
        cache_value = cache.get(cache_key)
        if cache_value == 'ok':
            checks['cache'] = True
            cache.delete(cache_key)
        else:
            errors.append("Cache verification failed")
    except Exception as e:
        errors.append(f"Cache error: {str(e)}")
        logger.error(f"Readiness check - Cache failed: {e}")
    
    # Overall readiness
    checks['overall'] = checks['database'] and checks['cache']
    
    status_code = 200 if checks['overall'] else 503
    
    response_data = {
        'status': 'ready' if checks['overall'] else 'not_ready',
        'checks': checks,
        'timestamp': time.time(),
        'environment': settings.SENTRY_ENVIRONMENT if hasattr(settings, 'SENTRY_ENVIRONMENT') else 'unknown',
    }
    
    if errors:
        response_data['errors'] = errors
    
    return JsonResponse(response_data, status=status_code)


def version_info(request):
    """
    Application version and build information
    Useful for deployment verification and debugging
    """
    import django
    import sys
    
    return JsonResponse({
        'application': 'MRD System',
        'version': '1.0.0',
        'django_version': django.get_version(),
        'python_version': sys.version,
        'debug_mode': settings.DEBUG,
        'environment': settings.SENTRY_ENVIRONMENT if hasattr(settings, 'SENTRY_ENVIRONMENT') else 'development',
        'timestamp': time.time(),
    }, status=200)
