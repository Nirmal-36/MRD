from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.exceptions import ValidationError
from .validators import validate_indian_phone, validate_klh_email
from .managers import UserManager

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
    # approved_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    approved_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_users',
        db_constraint=False
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = UserManager()


    def clean(self):
        """Validate that the correct ID field is provided based on user type"""
        super().clean()
        
        # Validate phone number format (required)
        if not self.phone:
            raise ValidationError({'phone': 'Phone number is required.'})
        
        try:
            validate_indian_phone(self.phone)
        except ValidationError as e:
            raise ValidationError({'phone': e.message})
        
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


class ProfileChangeRequest(models.Model):
    """
    Model to handle user requests for changing their full name or username
    Requires admin approval
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='profile_change_requests',
        help_text="User requesting the change",
        db_constraint=False
    )
    
    # Current values
    current_first_name = models.CharField(max_length=150)
    current_last_name = models.CharField(max_length=150)
    current_username = models.CharField(max_length=150)
    
    # Requested new values
    requested_first_name = models.CharField(max_length=150, blank=True)
    requested_last_name = models.CharField(max_length=150, blank=True)
    requested_username = models.CharField(max_length=150, blank=True)
    
    # Request details
    reason = models.TextField(help_text="Reason for requesting the change")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    # Admin action
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_change_requests',
        limit_choices_to={'user_type': 'admin'},
        help_text="Admin who reviewed this request",
        db_constraint=False
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True, help_text="Admin's notes or reason for rejection")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def clean(self):
        """Validate that at least one field is being requested to change"""
        super().clean()
        
        # Check if at least one field is different from current
        # first_name_changed = self.requested_first_name and self.requested_first_name != self.current_first_name
        # last_name_changed = self.requested_last_name and self.requested_last_name != self.current_last_name
        # username_changed = self.requested_username and self.requested_username != self.current_username

        changed = any([
            self.requested_first_name and self.requested_first_name != self.current_first_name,
            self.requested_last_name and self.requested_last_name != self.current_last_name,
            self.requested_username and self.requested_username != self.current_username,
        ])
        
        # if not (first_name_changed or last_name_changed or username_changed):
        #     raise ValidationError('At least one field (first name, last name, or username) must be different from the current value.')

        if not changed:
            raise ValidationError('At least one field must be changed.')
        
        # Validate username uniqueness if changing
        # if username_changed:
        #     if User.objects.filter(username=self.requested_username).exclude(id=self.user.id).exists():
        #         raise ValidationError({'requested_username': 'This username is already taken.'})

        if self.requested_username:
            if User.objects.filter(username=self.requested_username).exclude(id=self.user.id).exists():
                raise ValidationError({'requested_username': 'This username is already taken.'})
    
    def approve(self, admin_user, notes=''):
        """Approve the change request and update user profile"""
        from django.utils import timezone
        
        self.status = 'approved'
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        
        # Update user profile
        if self.requested_first_name and self.requested_first_name != self.current_first_name:
            self.user.first_name = self.requested_first_name
        if self.requested_last_name and self.requested_last_name != self.current_last_name:
            self.user.last_name = self.requested_last_name
        if self.requested_username and self.requested_username != self.current_username:
            self.user.username = self.requested_username
        
        self.user.save()
        self.save()
    
    def reject(self, admin_user, notes=''):
        """Reject the change request"""
        from django.utils import timezone
        
        self.status = 'rejected'
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        self.save()
    
    def __str__(self):
        return f"{self.user.username} - {self.get_status_display()} ({self.created_at.strftime('%Y-%m-%d')})"
    
    class Meta:
        db_table = 'profile_change_requests'
        ordering = ['-created_at']
        verbose_name = 'Profile Change Request'
        verbose_name_plural = 'Profile Change Requests'
        indexes = [
            models.Index(fields=['user', 'status'], name='pcr_user_status_idx'),
            models.Index(fields=['status', 'created_at'], name='pcr_status_created_idx'),
        ]
