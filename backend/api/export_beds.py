"""
Bed management export views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from beds.models import Bed, BedAllocation
from .export_utils import export_queryset_to_excel


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_bed_allocations(request):
    """Export bed allocation history - Role-based filtering"""
    user = request.user
    
    if user.user_type not in ['admin', 'principal', 'hod', 'doctor', 'nurse']:
        return Response({'error': 'Access denied'}, status=403)
    
    # Base queryset
    allocations = BedAllocation.objects.select_related('bed', 'patient_record', 'attending_doctor', 'allocated_by').all()
    
    # Filter by status
    status = request.query_params.get('status')  # active, discharged, all
    if status == 'active':
        allocations = allocations.filter(is_active=True)
    elif status == 'discharged':
        allocations = allocations.filter(is_active=False)
    
    # Date range filtering
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
        allocations = allocations.filter(admission_date__gte=start_date)
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
        end_date = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
        allocations = allocations.filter(admission_date__lte=end_date)
    
    # Role-based filtering
    if user.user_type == 'hod':
        # HOD can see allocations for their department students
        allocations = allocations.filter(patient_record__user__department=user.department)
    elif user.user_type == 'doctor':
        # Doctors can see their own patient allocations
        allocations = allocations.filter(attending_doctor=user)
    elif user.user_type == 'nurse':
        # Nurses can see allocations they created
        allocations = allocations.filter(allocated_by=user)
    
    allocations = allocations.order_by('-admission_date')
    
    columns = [
        ('bed', 'Bed Number', lambda obj: obj.bed.bed_number),
        ('patient_id', 'Patient ID'),
        ('patient_name', 'Patient Name'),
        ('admission_date', 'Admission Date', lambda obj: obj.admission_date.strftime('%Y-%m-%d %H:%M')),
        ('expected_discharge_date', 'Expected Discharge'),
        ('actual_discharge_date', 'Actual Discharge', lambda obj: obj.actual_discharge_date.strftime('%Y-%m-%d %H:%M') if obj.actual_discharge_date else 'Still Admitted'),
        ('duration_days', 'Duration (Days)'),
        ('condition', 'Condition'),
        ('attending_doctor', 'Attending Doctor', lambda obj: obj.attending_doctor.get_full_name()),
        ('is_active', 'Status', lambda obj: 'Active' if obj.is_active else 'Discharged'),
        ('allocated_by', 'Allocated By', lambda obj: obj.allocated_by.get_full_name()),
    ]
    
    filename = f"bed_allocations_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Bed Allocation History"
    if status == 'active':
        title = "Active Bed Allocations"
    elif status == 'discharged':
        title = "Discharged Bed Allocations"
    
    return export_queryset_to_excel(
        queryset=allocations,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_bed_inventory(request):
    """Export bed inventory and status - Admin/Principal/Nurse"""
    user = request.user
    
    if user.user_type not in ['admin', 'principal', 'nurse', 'doctor']:
        return Response({'error': 'Access denied'}, status=403)
    
    beds = Bed.objects.prefetch_related('allocations').filter(is_active=True).order_by('bed_number')
    
    columns = [
        ('bed_number', 'Bed Number'),
        ('status', 'Status', lambda obj: obj.get_status_display()),
        ('is_available', 'Available', lambda obj: 'Yes' if obj.is_available else 'No'),
        ('has_oxygen', 'Oxygen', lambda obj: 'Yes' if obj.has_oxygen else 'No'),
        ('has_monitor', 'Monitor', lambda obj: 'Yes' if obj.has_monitor else 'No'),
        ('has_ventilator', 'Ventilator', lambda obj: 'Yes' if obj.has_ventilator else 'No'),
        ('current_patient', 'Current Patient'),
        ('allocations', 'Total Allocations', lambda obj: obj.allocations.count()),
        ('allocations', 'Active Allocations', lambda obj: obj.allocations.filter(is_active=True).count()),
        ('description', 'Notes'),
    ]
    
    filename = f"bed_inventory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Bed Inventory Report"
    
    return export_queryset_to_excel(
        queryset=beds,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_current_patients(request):
    """Export currently admitted patients - Doctor/Nurse/Admin/Principal"""
    user = request.user
    
    if user.user_type not in ['admin', 'principal', 'hod', 'doctor', 'nurse']:
        return Response({'error': 'Access denied'}, status=403)
    
    # Get active allocations
    allocations = BedAllocation.objects.select_related(
        'bed', 'patient_record', 'attending_doctor'
    ).filter(is_active=True)
    
    # Role-based filtering
    if user.user_type == 'hod':
        allocations = allocations.filter(patient_record__user__department=user.department)
    elif user.user_type == 'doctor':
        allocations = allocations.filter(attending_doctor=user)
    elif user.user_type == 'nurse':
        allocations = allocations.filter(allocated_by=user)
    
    allocations = allocations.order_by('bed__bed_number')
    
    columns = [
        ('bed', 'Bed Number', lambda obj: obj.bed.bed_number),
        ('patient_id', 'Patient ID'),
        ('patient_name', 'Patient Name'),
        ('patient_record', 'Age', lambda obj: obj.patient_record.age if obj.patient_record else 'N/A'),
        ('patient_record', 'Gender', lambda obj: obj.patient_record.get_gender_display() if obj.patient_record else 'N/A'),
        ('patient_record', 'Blood Group', lambda obj: obj.patient_record.blood_group if obj.patient_record else 'N/A'),
        ('admission_date', 'Admitted On', lambda obj: obj.admission_date.strftime('%Y-%m-%d')),
        ('duration_days', 'Days Admitted'),
        ('condition', 'Condition'),
        ('attending_doctor', 'Doctor', lambda obj: obj.attending_doctor.get_full_name()),
        ('expected_discharge_date', 'Expected Discharge'),
        ('special_requirements', 'Special Requirements'),
    ]
    
    filename = f"current_patients_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Currently Admitted Patients"
    
    return export_queryset_to_excel(
        queryset=allocations,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )
