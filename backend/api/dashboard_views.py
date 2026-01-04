from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Count, F
from django.utils import timezone
from datetime import datetime, timedelta

from users.models import User
from patients.models import Patient, Treatment
from medicines.models import Medicine
from beds.models import Bed, BedAllocation
from cleaning.models import CleaningRecord


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    """
    Complete dashboard built from scratch with verified field names only
    """
    user = request.user
    today = timezone.now().date()
    
    # Basic statistics using ONLY verified fields
    try:
        # Patient statistics
        total_patients = Patient.objects.count()
        patients_today = Patient.objects.filter(created_at__date=today).count()
        
        # Medicine statistics  
        total_medicines = Medicine.objects.count()
        low_stock_medicines = Medicine.objects.filter(
            current_stock__lte=F('minimum_stock_level')
        ).count()
        
        # Bed statistics
        total_beds = Bed.objects.filter(is_active=True).count()
        available_beds = Bed.objects.filter(status='available', is_active=True).count()
        occupied_beds = Bed.objects.filter(status='occupied', is_active=True).count()
        
        # Bed allocations today (using BedAllocation model which has admission_date)
        allocations_today = BedAllocation.objects.filter(
            admission_date__date=today, 
            is_active=True
        ).count()
        
        # Cleaning statistics
        cleanings_today = CleaningRecord.objects.filter(cleaning_date=today).count()
        
        # Staff statistics
        doctors_approved = User.objects.filter(user_type='doctor', is_approved=True).count()
        nurses_approved = User.objects.filter(user_type='nurse', is_approved=True).count()
        pharmacists_approved = User.objects.filter(user_type='pharmacist', is_approved=True).count()
        students_total = User.objects.filter(user_type='student').count()
        employees_total = User.objects.filter(user_type='employee').count()
        pending_approval = User.objects.filter(
            user_type__in=['doctor', 'nurse', 'pharmacist'], 
            is_approved=False
        ).count()
        
        # Recent activity using verified fields
        recent_patients = Patient.objects.order_by('-created_at')[:5]
        recent_treatments = Treatment.objects.order_by('-visit_date')[:5]
        recent_cleanings = CleaningRecord.objects.order_by('-recorded_at')[:5]
        recent_allocations = BedAllocation.objects.filter(is_active=True).order_by('-admission_date')[:5]
        
        # Build response with verified data
        dashboard_data = {
            'user_info': {
                'user_type': user.user_type,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'email': user.email,
                'is_approved': user.is_approved,
                'date_joined': user.date_joined
            },
            'statistics': {
                'patients': {
                    'total': total_patients,
                    'registered_today': patients_today
                },
                'medicines': {
                    'total': total_medicines,
                    'low_stock': low_stock_medicines
                },
                'beds': {
                    'total': total_beds,
                    'available': available_beds,
                    'occupied': occupied_beds,
                    'availability_percentage': round((available_beds / total_beds * 100) if total_beds > 0 else 0, 1)
                },
                'bed_allocations': {
                    'total_active': BedAllocation.objects.filter(is_active=True).count(),
                    'admitted_today': allocations_today
                },
                'cleaning': {
                    'completed_today': cleanings_today,
                    'total_records': CleaningRecord.objects.count()
                },
                'staff': {
                    'doctors': doctors_approved,
                    'nurses': nurses_approved,
                    'pharmacists': pharmacists_approved,
                    'students': students_total,
                    'employees': employees_total,
                    'pending_approval': pending_approval
                }
            },
            'recent_activity': {
                'recent_patients': [
                    {
                        'id': p.pk,
                        'name': p.name,
                        'employee_student_id': p.employee_student_id,
                        'created_at': p.created_at
                    } for p in recent_patients
                ],
                'recent_treatments': [
                    {
                        'id': t.pk,
                        'patient_name': t.patient.name if t.patient else 'N/A',
                        'doctor_name': f"{t.doctor.first_name} {t.doctor.last_name}".strip() or t.doctor.username if t.doctor else 'N/A',
                        'visit_date': t.visit_date,
                        'diagnosis': t.diagnosis[:100] + '...' if len(t.diagnosis) > 100 else t.diagnosis
                    } for t in recent_treatments
                ],
                'recent_cleanings': [
                    {
                        'id': c.pk,
                        'cleaner_name': c.cleaner_name,
                        'cleaning_date': c.cleaning_date,
                        'recorded_at': c.recorded_at
                    } for c in recent_cleanings
                ],
                'recent_allocations': [
                    {
                        'id': a.pk,
                        'patient_name': a.patient_name,
                        'patient_id': a.patient_id,
                        'bed_number': a.bed.bed_number if a.bed else 'N/A',
                        'admission_date': a.admission_date
                    } for a in recent_allocations
                ]
            },
            'system_info': {
                'current_time': timezone.now(),
                'total_users': User.objects.count(),
                'active_users': User.objects.filter(is_active=True).count()
            }
        }
        
        return Response(dashboard_data)
        
    except Exception as e:
        return Response({
            'error': 'Dashboard data loading failed',
            'error_details': str(e),
            'error_type': type(e).__name__,
            'user_info': {
                'user_type': user.user_type if hasattr(user, 'user_type') else 'unknown',
                'username': user.username
            }
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_health(request):
    """
    System health check with verified field names
    """
    try:
        health_data = {
            'database_connectivity': True,
            'models_accessible': {
                'users': User.objects.count(),
                'patients': Patient.objects.count(), 
                'medicines': Medicine.objects.count(),
                'beds': Bed.objects.count(),
                'bed_allocations': BedAllocation.objects.count(),
                'cleaning_records': CleaningRecord.objects.count(),
                'treatments': Treatment.objects.count()
            },
            'timestamp': timezone.now()
        }
        return Response(health_data)
    except Exception as e:
        return Response({
            'database_connectivity': False,
            'error': str(e),
            'timestamp': timezone.now()
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_hospital_info(request):
    """
    Basic hospital information for students using verified field names
    """
    try:
        # Basic hospital information
        total_beds = Bed.objects.filter(is_active=True).count()
        available_beds = Bed.objects.filter(status='available', is_active=True).count()
        occupied_beds = Bed.objects.filter(status='occupied', is_active=True).count()
        
        # Medical staff availability
        doctors_available = User.objects.filter(
            user_type='doctor', 
            is_active=True, 
            is_approved=True
        ).count()
        nurses_available = User.objects.filter(
            user_type='nurse', 
            is_active=True, 
            is_approved=True
        ).count()
        
        return Response({
            'hospital_status': {
                'bed_availability': {
                    'total_beds': total_beds,
                    'available_beds': available_beds,
                    'occupied_beds': occupied_beds,
                    'occupancy_rate': round(((occupied_beds) / total_beds * 100) if total_beds > 0 else 0, 1)
                },
                'medical_staff_availability': {
                    'doctors_available': doctors_available,
                    'nurses_available': nurses_available,
                    'pharmacist_available': User.objects.filter(
                        user_type='pharmacist', 
                        is_active=True, 
                        is_approved=True
                    ).exists()
                }
            },
            'last_updated': timezone.now()
        })
    except Exception as e:
        return Response({
            'error': 'Hospital info loading failed',
            'error_details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def principal_dashboard(request):
    """
    Principal dashboard with institution-wide statistics
    """
    user = request.user
    
    if user.user_type not in ['principal', 'admin']:
        return Response({
            'error': 'Access denied. Only principals can access this dashboard.'
        }, status=403)
    
    try:
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Overview statistics
        total_students = User.objects.filter(user_type='student', is_active=True).count()
        total_employees = User.objects.filter(user_type='employee', is_active=True).count()
        total_medical_staff = User.objects.filter(
            user_type__in=['doctor', 'nurse', 'pharmacist'],
            is_active=True,
            is_approved=True
        ).count()
        
        # Get unique departments
        departments = User.objects.filter(
            is_active=True
        ).exclude(
            department__isnull=True
        ).exclude(
            department=''
        ).values_list('department', flat=True).distinct()
        total_departments = len(departments)
        
        # Medical statistics
        today_visits = Treatment.objects.filter(visit_date__date=today).count()
        monthly_visits = Treatment.objects.filter(visit_date__date__gte=month_start).count()
        critical_cases = Treatment.objects.filter(severity='critical', visit_date__date__gte=month_start).count()
        active_doctors = User.objects.filter(
            user_type='doctor',
            is_active=True,
            is_approved=True,
            is_available=True
        ).count()
        
        # Bed statistics
        total_beds = Bed.objects.filter(is_active=True).count()
        available_beds = Bed.objects.filter(status='available', is_active=True).count()
        occupied_beds = Bed.objects.filter(status='occupied', is_active=True).count()
        
        # Department-wise statistics
        department_stats = []
        for dept in departments:
            dept_students = User.objects.filter(
                user_type='student',
                department=dept,
                is_active=True
            ).count()
            dept_staff = User.objects.filter(
                user_type__in=['employee', 'doctor', 'nurse'],
                department=dept,
                is_active=True
            ).count()
            
            department_stats.append({
                'name': dept,
                'students': dept_students,
                'staff': dept_staff,
                'total': dept_students + dept_staff
            })
        
        return Response({
            'total_students': total_students,
            'total_employees': total_employees,
            'total_medical_staff': total_medical_staff,
            'total_departments': total_departments,
            'today_visits': today_visits,
            'monthly_visits': monthly_visits,
            'critical_cases': critical_cases,
            'active_doctors': active_doctors,
            'active_beds': occupied_beds,
            'available_beds': available_beds,
            'total_beds': total_beds,
            'department_stats': department_stats,
            'last_updated': timezone.now()
        })
        
    except Exception as e:
        return Response({
            'error': 'Failed to load principal dashboard',
            'error_details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hod_dashboard(request):
    """
    HOD dashboard with department-specific statistics
    """
    user = request.user
    
    if user.user_type not in ['hod', 'admin']:
        return Response({
            'error': 'Access denied. Only HODs can access this dashboard.'
        }, status=403)
    
    department = request.query_params.get('department', user.department)
    
    if not department:
        return Response({
            'error': 'Department not specified'
        }, status=400)
    
    try:
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Department info
        total_students = User.objects.filter(
            user_type='student',
            department=department,
            is_active=True
        ).count()
        
        total_faculty = User.objects.filter(
            user_type='employee',
            department=department,
            is_active=True
        ).count()
        
        total_staff = User.objects.filter(
            department=department,
            is_active=True
        ).exclude(user_type='student').count()
        
        # Get student and faculty IDs for medical stats
        dept_users = User.objects.filter(
            department=department,
            is_active=True
        )
        
        dept_user_ids = list(dept_users.values_list('id', flat=True))
        
        # Get patients from department
        dept_patients = Patient.objects.filter(
            user__id__in=dept_user_ids
        )
        
        # Medical statistics for department members
        today_visits = Treatment.objects.filter(
            patient__in=dept_patients,
            visit_date__date=today
        ).count()
        
        monthly_visits = Treatment.objects.filter(
            patient__in=dept_patients,
            visit_date__date__gte=month_start
        ).count()
        
        critical_cases = Treatment.objects.filter(
            patient__in=dept_patients,
            severity='critical',
            visit_date__date__gte=month_start
        ).count()
        
        # Health statistics
        students_with_records = dept_patients.filter(user__user_type='student').count()
        students_under_treatment = Treatment.objects.filter(
            patient__in=dept_patients.filter(user__user_type='student'),
            visit_date__date__gte=month_start
        ).values('patient').distinct().count()
        
        faculty_with_records = dept_patients.filter(user__user_type='employee').count()
        faculty_under_treatment = Treatment.objects.filter(
            patient__in=dept_patients.filter(user__user_type='employee'),
            visit_date__date__gte=month_start
        ).values('patient').distinct().count()
        
        # Chronic conditions count
        chronic_conditions = dept_patients.exclude(
            Q(chronic_conditions__isnull=True) | Q(chronic_conditions='')
        ).count()
        
        # Bed statistics for department (if needed)
        # Note: Beds might not be department-specific, so we get general bed stats
        total_beds = Bed.objects.filter(is_active=True).count()
        available_beds = Bed.objects.filter(status='available', is_active=True).count()
        occupied_beds = Bed.objects.filter(status='occupied', is_active=True).count()
        
        return Response({
            'department': department,
            'total_students': total_students,
            'total_faculty': total_faculty,
            'total_staff': total_staff,
            'today_visits': today_visits,
            'monthly_visits': monthly_visits,
            'critical_cases': critical_cases,
            'students_with_records': students_with_records,
            'under_treatment': students_under_treatment,
            'chronic_conditions': chronic_conditions,
            'faculty_with_records': faculty_with_records,
            'faculty_under_treatment': faculty_under_treatment,
            'active_beds': occupied_beds,
            'available_beds': available_beds,
            'total_beds': total_beds,
            'last_updated': timezone.now()
        })
        
    except Exception as e:
        return Response({
            'error': 'Failed to load HOD dashboard',
            'error_details': str(e)
        }, status=500)