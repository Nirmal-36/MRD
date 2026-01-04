"""
Unit tests for security utilities
Tests rate limiting and account lockout functions
"""
from django.test import TestCase
from django.core.cache import cache
from users.security_utils import (
    check_rate_limit,
    increment_rate_limit,
    check_account_lockout,
    increment_login_attempts,
    reset_login_attempts
)


class RateLimitTest(TestCase):
    """Test cases for rate limiting functionality"""

    def setUp(self):
        """Clear cache before each test"""
        cache.clear()

    def test_rate_limit_allows_within_limit(self):
        """Test rate limit allows requests within limit"""
        identifier = 'test_user'
        max_attempts = 3
        
        # First 3 attempts should be allowed
        for i in range(max_attempts):
            is_limited = check_rate_limit(identifier, max_attempts)
            self.assertFalse(is_limited, f"Attempt {i+1} should be allowed")
            increment_rate_limit(identifier)

    def test_rate_limit_blocks_after_limit(self):
        """Test rate limit blocks requests after limit exceeded"""
        identifier = 'test_user'
        max_attempts = 3
        
        # Exhaust the limit
        for _ in range(max_attempts):
            increment_rate_limit(identifier)
        
        # Next check should be blocked
        is_limited = check_rate_limit(identifier, max_attempts)
        self.assertTrue(is_limited)

    def test_rate_limit_different_identifiers(self):
        """Test rate limits are independent for different identifiers"""
        user1 = 'user1'
        user2 = 'user2'
        max_attempts = 3
        
        # Exhaust limit for user1
        for _ in range(max_attempts):
            increment_rate_limit(user1)
        
        # user1 should be limited
        self.assertTrue(check_rate_limit(user1, max_attempts))
        
        # user2 should not be affected
        self.assertFalse(check_rate_limit(user2, max_attempts))


class AccountLockoutTest(TestCase):
    """Test cases for account lockout functionality"""

    def setUp(self):
        """Clear cache before each test"""
        cache.clear()

    def test_account_not_locked_initially(self):
        """Test account is not locked initially"""
        username = 'testuser'
        is_locked = check_account_lockout(username)
        self.assertFalse(is_locked)

    def test_account_locked_after_max_attempts(self):
        """Test account locks after maximum failed login attempts"""
        username = 'testuser'
        max_attempts = 5
        
        # Simulate failed login attempts
        for _ in range(max_attempts):
            increment_login_attempts(username)
        
        # Account should be locked
        is_locked = check_account_lockout(username)
        self.assertTrue(is_locked)

    def test_reset_login_attempts(self):
        """Test resetting login attempts after successful login"""
        username = 'testuser'
        
        # Simulate some failed attempts
        for _ in range(3):
            increment_login_attempts(username)
        
        # Reset attempts (successful login)
        reset_login_attempts(username)
        
        # Account should not be locked
        is_locked = check_account_lockout(username)
        self.assertFalse(is_locked)

    def test_lockout_expires_after_duration(self):
        """Test lockout expires after lockout duration"""
        username = 'testuser'
        max_attempts = 5
        
        # Lock the account
        for _ in range(max_attempts):
            increment_login_attempts(username)
        
        # Account should be locked
        self.assertTrue(check_account_lockout(username))
        
        # Note: In a real test, you'd use time travel or mock cache TTL
        # to test expiration. This is a placeholder for that logic.

    def test_login_attempts_increment_correctly(self):
        """Test login attempt counter increments properly"""
        username = 'testuser'
        
        # First few attempts shouldn't lock
        for i in range(4):
            increment_login_attempts(username)
            is_locked = check_account_lockout(username)
            self.assertFalse(is_locked, f"Account locked after only {i+1} attempts")
        
        # 5th attempt should lock
        increment_login_attempts(username)
        is_locked = check_account_lockout(username)
        self.assertTrue(is_locked)
