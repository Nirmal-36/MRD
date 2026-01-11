"""
Patient data export views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
from patients.models import Patient, Treatment
from .export_utils import export_queryset_to_excel


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_patients(request):
    """Export patient list to Excel - Role-based filtering"""
    user = request.user
    
    # Base queryset
    patients = Patient.objects.select_related('user', 'created_by').all()
    
    # Role-based filtering
    if user.user_type == 'hod':
        # HOD can only see their department's students
        patients = patients.filter(user__department=user.department, user__user_type='student')
    elif user.user_type in ['doctor', 'nurse']:
        # Doctors/nurses can see their own created patients
        patients = patients.filter(created_by=user)
    elif user.user_type not in ['admin', 'principal', 'pharmacist']:
        return Response({'error': 'Access denied'}, status=403)
    
    # Define columns
    columns = [
        ('employee_student_id', 'Patient ID'),
        ('name', 'Name'),
        ('age', 'Age'),
        ('gender', 'Gender', lambda obj: obj.get_gender_display()),
        ('patient_type', 'Type', lambda obj: obj.get_patient_type_display()),
        ('phone', 'Phone'),
        ('blood_group', 'Blood Group'),
        ('allergies', 'Allergies'),
        ('chronic_conditions', 'Chronic Conditions'),
        ('created_at', 'Registered On', lambda obj: obj.created_at.strftime('%Y-%m-%d')),
    ]
    
    # If HOD/Admin, add department info
    if user.user_type in ['hod', 'admin', 'principal']:
        columns.insert(6, ('user', 'Department', lambda obj: obj.user.department if obj.user else 'N/A'))
    
    filename = f"patients_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = f"Patient List - {user.get_user_type_display()}"
    
    return export_queryset_to_excel(
        queryset=patients,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_treatments(request):
    """Export treatment records - Role-based filtering"""
    user = request.user
    patient_id = request.query_params.get('patient_id', None)
    
    # Base queryset
    treatments = Treatment.objects.select_related('patient', 'doctor').all()
    
    # Filter by patient if specified
    if patient_id:
        treatments = treatments.filter(patient__employee_student_id=patient_id)
    
    # Role-based filtering
    if user.user_type == 'hod':
        # HOD can only see treatments for students in their department
        treatments = treatments.filter(
            patient__user__department=user.department,
            patient__user__user_type='student'
        )
    elif user.user_type == 'doctor':
        # Doctors can see their own treatments
        treatments = treatments.filter(doctor=user)
    elif user.user_type == 'nurse':
        # Nurses can see treatments for patients they created
        treatments = treatments.filter(patient__created_by=user)
    elif user.user_type == 'student' or user.user_type == 'employee':
        # Students/employees can only see their own treatment records
        if hasattr(user, 'patient_record'):
            treatments = treatments.filter(patient=user.patient_record)
        else:
            return Response({'error': 'No patient record found'}, status=404)
    elif user.user_type not in ['admin', 'principal', 'pharmacist']:
        return Response({'error': 'Access denied'}, status=403)
    
    # Date range filtering
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
        treatments = treatments.filter(visit_date__gte=start_date)
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
        end_date = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
        treatments = treatments.filter(visit_date__lte=end_date)
    
    # Order by most recent
    treatments = treatments.order_by('-visit_date')
    
    # Define columns
    columns = [
        ('visit_date', 'Visit Date', lambda obj: obj.visit_date.strftime('%Y-%m-%d %H:%M')),
        ('patient', 'Patient ID', lambda obj: obj.patient.employee_student_id),
        ('patient', 'Patient Name', lambda obj: obj.patient.name),
        ('doctor', 'Doctor', lambda obj: obj.doctor.get_full_name()),
        ('symptoms', 'Symptoms'),
        ('diagnosis', 'Diagnosis'),
        ('treatment_given', 'Treatment Given'),
        ('medicines_prescribed', 'Medicines Prescribed'),
        ('dosage_instructions', 'Dosage Instructions'),
        ('severity', 'Severity', lambda obj: obj.get_severity_display()),
        ('follow_up_date', 'Follow-up Date'),
        ('notes', 'Notes'),
    ]
    
    filename = f"treatments_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Treatment Records"
    if patient_id:
        title += f" - Patient {patient_id}"
    
    return export_queryset_to_excel(
        queryset=treatments,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_high_risk_patients(request):
    """Export high-risk patients (allergies/chronic conditions) - Admin/Principal/HOD only"""
    user = request.user
    
    if user.user_type not in ['admin', 'principal', 'hod']:
        return Response({'error': 'Access denied. Only admin, principal, and HODs can access this report.'}, status=403)
    
    # Get high-risk patients (those with allergies or chronic conditions)
    patients = Patient.objects.filter(
        Q(allergies__isnull=False, allergies__gt='') |
        Q(chronic_conditions__isnull=False, chronic_conditions__gt='')
    )
    
    # HOD can only see their department students
    if user.user_type == 'hod':
        patients = patients.filter(user__department=user.department, user__user_type='student')
    
    columns = [
        ('employee_student_id', 'Patient ID'),
        ('name', 'Name'),
        ('age', 'Age'),
        ('gender', 'Gender', lambda obj: obj.get_gender_display()),
        ('patient_type', 'Type', lambda obj: obj.get_patient_type_display()),
        ('phone', 'Phone'),
        ('blood_group', 'Blood Group'),
        ('allergies', 'Allergies'),
        ('chronic_conditions', 'Chronic Conditions'),
    ]
    
    if user.user_type in ['admin', 'principal', 'hod']:
        columns.insert(5, ('user', 'Department', lambda obj: obj.user.department if obj.user else 'N/A'))
    
    filename = f"high_risk_patients_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "High-Risk Patients Report"
    
    return export_queryset_to_excel(
        queryset=patients,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )
