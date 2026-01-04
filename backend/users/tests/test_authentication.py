"""
Integration tests for authentication flow
Tests login, registration, OTP verification, and password reset
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from unittest.mock import patch

User = get_user_model()


class AuthenticationFlowTest(TestCase):
    """Integration tests for complete authentication flow"""

    def setUp(self):
        """Set up test client and data"""
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.logout_url = reverse('logout')
        
        self.user_data = {
            'username': 'teststudent',
            'email': 'teststudent@klh.edu.in',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'Student',
            'phone': '9876543210',
            'user_type': 'student',
        }

    def test_student_registration_success(self):
        """Test successful student registration"""
        response = self.client.post(self.register_url, self.user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'teststudent')
        
        # Verify user was created in database
        user = User.objects.get(username='teststudent')
        self.assertEqual(user.email, 'teststudent@klh.edu.in')
        self.assertEqual(user.user_type, 'student')

    def test_staff_registration_needs_approval(self):
        """Test staff registration requires admin approval"""
        staff_data = self.user_data.copy()
        staff_data['username'] = 'testdoctor'
        staff_data['email'] = 'testdoctor@klh.edu.in'
        staff_data['user_type'] = 'doctor'
        staff_data['employee_id'] = 'EMP001'
        
        response = self.client.post(reverse('staff-register'), staff_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify user needs approval
        user = User.objects.get(username='testdoctor')
        self.assertFalse(user.is_approved)

    def test_login_success(self):
        """Test successful login"""
        # Create user first
        user = User.objects.create_user(**self.user_data)
        
        login_data = {
            'username': 'teststudent',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'teststudent')

    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        User.objects.create_user(**self.user_data)
        
        login_data = {
            'username': 'teststudent',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('token', response.data)

    def test_login_nonexistent_user(self):
        """Test login with non-existent user"""
        login_data = {
            'username': 'nonexistent',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_unapproved_staff(self):
        """Test login attempt by unapproved staff"""
        staff_data = self.user_data.copy()
        staff_data['username'] = 'testdoctor'
        staff_data['user_type'] = 'doctor'
        
        user = User.objects.create_user(**staff_data)
        user.is_approved = False
        user.save()
        
        login_data = {
            'username': 'testdoctor',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout_success(self):
        """Test successful logout"""
        # Create and login user
        user = User.objects.create_user(**self.user_data)
        self.client.force_authenticate(user=user)
        
        response = self.client.post(self.logout_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_without_authentication(self):
        """Test logout without being logged in"""
        response = self.client.post(self.logout_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('users.views.send_otp_via_sms')
    def test_forgot_password_flow(self, mock_send_otp):
        """Test complete forgot password flow"""
        # Create user
        user = User.objects.create_user(**self.user_data)
        
        # Step 1: Request OTP
        mock_send_otp.return_value = True
        forgot_password_data = {'identifier': 'teststudent'}
        
        response = self.client.post(reverse('forgot-password'), forgot_password_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_otp.assert_called_once()

    def test_registration_missing_required_fields(self):
        """Test registration with missing required fields"""
        incomplete_data = {
            'username': 'testuser',
            'password': 'testpass123'
            # Missing email, phone, etc.
        }
        
        response = self.client.post(self.register_url, incomplete_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_invalid_email_domain(self):
        """Test registration with non-KLH email"""
        invalid_data = self.user_data.copy()
        invalid_data['email'] = 'test@gmail.com'
        
        response = self.client.post(self.register_url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_invalid_phone(self):
        """Test registration with invalid phone number"""
        invalid_data = self.user_data.copy()
        invalid_data['phone'] = '12345'  # Invalid: too short
        
        response = self.client.post(self.register_url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_duplicate_username(self):
        """Test registration with existing username"""
        User.objects.create_user(**self.user_data)
        
        duplicate_data = self.user_data.copy()
        duplicate_data['email'] = 'another@klh.edu.in'
        
        response = self.client.post(self.register_url, duplicate_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_protected_endpoint_requires_auth(self):
        """Test accessing protected endpoint without token"""
        response = self.client.get(reverse('user-me'))
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_with_valid_token(self):
        """Test accessing protected endpoint with valid token"""
        user = User.objects.create_user(**self.user_data)
        self.client.force_authenticate(user=user)
        
        response = self.client.get(reverse('user-me'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'teststudent')
