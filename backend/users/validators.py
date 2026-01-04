"""
Validation utilities for MRD System
"""
import re
from django.core.exceptions import ValidationError


def validate_indian_phone(phone):
    """
    Validate Indian phone number format
    - Must be exactly 10 digits
    - Must start with 6, 7, 8, or 9
    - No spaces, dashes, or special characters
    """
    # Remove any whitespace
    phone = str(phone).strip()
    
    # Check if it's exactly 10 digits
    if not re.match(r'^\d{10}$', phone):
        raise ValidationError(
            'Phone number must be exactly 10 digits.',
            code='invalid_phone_length'
        )
    
    # Check if it starts with valid Indian mobile prefix (6, 7, 8, or 9)
    if not phone[0] in ['6', '7', '8', '9']:
        raise ValidationError(
            'Indian mobile numbers must start with 6, 7, 8, or 9.',
            code='invalid_phone_prefix'
        )
    
    return phone


def validate_klh_email(email):
    """
    Validate that email belongs to KL University domain
    - Must end with @klh.edu.in
    """
    email = str(email).strip().lower()
    
    if not email.endswith('@klh.edu.in'):
        raise ValidationError(
            'Email must be a valid KLH email address (@klh.edu.in).',
            code='invalid_email_domain'
        )
    
    # Basic email format check
    email_pattern = r'^[a-zA-Z0-9._%+-]+@klh\.edu\.in$'
    if not re.match(email_pattern, email):
        raise ValidationError(
            'Invalid email format. Must be username@klh.edu.in',
            code='invalid_email_format'
        )
    
    return email


def validate_student_id(student_id):
    """
    Validate student ID format
    Format: Alphanumeric, 6-12 characters
    Example patterns: 2021001234, STU2023456, KL21CSE123
    """
    student_id = str(student_id).strip().upper()
    
    # Must be alphanumeric
    if not student_id.isalnum():
        raise ValidationError(
            'Student ID must contain only letters and numbers (no spaces or special characters).',
            code='invalid_student_id_format'
        )
    
    # Length validation: 6-12 characters
    if len(student_id) < 6:
        raise ValidationError(
            'Student ID must be at least 6 characters long.',
            code='student_id_too_short'
        )
    
    if len(student_id) > 12:
        raise ValidationError(
            'Student ID cannot exceed 12 characters.',
            code='student_id_too_long'
        )
    
    # Must contain at least one digit
    if not any(char.isdigit() for char in student_id):
        raise ValidationError(
            'Student ID must contain at least one number.',
            code='student_id_missing_number'
        )
    
    return student_id


def validate_employee_id(employee_id):
    """
    Validate employee ID format
    Format: Alphanumeric, 4-10 characters
    Example patterns: EMP001, DOC123, KLH2023, E12345
    """
    employee_id = str(employee_id).strip().upper()
    
    # Must be alphanumeric
    if not employee_id.isalnum():
        raise ValidationError(
            'Employee ID must contain only letters and numbers (no spaces or special characters).',
            code='invalid_employee_id_format'
        )
    
    # Length validation: 4-10 characters
    if len(employee_id) < 4:
        raise ValidationError(
            'Employee ID must be at least 4 characters long.',
            code='employee_id_too_short'
        )
    
    if len(employee_id) > 10:
        raise ValidationError(
            'Employee ID cannot exceed 10 characters.',
            code='employee_id_too_long'
        )
    
    # Must contain at least one digit
    if not any(char.isdigit() for char in employee_id):
        raise ValidationError(
            'Employee ID must contain at least one number.',
            code='employee_id_missing_number'
        )
    
    return employee_id


def validate_username_unique(username, exclude_user_id=None):
    """
    Check if username is unique in the database
    
    Args:
        username: The username to check
        exclude_user_id: Optional user ID to exclude from check (for updates)
    
    Raises:
        ValidationError if username already exists
    """
    from .models import User
    
    username = str(username).strip().lower()
    
    # Check if username already exists
    queryset = User.objects.filter(username__iexact=username)
    
    # Exclude current user when updating
    if exclude_user_id:
        queryset = queryset.exclude(id=exclude_user_id)
    
    if queryset.exists():
        raise ValidationError(
            'This username is already taken. Please choose a different username.',
            code='username_exists'
        )
    
    return username


def validate_otp_format(otp):
    """
    Validate OTP format
    - Must be exactly 6 digits
    """
    otp = str(otp).strip()
    
    if not re.match(r'^\d{6}$', otp):
        raise ValidationError(
            'OTP must be exactly 6 digits.',
            code='invalid_otp_format'
        )
    
    return otp
