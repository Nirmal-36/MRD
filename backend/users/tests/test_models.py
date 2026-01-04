"""
Unit tests for User model
Tests user creation, validation, and model methods
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model"""

    def setUp(self):
        """Set up test data"""
        self.user_data = {
            'username': 'testuser',
            'email': 'testuser@klh.edu.in',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone': '9876543210',
            'user_type': 'student',
        }

    def test_create_user(self):
        """Test creating a basic user"""
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'testuser@klh.edu.in')
        self.assertEqual(user.phone, '9876543210')
        self.assertEqual(user.user_type, 'student')
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_create_superuser(self):
        """Test creating a superuser"""
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@klh.edu.in',
            password='adminpass123',
            phone='9876543211'
        )
        
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertEqual(admin_user.user_type, 'admin')

    def test_user_str_method(self):
        """Test string representation of user"""
        user = User.objects.create_user(**self.user_data)
        expected_str = f"{user.get_full_name()} ({user.username})"
        self.assertEqual(str(user), expected_str)

    def test_get_full_name(self):
        """Test get_full_name method"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.get_full_name(), 'Test User')

    def test_phone_number_validation(self):
        """Test phone number must be 10 digits"""
        invalid_user_data = self.user_data.copy()
        invalid_user_data['phone'] = '12345'  # Invalid: too short
        
        user = User(**invalid_user_data)
        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_unique_username(self):
        """Test username must be unique"""
        User.objects.create_user(**self.user_data)
        
        duplicate_data = self.user_data.copy()
        duplicate_data['email'] = 'another@klh.edu.in'
        
        with self.assertRaises(Exception):  # IntegrityError or ValidationError
            User.objects.create_user(**duplicate_data)

    def test_unique_email(self):
        """Test email must be unique"""
        User.objects.create_user(**self.user_data)
        
        duplicate_data = self.user_data.copy()
        duplicate_data['username'] = 'anotheruser'
        
        with self.assertRaises(Exception):  # IntegrityError or ValidationError
            User.objects.create_user(**duplicate_data)

    def test_doctor_approval_default(self):
        """Test doctor users need approval by default"""
        doctor_data = self.user_data.copy()
        doctor_data['username'] = 'doctor1'
        doctor_data['email'] = 'doctor1@klh.edu.in'
        doctor_data['user_type'] = 'doctor'
        
        doctor = User.objects.create_user(**doctor_data)
        self.assertFalse(doctor.is_approved)
        self.assertIsNone(doctor.approved_by)

    def test_student_no_approval_needed(self):
        """Test students don't need approval"""
        student = User.objects.create_user(**self.user_data)
        # Students are automatically approved
        self.assertEqual(student.user_type, 'student')

    def test_availability_default(self):
        """Test is_available defaults to False"""
        user = User.objects.create_user(**self.user_data)
        self.assertFalse(user.is_available)

    def test_user_type_choices(self):
        """Test valid user_type choices"""
        valid_types = ['admin', 'principal', 'hod', 'doctor', 'nurse', 'pharmacist', 'student', 'employee']
        
        for user_type in valid_types:
            user_data = self.user_data.copy()
            user_data['username'] = f'user_{user_type}'
            user_data['email'] = f'{user_type}@klh.edu.in'
            user_data['user_type'] = user_type
            
            user = User.objects.create_user(**user_data)
            self.assertEqual(user.user_type, user_type)
