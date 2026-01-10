from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from typing import Union
from .models import User
from .serializers import (
    UserSerializer, UserUpdateSerializer, LoginSerializer, 
    ChangePasswordSerializer, UserRegistrationSerializer,
    PatientRegistrationSerializer, MedicalStaffApprovalSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, VerifyOTPSerializer
)
from .permissions import (
    IsAdminUser, IsMedicalStaff, PatientRestrictedViewPermission
)
from .otp_utils import generate_otp, store_otp, verify_otp, send_otp_email, clear_otp, is_otp_verified
from .security_utils import (
    check_account_lockout, increment_login_attempts, reset_login_attempts,
    check_rate_limit, increment_rate_limit, reset_rate_limit, get_client_ip
)


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination class for list views"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, PatientRestrictedViewPermission]
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        elif self.action == 'register':
            return UserRegistrationSerializer
        elif self.action == 'patient_register':
            return PatientRegistrationSerializer
        elif self.action == 'approve_staff':
            return MedicalStaffApprovalSerializer
        elif self.action == 'login':
            return LoginSerializer
        elif self.action == 'change_password':
            return ChangePasswordSerializer
        elif self.action == 'forgot_password':
            return ForgotPasswordSerializer
        elif self.action == 'verify_otp':
            return VerifyOTPSerializer
        elif self.action == 'reset_password':
            return ResetPasswordSerializer
        return UserSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['login', 'patient_register', 'forgot_password', 'verify_otp', 'reset_password']:
            permission_classes = [AllowAny]
        elif self.action == 'register':
            permission_classes = [AllowAny]
        elif self.action in ['doctors', 'nurses']:
            # Allow all authenticated users to view available doctors/nurses
            permission_classes = [IsAuthenticated]
        elif self.action == 'list':
            user_type = self.request.GET.get('user_type')
            is_available = self.request.GET.get('is_available')
            if user_type == 'doctor' and is_available == 'true':
                permission_classes = [IsAuthenticated]
            else:
                permission_classes = [IsAuthenticated, IsMedicalStaff]
        elif self.action in ['create', 'destroy', 'approve_staff']:
            permission_classes = [IsAuthenticated, IsAdminUser]
        elif self.action in ['me', 'change_password']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, PatientRestrictedViewPermission]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter queryset based on user role and query params
        Optimized with select_related for approved_by field
        """
        user = self.request.user
        if not user.is_authenticated:
            return User.objects.none()
        user_type = getattr(user, 'user_type', None)
        user_id = getattr(user, 'id', None)
        
        # Base queryset with optimization
        base_queryset = User.objects.select_related('approved_by')
        
        if user_type in ['admin', 'principal', 'hod', 'doctor', 'nurse']:
            return base_queryset.all()
        # Students and employees (patients) can only see their own profile, unless requesting available doctors
        if user_type in ['student', 'employee']:
            req_user_type = self.request.GET.get('user_type')
            req_is_available = self.request.GET.get('is_available')
            if req_user_type == 'doctor' and req_is_available == 'true':
                return base_queryset.filter(
                    user_type='doctor', 
                    is_available=True, 
                    is_active=True
                ).only('id', 'username', 'first_name', 'last_name', 'email', 'phone', 'department', 'designation')
            return base_queryset.filter(id=user_id)
        
        return User.objects.none()
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """User login endpoint with account lockout protection"""
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get username from request
        username = request.data.get('username', '')
        
        # Check if account is locked
        is_locked, attempts_left, lockout_remaining = check_account_lockout(username)
        if is_locked:
            minutes = lockout_remaining // 60
            seconds = lockout_remaining % 60
            return Response({
                'error': f'Account temporarily locked due to multiple failed login attempts. Please try again in {minutes}m {seconds}s.',
                'lockout_remaining': lockout_remaining
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        user = serializer.validated_data['user']
        
        # Successful login - reset failed attempts
        reset_login_attempts(username)
        
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user).data
        
        return Response({
            'token': token.key,
            'user': user_data,
            'message': 'Login successful'
        })
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """User logout endpoint"""
        try:
            Token.objects.filter(user=request.user).delete()
            logout(request)
            return Response({'message': 'Logout successful'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """User registration endpoint"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user_type = serializer.validated_data.get('user_type')
            user = serializer.save()
            
            # Medical staff, principal, and HOD need admin approval
            if user_type in ['doctor', 'nurse', 'pharmacist', 'principal', 'hod']:
                user.is_approved = False
                user.save()
                user_data = UserSerializer(user).data
                return Response({
                    'user': user_data,
                    'message': 'Registration submitted. Please wait for admin approval to access the system.'
                }, status=status.HTTP_201_CREATED)
            else:
                # Students, employees, etc. get immediate access
                user.is_approved = True
                user.save()
                token, created = Token.objects.get_or_create(user=user)
                user_data = UserSerializer(user).data
                return Response({
                    'token': token.key,
                    'user': user_data,
                    'message': 'Registration successful! You can now access the system.'
                }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def patient_register(self, request):
        """
        Patient registration endpoint (students and employees).
        Note: Patient medical records are created by medical staff during first visit.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            token, created = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            return Response({
                'token': token.key,
                'user': user_data,
                'message': 'Registration successful! Your medical record will be created when you visit the medical facility.'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user info"""
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = UserSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                user = serializer.save()
                if isinstance(user, User) and 'phone' in request.data:
                    patient = getattr(user, 'patient_record', None)
                    if patient is not None and getattr(patient, 'phone', None) is not None:
                        patient.phone = user.phone
                        patient.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            new_password = serializer.validated_data.get('new_password') if serializer.validated_data else None
            if new_password:
                user.set_password(new_password)
                user.save()
                return Response({'message': 'Password changed successfully'})
            else:
                return Response({'error': 'New password not provided.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def forgot_password(self, request):
        """Verify user exists and send OTP to their phone number with rate limiting"""
        serializer = ForgotPasswordSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.context.get('user')
        if not user or not user.phone:
            return Response({'error': 'User or phone not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check rate limit: 3 OTP requests per phone per 5 minutes
        is_allowed, attempts_left, retry_after = check_rate_limit(
            f"otp_request_{user.phone}", 
            max_attempts=3, 
            time_window=300  # 5 minutes
        )
        
        if not is_allowed:
            minutes = retry_after // 60
            seconds = retry_after % 60
            return Response({
                'error': f'Too many OTP requests. Please try again in {minutes}m {seconds}s.',
                'retry_after': retry_after
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Generate and send OTP
        otp = generate_otp()
        store_otp(user.email, otp)
        success, message = send_otp_email(user.email, otp)
        
        if success:
            # Increment rate limit counter
            increment_rate_limit(f"otp_request_{user.email}", time_window=300)
            
            # Mask email for security
            email_parts = user.email.split('@')
            masked_email = email_parts[0][:2] + '*' * (len(email_parts[0]) - 2) + '@' + email_parts[1]
            return Response({
                'success': True,
                'message': f'OTP sent to {masked_email}',
                'email': user.email,
                'username': user.username,
                'full_name': user.get_full_name() or user.username,
                'user_type': user.get_user_type_display(),
                'attempts_left': attempts_left - 1
            })
        else:
            return Response({
                'error': message
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verify_otp(self, request):
        """Verify OTP before allowing password reset with rate limiting"""
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        
        # Check rate limit: 5 verification attempts per email per 5 minutes
        is_allowed, attempts_left, retry_after = check_rate_limit(
            f"otp_verify_{email}", 
            max_attempts=5, 
            time_window=300
        )
        
        if not is_allowed:
            minutes = retry_after // 60
            seconds = retry_after % 60
            return Response({
                'error': f'Too many verification attempts. Please try again in {minutes}m {seconds}s.',
                'retry_after': retry_after
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        is_valid, message = verify_otp(email, otp, delete_after_verify=False)
        
        if is_valid:
            # Reset rate limit on successful verification
            reset_rate_limit(f"otp_verify_{email}")
            return Response({
                'success': True,
                'message': 'OTP verified successfully. You can now reset your password.',
                'email': email
            })
        else:
            # Increment rate limit counter on failed verification
            increment_rate_limit(f"otp_verify_{email}", time_window=300)
            
            # Provide better error messages based on failure reason
            if 'expired' in message.lower() or 'not found' in message.lower():
                return Response({
                    'error': 'OTP has expired or not found. Please request a new OTP.',
                    'error_code': 'OTP_EXPIRED',
                    'attempts_left': attempts_left - 1
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'error': 'Invalid OTP. Please check and try again.',
                    'error_code': 'INVALID_OTP',
                    'attempts_remaining': f'{attempts_left - 1} attempts left',
                    'attempts_left': attempts_left - 1
                }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password(self, request):
        """Reset password after OTP verification"""
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            user = serializer.validated_data['user']
            new_password = serializer.validated_data['new_password']
            
            # Check if OTP was previously verified
            if not is_otp_verified(email, otp):
                # If not verified, try to verify it now
                is_valid, message = verify_otp(email, otp, delete_after_verify=False)
                
                if not is_valid:
                    return Response({
                        'error': 'OTP verification failed. Please request a new OTP.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Reset password
            user.set_password(new_password)
            user.save()
            
            # Delete old tokens
            Token.objects.filter(user=user).delete()
            
            # Clear OTP and verification status
            clear_otp(email)
            
            return Response({
                'success': True,
                'message': 'Password reset successfully. You can now login with your new password.'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def doctors(self, request):
        """Get all available doctors"""
        doctors = User.objects.filter(user_type='doctor', is_active=True, is_available=True)
        serializer = UserSerializer(doctors, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def nurses(self, request):
        """Get all nurses"""
        nurses = User.objects.filter(user_type='nurse', is_active=True)
        serializer = UserSerializer(nurses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pharmacists(self, request):
        """Get all pharmacists"""
        pharmacists = User.objects.filter(user_type='pharmacist', is_active=True, is_approved=True)
        serializer = UserSerializer(pharmacists, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_approval(self, request):
        """Get users pending approval (Admin only)"""
        pending_users = User.objects.filter(
            user_type__in=['doctor', 'nurse', 'pharmacist', 'principal', 'hod'],
            is_approved=False
        )
        serializer = UserSerializer(pending_users, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve_staff(self, request, pk=None):
        """Approve user registration (Admin only)"""
        user = self.get_object()
        if user.user_type not in ['doctor', 'nurse', 'pharmacist', 'principal', 'hod']:
            return Response({'error': 'Only medical staff, principal, and HOD can be approved through this endpoint.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(user, data={'is_approved': True, 'is_active': True}, partial=True)
        if serializer.is_valid():
            approved_user = serializer.save()
            return Response({
                'user': UserSerializer(approved_user).data,
                'message': f'{approved_user.get_user_type_display()} {approved_user.get_full_name() or approved_user.username} has been approved and activated.'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_visits(self, request):
        """Get patient's visit history (Patients only)"""
        user_type = getattr(request.user, 'user_type', None)
        if user_type not in ['student', 'employee']:
            return Response({'error': 'This endpoint is for patients only.'}, status=status.HTTP_403_FORBIDDEN)
        
        # This would typically fetch patient records, but for now return basic info
        # You would implement this with the Patient model relationship
        return Response({
            'message': 'Visit history feature will be implemented with patient records.',
            'patient': UserSerializer(request.user).data
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def available_doctors(self, request):
        """Get available doctors"""
        doctors = User.objects.filter(
            user_type='doctor', 
            is_available=True, 
            is_active=True
        )
        serializer = UserSerializer(doctors, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_nurses(self, request):
        """Get available nurses"""
        nurses = User.objects.filter(
            user_type='nurse', 
            is_available=True, 
            is_active=True
        )
        serializer = UserSerializer(nurses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        """Toggle user availability status"""
        user = self.get_object()
        if user.user_type in ['doctor', 'nurse']:
            user.is_available = not user.is_available
            user.save()
            return Response({
                'status': 'success',
                'is_available': user.is_available,
                'message': f'User availability updated to {"available" if user.is_available else "unavailable"}'
            })
        return Response({
            'status': 'error',
            'message': 'Only doctors and nurses can have availability status'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search users by name, username, or employee/student ID"""
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(employee_id__icontains=query) |
            Q(student_id__icontains=query) |
            Q(email__icontains=query)
        ).filter(is_active=True)
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def department_choices(self, request):
        """Get available academic department choices"""
        return Response({
            'academic_departments': [
                {'value': code, 'label': name} 
                for code, name in User.ACADEMIC_DEPARTMENTS
            ]
        })
