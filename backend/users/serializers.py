from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User
from .otp_utils import verify_otp
from .validators import (
    validate_indian_phone, validate_klh_email, validate_otp_format,
    validate_username_unique
)
from .security_utils import increment_login_attempts


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    display_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'user_type', 'phone', 'employee_id', 'student_id', 'display_id',
            'department', 'designation', 'year_of_study', 'course',
            'is_available', 'is_active', 'is_approved', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'full_name', 'display_id', 'is_approved']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
    
    def get_display_id(self, obj):
        """Return the appropriate ID based on user type"""
        if obj.user_type == 'student':
            return obj.student_id
        else:
            return obj.employee_id
    



class UserUpdateSerializer(serializers.ModelSerializer):
    employee_id = serializers.CharField(required=False, allow_blank=True)
    student_id = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone',
            'employee_id', 'student_id', 'department', 'is_available'
        ]
    
    def validate(self, data):
        user = self.instance
        user_type = user.user_type  # Can't change user_type in update
        employee_id = data.get('employee_id', user.employee_id)
        student_id = data.get('student_id', user.student_id)
        
        # Validate ID fields based on user type
        if user_type == 'student':
            if not student_id:
                raise serializers.ValidationError({'student_id': 'Student ID is required for students.'})
            if employee_id:
                raise serializers.ValidationError({'employee_id': 'Students should not have an employee ID.'})
        
        elif user_type in ['doctor', 'nurse', 'pharmacist', 'admin', 'principal', 'hod', 'employee']:
            if not employee_id:
                user_type_display = dict(User.USER_TYPES).get(user_type, user_type) or user_type
                raise serializers.ValidationError({'employee_id': f'Employee ID is required for {user_type_display.lower()}s.'})
            if student_id:
                user_type_display = dict(User.USER_TYPES).get(user_type, user_type) or user_type
                raise serializers.ValidationError({'student_id': f'{user_type_display}s should not have a student ID.'})
        
        return data
    
    def update(self, instance, validated_data):
        # Clean up empty ID fields
        if not validated_data.get('employee_id'):
            validated_data['employee_id'] = None
        if not validated_data.get('student_id'):
            validated_data['student_id'] = None
            
        return super().update(instance, validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if not user.is_active:
                    if not user.is_approved:
                        raise serializers.ValidationError('Your account is pending admin approval. Please wait for approval to access the system.')
                    raise serializers.ValidationError('User account is disabled.')
                data['user'] = user
                return data
            else:
                # Increment failed login attempts
                increment_login_attempts(username)
                raise serializers.ValidationError('Invalid username or password.')
        else:
            raise serializers.ValidationError('Must include username and password.')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords don't match.")
        return data
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for requesting password reset - accepts username, phone, or email"""
    identifier = serializers.CharField(help_text="Username, phone number, or email")
    
    def validate_identifier(self, value):
        """Try to find user by username, phone, or email"""
        user = None
        
        # Try username first
        try:
            user = User.objects.get(username=value)
        except User.DoesNotExist:
            pass
        
        # Try phone number
        if not user and value:
            user = User.objects.filter(phone=value).first()
        
        # Try email
        if not user and value:
            user = User.objects.filter(email=value).first()
        
        if not user:
            raise serializers.ValidationError('No user found with this username, phone, or email.')
        
        if not user.phone:
            raise serializers.ValidationError('User does not have a phone number registered. Please contact admin.')
        
        # Store the user object for later use
        self.context['user'] = user
        return value


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    phone = serializers.CharField()
    otp = serializers.CharField(min_length=6, max_length=6)
    
    def validate_phone(self, value):
        """Validate Indian phone number format"""
        try:
            return validate_indian_phone(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
    
    def validate_otp(self, value):
        """Validate OTP format"""
        try:
            return validate_otp_format(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for resetting password with OTP verification"""
    phone = serializers.CharField()
    otp = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate_phone(self, value):
        """Validate Indian phone number format"""
        try:
            return validate_indian_phone(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
    
    def validate_otp(self, value):
        """Validate OTP format"""
        try:
            return validate_otp_format(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
    
    def validate_new_password(self, value):
        """Validate password strength"""
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long.')
        return value
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': "Passwords don't match."})
        
        phone = data.get('phone')
        user = User.objects.filter(phone=phone).first()
        
        if not user:
            raise serializers.ValidationError({'phone': 'No account found with this phone number.'})
        
        data['user'] = user
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=True, min_length=10, max_length=15)
    employee_id = serializers.CharField(required=False, allow_blank=True)
    student_id = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'password', 'confirm_password',
            'user_type', 'phone', 'employee_id', 'student_id', 'department'
        ]
        extra_kwargs = {
            'phone': {'required': True}
        }
    
    def validate_phone(self, value):
        """Validate Indian phone number format"""
        try:
            validated_phone = validate_indian_phone(value)
            # Check if phone already exists
            if User.objects.filter(phone=validated_phone).exists():
                raise serializers.ValidationError('This phone number is already registered.')
            return validated_phone
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
    
    def validate_email(self, value):
        """Validate KLH email domain"""
        try:
            return validate_klh_email(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
    
    def validate_username(self, value):
        """Check username uniqueness"""
        try:
            return validate_username_unique(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
    
    def validate(self, data):
        # Check password confirmation
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': "Passwords don't match."})
        
        user_type = data.get('user_type')
        employee_id = data.get('employee_id')
        student_id = data.get('student_id')
        department = data.get('department')
        
        # Validate ID fields based on user type
        if user_type == 'student':
            if not student_id:
                raise serializers.ValidationError({'student_id': 'Student ID is required for students.'})
            if employee_id:
                raise serializers.ValidationError({'employee_id': 'Students should not have an employee ID.'})
        
        elif user_type in ['doctor', 'nurse', 'pharmacist', 'admin', 'principal', 'hod', 'employee']:
            if not employee_id:
                user_type_display = dict(User.USER_TYPES).get(user_type, user_type) or user_type
                raise serializers.ValidationError({'employee_id': f'Employee ID is required for {user_type_display.lower()}s.'})
            if student_id:
                user_type_display = dict(User.USER_TYPES).get(user_type, user_type) or user_type
                raise serializers.ValidationError({'student_id': f'{user_type_display}s should not have a student ID.'})
        
        # Department validation based on user type
        valid_academic_depts = ['CSE', 'ECE', 'AIDS']
        
        if user_type == 'hod':
            if not department:
                raise serializers.ValidationError({'department': 'Department is required for Head of Department.'})
            if department not in valid_academic_depts:
                raise serializers.ValidationError({
                    'department': f'HOD department must be one of: {", ".join(valid_academic_depts)}'
                })
        
        if user_type in ['student', 'employee']:
            if not department:
                raise serializers.ValidationError({'department': 'Department is required for students and employees.'})
            if department not in valid_academic_depts:
                raise serializers.ValidationError({
                    'department': f'Department must be one of: {", ".join(valid_academic_depts)}'
                })
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user_type = validated_data.get('user_type')
        
        # Clean up empty ID fields
        if not validated_data.get('employee_id'):
            validated_data['employee_id'] = None
        if not validated_data.get('student_id'):
            validated_data['student_id'] = None
        
        # Set approval status based on user type
        if user_type in ['student', 'employee']:
            # Patients can register themselves and are automatically approved
            validated_data['is_approved'] = True
        elif user_type in ['doctor', 'nurse', 'pharmacist', 'principal', 'hod']:
            # Medical staff, principal, and HOD need admin approval
            validated_data['is_approved'] = False
            validated_data['is_active'] = False  # Inactive until approved
        elif user_type == 'admin':
            # Admins are auto-approved (should be created via Django admin)
            validated_data['is_approved'] = True
            
        user = User.objects.create_user(password=password, **validated_data)
        return user


class PatientRegistrationSerializer(serializers.ModelSerializer):
    """Simplified registration for patients (students and employees)"""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=True, min_length=10, max_length=15)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'password', 'confirm_password',
            'user_type', 'phone', 'employee_id', 'student_id', 'department', 
            'designation', 'year_of_study', 'course'
        ]
        extra_kwargs = {
            'user_type': {'required': True},
            'phone': {'required': True}
        }
    
    def validate_user_type(self, value):
        """Only allow patient types for this registration"""
        if value not in ['student', 'employee']:
            raise serializers.ValidationError("Only students and employees can register through this endpoint.")
        return value
    
    def validate_phone(self, value):
        """Validate Indian phone number format"""
        try:
            validated_phone = validate_indian_phone(value)
            # Check if phone already exists
            if User.objects.filter(phone=validated_phone).exists():
                raise serializers.ValidationError('This phone number is already registered.')
            return validated_phone
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
    
    def validate_email(self, value):
        """Validate KLH email domain"""
        try:
            return validate_klh_email(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
    
    def validate_username(self, value):
        """Check username uniqueness"""
        try:
            return validate_username_unique(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
    
    def validate(self, data):
        # Check password confirmation
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': "Passwords don't match."})
        
        user_type = data.get('user_type')
        employee_id = data.get('employee_id')
        student_id = data.get('student_id')
        department = data.get('department')
        
        # Validate based on user type
        if user_type == 'student':
            if not student_id:
                raise serializers.ValidationError({'student_id': 'Student ID is required for students.'})
            if employee_id:
                raise serializers.ValidationError({'employee_id': 'Students should not have an employee ID.'})
        elif user_type == 'employee':
            if not employee_id:
                raise serializers.ValidationError({'employee_id': 'Employee ID is required for employees.'})
            if student_id:
                raise serializers.ValidationError({'student_id': 'Employees should not have a student ID.'})
        
        # Department validation for students and employees
        valid_academic_depts = ['CSE', 'ECE', 'AIDS']
        if user_type in ['student', 'employee']:
            if not department:
                raise serializers.ValidationError({'department': 'Department is required for students and employees.'})
            if department not in valid_academic_depts:
                raise serializers.ValidationError({
                    'department': f'Department must be one of: {", ".join(valid_academic_depts)}'
                })
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        # Clean up empty ID fields
        if not validated_data.get('employee_id'):
            validated_data['employee_id'] = None
        if not validated_data.get('student_id'):
            validated_data['student_id'] = None
        
        # Patients are automatically approved
        validated_data['is_approved'] = True
        validated_data['is_active'] = True
            
        user = User.objects.create_user(password=password, **validated_data)
        return user


class MedicalStaffApprovalSerializer(serializers.ModelSerializer):
    """Serializer for admin to approve medical staff"""
    
    class Meta:
        model = User
        fields = ['is_approved', 'is_active']
        
    def update(self, instance, validated_data):
        if validated_data.get('is_approved'):
            validated_data['is_active'] = True
            validated_data['approved_by'] = self.context['request'].user
            from django.utils import timezone
            validated_data['approved_at'] = timezone.now()
        
        return super().update(instance, validated_data)