from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
from .validators import validate_indian_phone, validate_klh_email


class User(AbstractUser):
    USER_TYPES = (
        ('admin', 'Administrator'),
        ('principal', 'Principal'),
        ('hod', 'Head of Department'),
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
        ('pharmacist', 'Pharmacist/Stock Manager'),
        ('employee', 'Employee'),
        ('student', 'Student'),
    )
    
    # Academic departments for HODs, students, and employees
    ACADEMIC_DEPARTMENTS = (
        ('CSE', 'Computer Science and Engineering'),
        ('ECE', 'Electronics and Communication Engineering'),
        ('AIDS', 'Artificial Intelligence and Data Science'),
    )
    
    user_type = models.CharField(max_length=15, choices=USER_TYPES, default='student')
    phone = models.CharField(max_length=15)
    employee_id = models.CharField(max_length=20, blank=True, null=True)
    student_id = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True)
    is_available = models.BooleanField(default=True)  # For doctors/nurses availability
    
    # Additional fields for better user management
    designation = models.CharField(max_length=100, blank=True)  # Job title for employees
    year_of_study = models.CharField(max_length=10, blank=True)  # For students
    course = models.CharField(max_length=100, blank=True)  # For students
    
    # Admin approval for medical staff
    is_approved = models.BooleanField(default=False)  # Medical staff need admin approval
    approved_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Validate that the correct ID field is provided based on user type"""
        super().clean()
        
        # Validate phone number format
        if self.phone:
            try:
                validate_indian_phone(self.phone)
            except ValidationError as e:
                raise ValidationError({'phone': e.message})
        else:
            raise ValidationError({'phone': 'Phone number is required.'})
        
        # Validate email domain
        if self.email:
            try:
                validate_klh_email(self.email)
            except ValidationError as e:
                raise ValidationError({'email': e.message})
        
        if self.user_type == 'student':
            if not self.student_id:
                raise ValidationError({'student_id': 'Student ID is required for students.'})
            if self.employee_id:
                raise ValidationError({'employee_id': 'Students should not have an employee ID.'})
        
        elif self.user_type in ['doctor', 'nurse', 'pharmacist', 'admin', 'principal', 'hod', 'employee']:
            if not self.employee_id:
                raise ValidationError({'employee_id': f'Employee ID is required for {dict(self.USER_TYPES).get(self.user_type, self.user_type).lower()}s.'})
            if self.student_id:
                raise ValidationError({'student_id': f'{dict(self.USER_TYPES).get(self.user_type, self.user_type)}s should not have a student ID.'})

    def save(self, *args, **kwargs):
        """Override save to ensure validation is called"""
        self.full_clean()
        super().save(*args, **kwargs)

    def get_display_id(self):
        """Return the appropriate ID based on user type"""
        if self.user_type == 'student':
            return self.student_id
        else:
            return self.employee_id

    def __str__(self):
        display_id = self.get_display_id()
        if display_id:
            return f"{self.username} ({self.get_user_type_display()}) - {display_id}"
        return f"{self.username} ({self.get_user_type_display()})"

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['phone'], name='users_phone_idx'),
            models.Index(fields=['student_id'], name='users_student_id_idx'),
            models.Index(fields=['employee_id'], name='users_employee_id_idx'),
            models.Index(fields=['user_type'], name='users_user_type_idx'),
            models.Index(fields=['is_approved'], name='users_is_approved_idx'),
            models.Index(fields=['department'], name='users_department_idx'),
            models.Index(fields=['email'], name='users_email_idx'),
            models.Index(fields=['username'], name='users_username_idx'),
            models.Index(fields=['is_available', 'user_type'], name='users_available_type_idx'),
        ]
