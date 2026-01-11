"""
Cleaning records and user directory export views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.utils import timezone
from cleaning.models import CleaningRecord
from users.models import User
from .export_utils import export_queryset_to_excel


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_cleaning_records(request):
    """Export cleaning records - All staff can view"""
    user = request.user
    
    # All authenticated users can export cleaning records
    records = CleaningRecord.objects.select_related('recorded_by').all()
    
    # Date range filtering
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        records = records.filter(cleaning_date__gte=start_date)
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        records = records.filter(cleaning_date__lte=end_date)
    else:
        # Default: last 30 days
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        records = records.filter(cleaning_date__gte=start_date, cleaning_date__lte=end_date)
    
    records = records.order_by('-cleaning_date', '-start_time')
    
    columns = [
        ('cleaning_date', 'Cleaning Date'),
        ('start_time', 'Start Time', lambda obj: obj.start_time.strftime('%H:%M') if obj.start_time else 'N/A'),
        ('end_time', 'End Time', lambda obj: obj.end_time.strftime('%H:%M') if obj.end_time else 'N/A'),
        ('duration_display', 'Duration'),
        ('cleaner_name', 'Cleaner Name'),
        ('cleaner_contact', 'Contact Number'),
        ('areas_cleaned', 'Areas Cleaned'),
        ('supplies_used', 'Supplies Used'),
        ('quality_rating', 'Quality Rating', lambda obj: f"{obj.quality_rating} ⭐" if obj.quality_rating else 'Not Rated'),
        ('notes', 'Notes'),
        ('recorded_by', 'Recorded By', lambda obj: obj.recorded_by.get_full_name() if obj.recorded_by else 'N/A'),
    ]
    
    filename = f"cleaning_records_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Cleaning Records Report"
    
    return export_queryset_to_excel(
        queryset=records,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_staff_directory(request):
    """Export staff directory - Admin/Principal only"""
    user = request.user
    
    if user.user_type not in ['admin', 'principal']:
        return Response({'error': 'Access denied. Only admin and principal can export staff directory.'}, status=403)
    
    # Get all medical staff
    staff = User.objects.filter(
        user_type__in=['doctor', 'nurse', 'pharmacist', 'admin', 'principal', 'hod']
    ).order_by('user_type', 'first_name')
    
    columns = [
        ('username', 'Username'),
        ('first_name', 'First Name'),
        ('last_name', 'Last Name'),
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('user_type', 'Role', lambda obj: obj.get_user_type_display()),
        ('employee_id', 'Employee ID'),
        ('department', 'Department'),
        ('designation', 'Designation'),
        ('is_available', 'Available', lambda obj: 'Yes' if obj.is_available else 'No'),
        ('is_approved', 'Approved', lambda obj: 'Yes' if obj.is_approved else 'Pending'),
        ('created_at', 'Registered On', lambda obj: obj.created_at.strftime('%Y-%m-%d')),
    ]
    
    filename = f"staff_directory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Medical Staff Directory"
    
    return export_queryset_to_excel(
        queryset=staff,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_student_directory(request):
    """Export student directory - Admin/Principal/HOD"""
    user = request.user
    
    if user.user_type not in ['admin', 'principal', 'hod']:
        return Response({'error': 'Access denied. Only admin, principal, and HODs can export student directory.'}, status=403)
    
    students = User.objects.filter(user_type='student')
    
    # HOD can only see their department students
    if user.user_type == 'hod':
        students = students.filter(department=user.department)
    
    students = students.order_by('department', 'first_name')
    
    columns = [
        ('username', 'Username'),
        ('first_name', 'First Name'),
        ('last_name', 'Last Name'),
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('student_id', 'Student ID'),
        ('department', 'Department'),
        ('course', 'Course'),
        ('year_of_study', 'Year'),
        ('created_at', 'Registered On', lambda obj: obj.created_at.strftime('%Y-%m-%d')),
    ]
    
    filename = f"student_directory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Student Directory"
    if user.user_type == 'hod':
        title += f" - {user.department} Department"
    
    return export_queryset_to_excel(
        queryset=students,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_employee_directory(request):
    """Export employee directory - Admin/Principal only"""
    user = request.user
    
    if user.user_type not in ['admin', 'principal']:
        return Response({'error': 'Access denied. Only admin and principal can export employee directory.'}, status=403)
    
    employees = User.objects.filter(user_type='employee').order_by('department', 'first_name')
    
    columns = [
        ('username', 'Username'),
        ('first_name', 'First Name'),
        ('last_name', 'Last Name'),
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('employee_id', 'Employee ID'),
        ('department', 'Department'),
        ('designation', 'Designation'),
        ('created_at', 'Registered On', lambda obj: obj.created_at.strftime('%Y-%m-%d')),
    ]
    
    filename = f"employee_directory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Employee Directory"
    
    return export_queryset_to_excel(
        queryset=employees,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )
