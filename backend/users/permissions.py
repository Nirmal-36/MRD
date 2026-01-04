from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to admin users"""
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type == 'admin'
        )


class IsMedicalStaff(BasePermission):
    """
    Allow access to doctors and admin (approved medical staff).
    Note: In this system, doctors handle all medical staff responsibilities
    including nursing duties. Nurse type is kept for backward compatibility.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type in ['doctor', 'nurse', 'admin'] and
            (request.user.user_type == 'admin' or request.user.is_approved)
        )


class IsPharmacist(BasePermission):
    """Allow access to pharmacist/stock managers and admin"""
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type in ['pharmacist', 'admin'] and
            (request.user.user_type == 'admin' or request.user.is_approved)
        )


class IsPharmacistOrPatientReadOnly(BasePermission):
    """
    Pharmacists have full access, patients can only view basic medicine info
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Admin has full access
        if request.user.user_type == 'admin':
            return True
        
        # Approved pharmacists have full access
        if request.user.user_type == 'pharmacist' and request.user.is_approved:
            return True
        
        # Approved medical staff have read access for prescribing
        if request.user.user_type in ['doctor', 'nurse'] and request.user.is_approved:
            return request.method in ['GET', 'HEAD', 'OPTIONS']
        
        # Patients can only view basic medicine information (read-only)
        if request.user.user_type in ['student', 'employee']:
            return request.method in ['GET', 'HEAD', 'OPTIONS']
        
        return False


class IsDoctorOrAdmin(BasePermission):
    """Allow access to doctors and admin (approved doctors only)"""
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type in ['doctor', 'admin'] and
            (request.user.user_type == 'admin' or request.user.is_approved)
        )


class IsPatient(BasePermission):
    """Allow access to patients (students and employees)"""
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type in ['student', 'employee']
        )


class IsPrincipal(BasePermission):
    """Allow access to principal and admin"""
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type in ['principal', 'admin'] and
            (request.user.user_type == 'admin' or (request.user.is_approved and request.user.is_active))
        )


class IsHOD(BasePermission):
    """Allow access to HOD and admin"""
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type in ['hod', 'admin'] and
            (request.user.user_type == 'admin' or (request.user.is_approved and request.user.is_active))
        )


class IsOwnerOrMedicalStaff(BasePermission):
    """Allow users to access their own data or medical staff to access any data"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Users can access their own data
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        
        # Medical staff and admin can access all data (if approved)
        if request.user.user_type == 'admin':
            return True
        if request.user.user_type in ['doctor', 'nurse'] and request.user.is_approved:
            return True
        
        return False


class IsPatientReadOnly(BasePermission):
    """Patients (students/employees) can only perform read operations on their own data"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Admin and approved medical staff have full access
        if request.user.user_type == 'admin':
            return True
        if request.user.user_type in ['doctor', 'nurse', 'pharmacist'] and request.user.is_approved:
            return True
        
        # Patients can only read their own data
        if request.user.user_type in ['student', 'employee']:
            return request.method in ['GET', 'HEAD', 'OPTIONS']
        
        return False


class PatientRestrictedViewPermission(BasePermission):
    """
    Patients (students/employees) have access to their own visit history and basic hospital info.
    Medical staff have full access based on their role.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Admin has full access to everything
        if request.user.user_type == 'admin':
            return True
        
        # Approved medical staff have role-based access
        if request.user.user_type in ['doctor', 'nurse', 'pharmacist'] and request.user.is_approved:
            return True
        
        # Patients have limited read-only access to their own data
        if request.user.user_type in ['student', 'employee']:
            # Only allow GET requests for patients
            if request.method not in ['GET', 'HEAD', 'OPTIONS']:
                return False
            
            # Only allow specific actions for patients
            allowed_actions = ['list', 'retrieve', 'me', 'my_visits', 'hospital_info']
            if hasattr(view, 'action') and view.action not in allowed_actions:
                return False
            
            return True
        
        return False