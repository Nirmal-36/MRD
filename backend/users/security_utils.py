"""
Security utilities for rate limiting and account lockout
"""
from django.core.cache import cache
from datetime import datetime, timedelta
import time


def check_rate_limit(key, max_attempts=5, time_window=300):
    """
    Check if a key has exceeded the rate limit
    
    Args:
        key: Unique identifier for tracking (e.g., phone number, IP, username)
        max_attempts: Maximum number of attempts allowed
        time_window: Time window in seconds (default 5 minutes)
    
    Returns:
        tuple: (is_allowed, attempts_left, retry_after_seconds)
    """
    cache_key = f"rate_limit_{key}"
    cache_data = cache.get(cache_key)
    
    if cache_data is None:
        return True, max_attempts, 0
    
    attempts, expiry_time = cache_data
    
    if attempts >= max_attempts:
        retry_after = max(0, expiry_time - time.time())
        return False, 0, int(retry_after)
    
    return True, max_attempts - attempts, 0


def increment_rate_limit(key, time_window=300):
    """
    Increment the rate limit counter for a key
    
    Args:
        key: Unique identifier for tracking
        time_window: Time window in seconds (default 5 minutes)
    """
    cache_key = f"rate_limit_{key}"
    cache_data = cache.get(cache_key)
    
    if cache_data is None:
        expiry_time = time.time() + time_window
        cache.set(cache_key, (1, expiry_time), timeout=time_window)
    else:
        attempts, expiry_time = cache_data
        cache.set(cache_key, (attempts + 1, expiry_time), timeout=time_window)


def reset_rate_limit(key):
    """Reset the rate limit counter for a key"""
    cache_key = f"rate_limit_{key}"
    cache.delete(cache_key)


def check_account_lockout(username):
    """
    Check if an account is locked due to failed login attempts
    
    Args:
        username: Username to check
    
    Returns:
        tuple: (is_locked, attempts_left, lockout_time_remaining)
    """
    cache_key = f"login_attempts_{username}"
    cache_data = cache.get(cache_key)
    
    # Lock account after 5 failed attempts for 15 minutes
    max_attempts = 5
    lockout_duration = 900  # 15 minutes
    
    if cache_data is None:
        return False, max_attempts, 0
    
    attempts, expiry_time = cache_data
    
    if attempts >= max_attempts:
        lockout_remaining = max(0, expiry_time - time.time())
        return True, 0, int(lockout_remaining)
    
    return False, max_attempts - attempts, 0


def increment_login_attempts(username):
    """
    Increment failed login attempts counter
    
    Args:
        username: Username that failed login
    """
    cache_key = f"login_attempts_{username}"
    cache_data = cache.get(cache_key)
    lockout_duration = 900  # 15 minutes
    
    if cache_data is None:
        expiry_time = time.time() + lockout_duration
        cache.set(cache_key, (1, expiry_time), timeout=lockout_duration)
    else:
        attempts, expiry_time = cache_data
        cache.set(cache_key, (attempts + 1, expiry_time), timeout=lockout_duration)


def reset_login_attempts(username):
    """Reset login attempts counter after successful login"""
    cache_key = f"login_attempts_{username}"
    cache.delete(cache_key)


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
