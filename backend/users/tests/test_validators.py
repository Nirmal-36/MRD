"""
Unit tests for validation utilities
Tests phone, email, and username validation functions
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from users.validators import (
    validate_indian_phone,
    validate_klh_email,
    validate_username_unique
)
from django.contrib.auth import get_user_model

User = get_user_model()


class PhoneValidationTest(TestCase):
    """Test cases for Indian phone number validation"""

    def test_valid_phone_numbers(self):
        """Test valid Indian phone numbers"""
        valid_phones = [
            '9876543210',
            '8765432109',
            '7654321098',
            '6543210987',
        ]
        
        for phone in valid_phones:
            try:
                validate_indian_phone(phone)
            except ValidationError:
                self.fail(f"Valid phone {phone} raised ValidationError")

    def test_invalid_phone_starts_with_invalid_digit(self):
        """Test phone numbers starting with invalid digits (0-5)"""
        invalid_phones = ['0123456789', '1234567890', '5432109876']
        
        for phone in invalid_phones:
            with self.assertRaises(ValidationError):
                validate_indian_phone(phone)

    def test_invalid_phone_wrong_length(self):
        """Test phone numbers with incorrect length"""
        invalid_phones = [
            '987654321',      # 9 digits
            '98765432101',    # 11 digits
            '987',            # Too short
        ]
        
        for phone in invalid_phones:
            with self.assertRaises(ValidationError):
                validate_indian_phone(phone)

    def test_invalid_phone_non_numeric(self):
        """Test phone numbers with non-numeric characters"""
        invalid_phones = [
            '987654321a',
            '98765-43210',
            '+919876543210',
        ]
        
        for phone in invalid_phones:
            with self.assertRaises(ValidationError):
                validate_indian_phone(phone)


class EmailValidationTest(TestCase):
    """Test cases for KLH email validation"""

    def test_valid_klh_emails(self):
        """Test valid @klh.edu.in emails"""
        valid_emails = [
            'student@klh.edu.in',
            'faculty@klh.edu.in',
            'test.user@klh.edu.in',
            'john.doe123@klh.edu.in',
        ]
        
        for email in valid_emails:
            try:
                validate_klh_email(email)
            except ValidationError:
                self.fail(f"Valid email {email} raised ValidationError")

    def test_invalid_email_wrong_domain(self):
        """Test emails with non-KLH domains"""
        invalid_emails = [
            'student@gmail.com',
            'user@yahoo.com',
            'test@klh.com',
            'test@edu.in',
        ]
        
        for email in invalid_emails:
            with self.assertRaises(ValidationError):
                validate_klh_email(email)

    def test_invalid_email_format(self):
        """Test malformed email addresses"""
        invalid_emails = [
            'notanemail',
            '@klh.edu.in',
            'test@',
            'test @klh.edu.in',
        ]
        
        for email in invalid_emails:
            with self.assertRaises(ValidationError):
                validate_klh_email(email)


class UsernameValidationTest(TestCase):
    """Test cases for username uniqueness validation"""

    def setUp(self):
        """Create test users"""
        User.objects.create_user(
            username='existinguser',
            email='existing@klh.edu.in',
            password='testpass123',
            phone='9876543210'
        )

    def test_unique_username_valid(self):
        """Test validation passes for unique username"""
        try:
            validate_username_unique('newuser')
        except ValidationError:
            self.fail("Unique username raised ValidationError")

    def test_duplicate_username_invalid(self):
        """Test validation fails for duplicate username"""
        with self.assertRaises(ValidationError):
            validate_username_unique('existinguser')

    def test_case_insensitive_username_check(self):
        """Test username uniqueness is case-insensitive"""
        with self.assertRaises(ValidationError):
            validate_username_unique('EXISTINGUSER')
        
        with self.assertRaises(ValidationError):
            validate_username_unique('ExistingUser')
