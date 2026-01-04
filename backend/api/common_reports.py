from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q, F, Sum
from django.utils import timezone
from datetime import timedelta, date
from dateutil.relativedelta import relativedelta
from users.models import User
from patients.models import Patient, Treatment
from medicines.models import Medicine, MedicineTransaction, StockRequest
from beds.models import Bed, BedAllocation


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_health_report(request):
    """Top 10 diagnoses affecting students"""
    user = request.user
    if user.user_type not in ['principal', 'admin', 'hod']:
        return Response({'error': 'Access denied. Only principals and HODs can access this report.'}, status=403)
    
    try:
        # Get custom date range (default: last 6 months)
        start_date_param = request.query_params.get('start_date', None)
        end_date_param = request.query_params.get('end_date', None)
        months = int(request.query_params.get('months', 6))
        
        if start_date_param and end_date_param:
            from datetime import datetime
            start_date = datetime.strptime(start_date_param, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_param, '%Y-%m-%d')
            start_date = timezone.make_aware(start_date)
            end_date = timezone.make_aware(end_date)
        else:
            start_date = timezone.now() - timedelta(days=months*30)
            end_date = timezone.now()
        
        # Get department filter (for HOD - auto-detect if HOD and no department specified)
        department = request.query_params.get('department', None)
        if not department and user.user_type == 'hod':
            department = user.department
        
        # Get students
        student_patients = Patient.objects.filter(user__user_type='student')
        if department:
            student_patients = student_patients.filter(user__department=department)
        
        # Top diagnoses
        diagnoses = Treatment.objects.filter(
            patient__in=student_patients,
            visit_date__gte=start_date,
            visit_date__lte=end_date
        ).values('diagnosis').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Total treatments
        total_treatments = Treatment.objects.filter(
            patient__in=student_patients,
            visit_date__gte=start_date,
            visit_date__lte=end_date
        ).count()
        
        return Response({
            'top_diagnoses': list(diagnoses),
            'total_treatments': total_treatments,
            'start_date': start_date.date(),
            'end_date': end_date.date()
        })
    except Exception as e:
        return Response({
            'error': 'Failed to generate student health report',
            'details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def high_risk_students(request):
    """Students with allergies/chronic conditions"""
    user = request.user
    if user.user_type not in ['principal', 'admin', 'hod']:
        return Response({'error': 'Access denied. Only principals and HODs can access this report.'}, status=403)
    
    try:
        # Get department filter (for HOD - auto-detect if HOD and no department specified)
        department = request.query_params.get('department', None)
        if not department and user.user_type == 'hod':
            department = user.department
        
        # Students with allergies or chronic conditions
        high_risk = Patient.objects.filter(
            user__user_type='student'
        )
        if department:
            high_risk = high_risk.filter(user__department=department)
        
        high_risk = high_risk.exclude(
            Q(allergies__isnull=True) | Q(allergies='')
        ).exclude(
            Q(chronic_conditions__isnull=True) | Q(chronic_conditions='')
        ).select_related('user').values(
            'id', 'name', 'employee_student_id', 
            'allergies', 'chronic_conditions',
            'user__department', 'user__phone', 'user__email',
            'blood_group', 'age'
        )
        
        # Count by type
        with_allergies = Patient.objects.filter(
            user__user_type='student'
        ).exclude(Q(allergies__isnull=True) | Q(allergies='')).count()
        
        with_chronic = Patient.objects.filter(
            user__user_type='student'
        ).exclude(Q(chronic_conditions__isnull=True) | Q(chronic_conditions='')).count()
        
        return Response({
            'high_risk_students': list(high_risk),
            'total_count': high_risk.count(),
            'students_with_allergies': with_allergies,
            'students_with_chronic_conditions': with_chronic
        })
    except Exception as e:
        return Response({
            'error': 'Failed to generate high-risk students report',
            'details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def utilization_rate(request):
    """Visit frequency by patient type"""
    user = request.user
    if user.user_type not in ['principal', 'admin', 'hod']:
        return Response({'error': 'Access denied. Only principals and HODs can access this report.'}, status=403)
    
    try:
        # Get custom date range (default: last 6 months)
        start_date_param = request.query_params.get('start_date', None)
        end_date_param = request.query_params.get('end_date', None)
        months = int(request.query_params.get('months', 6))
        
        if start_date_param and end_date_param:
            from datetime import datetime
            start_date = datetime.strptime(start_date_param, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_param, '%Y-%m-%d')
            start_date = timezone.make_aware(start_date)
            end_date = timezone.make_aware(end_date)
        else:
            start_date = timezone.now() - timedelta(days=months*30)
            end_date = timezone.now()
        
        # Get department filter (for HOD - auto-detect if HOD and no department specified)
        department = request.query_params.get('department', None)
        if not department and user.user_type == 'hod':
            department = user.department
        
        # Base queryset
        student_query = Treatment.objects.filter(
            patient__user__user_type='student',
            visit_date__gte=start_date,
            visit_date__lte=end_date
        )
        staff_query = Treatment.objects.filter(
            patient__user__user_type='employee',
            visit_date__gte=start_date,
            visit_date__lte=end_date
        )
        
        if department:
            student_query = student_query.filter(patient__user__department=department)
            staff_query = staff_query.filter(patient__user__department=department)
        
        # Overall stats
        student_visits = student_query.count()
        staff_visits = staff_query.count()
        
        # Calculate monthly breakdown using actual calendar months
        monthly_data = []
        
        # Normalize to start of month for start_date and end of month for end_date
        current_month_start = start_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_month_last_day = (end_date.replace(day=1) + relativedelta(months=1) - timedelta(days=1)).replace(
            hour=23, minute=59, second=59, microsecond=999999
        )
        
        # Iterate through each calendar month
        month_cursor = current_month_start
        while month_cursor <= end_month_last_day:
            # Get the start and end of current month
            month_start = month_cursor
            month_end = (month_cursor + relativedelta(months=1)) - timedelta(microseconds=1)
            
            # Don't go beyond the end_date
            if month_end > end_month_last_day:
                month_end = end_month_last_day
            
            student_monthly = Treatment.objects.filter(
                patient__user__user_type='student',
                visit_date__gte=month_start,
                visit_date__lte=month_end
            )
            staff_monthly = Treatment.objects.filter(
                patient__user__user_type='employee',
                visit_date__gte=month_start,
                visit_date__lte=month_end
            )
            
            if department:
                student_monthly = student_monthly.filter(patient__user__department=department)
                staff_monthly = staff_monthly.filter(patient__user__department=department)
            
            student_count = student_monthly.count()
            staff_count = staff_monthly.count()
            
            monthly_data.append({
                'month': month_start.strftime('%B %Y'),
                'student_visits': student_count,
                'staff_visits': staff_count,
                'total': student_count + staff_count
            })
            
            # Move to next month
            month_cursor = month_cursor + relativedelta(months=1)
        
        return Response({
            'monthly_utilization': monthly_data,
            'student_visits': student_visits,
            'staff_visits': staff_visits,
            'total_visits': student_visits + staff_visits,
            'start_date': start_date.date(),
            'end_date': end_date.date()
        })
    except Exception as e:
        return Response({
            'error': 'Failed to generate utilization report',
            'details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def critical_stock_status(request):
    """Medicines below minimum stock level and most used medicines"""
    user = request.user
    if user.user_type not in ['principal', 'admin', 'hod']:
        return Response({'error': 'Access denied. Only principals and HODs can access this report.'}, status=403)
    
    try:
        # Get custom date range for most used medicines (default: last 6 months)
        start_date_param = request.query_params.get('start_date', None)
        end_date_param = request.query_params.get('end_date', None)
        months = int(request.query_params.get('months', 6))
        
        if start_date_param and end_date_param:
            from datetime import datetime
            start_date = datetime.strptime(start_date_param, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_param, '%Y-%m-%d')
            start_date = timezone.make_aware(start_date)
            end_date = timezone.make_aware(end_date)
        else:
            start_date = timezone.now() - timedelta(days=months*30)
            end_date = timezone.now()
        
        # Critical stock medicines
        critical_stock = Medicine.objects.filter(
            current_stock__lte=F('minimum_stock_level'),
            is_active=True
        ).values(
            'id', 'name', 'category', 'current_stock', 
            'minimum_stock_level', 'unit_price'
        ).order_by('current_stock')
        
        # Calculate estimated value
        total_value = 0
        medicines_list = list(critical_stock)
        for medicine in medicines_list:
            value = medicine['current_stock'] * medicine['unit_price']
            medicine['total_value'] = round(value, 2)
            total_value += value
        
        # Top 10 most used medicines (by transaction quantity)
        most_used = MedicineTransaction.objects.filter(
            transaction_type='issued',
            date__gte=start_date,
            date__lte=end_date
        ).values(
            'medicine__name', 'medicine__category', 'medicine__id'
        ).annotate(
            total_quantity=Sum('quantity'),
            transaction_count=Count('id')
        ).order_by('-total_quantity')[:10]
        
        most_used_list = []
        for item in most_used:
            most_used_list.append({
                'medicine_id': item['medicine__id'],
                'name': item['medicine__name'],
                'category': item['medicine__category'],
                'total_dispensed': item['total_quantity'],
                'dispensing_count': item['transaction_count']
            })
        
        return Response({
            'critical_medicines': medicines_list,
            'total_count': len(medicines_list),
            'estimated_value': round(total_value, 2),
            'most_used_medicines': most_used_list,
            'start_date': start_date.date(),
            'end_date': end_date.date()
        })
    except Exception as e:
        return Response({
            'error': 'Failed to generate critical stock report',
            'details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_expiry_report(request):
    """Medicines expiring soon"""
    user = request.user
    if user.user_type not in ['principal', 'admin', 'hod']:
        return Response({'error': 'Access denied. Only principals and HODs can access this report.'}, status=403)
    
    try:
        days = int(request.query_params.get('days', 90))
        expiry_date = timezone.now().date() + timedelta(days=days)
        
        expiring_soon = Medicine.objects.filter(
            expiry_date__lte=expiry_date,
            expiry_date__gte=timezone.now().date(),
            is_active=True
        ).values(
            'id', 'name', 'category', 'current_stock',
            'expiry_date', 'unit_price', 'batch_number'
        ).order_by('expiry_date')
        
        # Calculate total value
        total_value = 0
        medicines_list = list(expiring_soon)
        for medicine in medicines_list:
            value = medicine['current_stock'] * medicine['unit_price']
            medicine['total_value'] = round(value, 2)
            total_value += value
            
            # Calculate days until expiry
            days_until_expiry = (medicine['expiry_date'] - timezone.now().date()).days
            medicine['days_until_expiry'] = days_until_expiry
        
        return Response({
            'expiring_medicines': medicines_list,
            'total_count': len(medicines_list),
            'total_value': round(total_value, 2),
            'period_days': days
        })
    except Exception as e:
        return Response({
            'error': 'Failed to generate expiry report',
            'details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_stock_requests_summary(request):
    """Pending high-priority stock requests"""
    user = request.user
    if user.user_type not in ['principal', 'admin', 'hod']:
        return Response({'error': 'Access denied. Only principals and HODs can access this report.'}, status=403)
    
    try:
        pending = StockRequest.objects.filter(
            status='pending'
        ).select_related('medicine', 'requested_by').values(
            'id', 'medicine__name', 'medicine__category',
            'requested_quantity', 'priority', 'reason', 
            'requested_date', 'requested_by__username',
            'requested_by__first_name', 'requested_by__last_name'
        ).order_by('-priority', 'requested_date')
        
        pending_list = list(pending)
        
        # Add full name
        for req in pending_list:
            req['requested_by_name'] = f"{req.get('requested_by__first_name', '')} {req.get('requested_by__last_name', '')}".strip() or req['requested_by__username']
        
        high_priority = sum(1 for r in pending_list if r['priority'] == 'high')
        medium_priority = sum(1 for r in pending_list if r['priority'] == 'medium')
        low_priority = sum(1 for r in pending_list if r['priority'] == 'low')
        
        return Response({
            'pending_requests': pending_list,
            'total_pending': len(pending_list),
            'high_priority_count': high_priority,
            'medium_priority_count': medium_priority,
            'low_priority_count': low_priority
        })
    except Exception as e:
        return Response({
            'error': 'Failed to generate pending requests report',
            'details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bed_capacity_report(request):
    """Bed allocation and capacity status with time period analysis"""
    user = request.user
    if user.user_type not in ['principal', 'admin', 'hod']:
        return Response({'error': 'Access denied. Only principals and HODs can access this report.'}, status=403)
    
    try:
        # Get custom date range (default: last 6 months)
        start_date_param = request.query_params.get('start_date', None)
        end_date_param = request.query_params.get('end_date', None)
        months = int(request.query_params.get('months', 6))
        
        if start_date_param and end_date_param:
            from datetime import datetime
            start_date = datetime.strptime(start_date_param, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_param, '%Y-%m-%d')
            start_date = timezone.make_aware(start_date)
            end_date = timezone.make_aware(end_date)
        else:
            start_date = timezone.now() - timedelta(days=months*30)
            end_date = timezone.now()
        
        # Get department filter (for HOD)
        department = request.query_params.get('department', None)
        
        # Current bed status
        bed_query = Bed.objects.filter(is_active=True)
        
        # Currently active allocations
        active_allocation_query = BedAllocation.objects.filter(is_active=True).select_related('bed').prefetch_related('patient_record', 'patient_record__user')
        
        # All allocations in the time period (including discharged ones)
        period_allocation_query = BedAllocation.objects.filter(
            admission_date__gte=start_date,
            admission_date__lte=end_date
        ).select_related('bed').prefetch_related('patient_record', 'patient_record__user')
        
        # Apply department filter if provided (only if patient_record exists)
        if department:
            active_allocation_query = active_allocation_query.filter(
                patient_record__isnull=False,
                patient_record__user__department=department
            )
            period_allocation_query = period_allocation_query.filter(
                patient_record__isnull=False,
                patient_record__user__department=department
            )
            
        total_beds = bed_query.count()
        occupied_beds = bed_query.filter(status='occupied').count()
        available_beds = bed_query.filter(status='available').count()
        
        # Currently active allocations with LOS
        # Use annotate instead of values to handle NULL patient_records
        from django.db.models import F, Value
        from django.db.models.functions import Coalesce
        
        active_allocations_qs = active_allocation_query.annotate(
            department=Coalesce(F('patient_record__user__department'), Value('N/A'))
        )
        
        active_allocations_list = []
        total_los = 0
        
        for allocation in active_allocations_qs:
            days = (date.today() - allocation.admission_date.date()).days
            active_allocations_list.append({
                'id': getattr(allocation, 'id'),
                'patient_name': allocation.patient_name,
                'bed__bed_number': allocation.bed.bed_number,
                'admission_date': allocation.admission_date,
                'expected_discharge_date': allocation.expected_discharge_date,
                'patient_record__user__department': getattr(allocation, 'department', 'N/A'),
                'length_of_stay': days
            })
            total_los += days
        
        avg_los = round(total_los / len(active_allocations_list), 1) if active_allocations_list else 0
        
        # Allocations during the time period
        period_allocations_qs = period_allocation_query.annotate(
            department=Coalesce(F('patient_record__user__department'), Value('N/A'))
        ).order_by('-admission_date')
        
        period_allocations_list = []
        period_los_total = 0
        discharged_count = 0
        discharged_in_period = 0
        still_admitted = 0
        
        for allocation in period_allocations_qs:
            alloc_data = {
                'id': getattr(allocation, 'id'),
                'patient_name': allocation.patient_name,
                'bed__bed_number': allocation.bed.bed_number,
                'admission_date': allocation.admission_date,
                'actual_discharge_date': allocation.actual_discharge_date,
                'expected_discharge_date': allocation.expected_discharge_date,
                'patient_record__user__department': getattr(allocation, 'department', 'N/A'),
                'is_active': allocation.is_active
            }
            
            if allocation.actual_discharge_date:
                days = (allocation.actual_discharge_date.date() - allocation.admission_date.date()).days
                period_los_total += days
                discharged_count += 1
                discharged_in_period += 1
                alloc_data['length_of_stay'] = days
            elif allocation.is_active:
                days = (date.today() - allocation.admission_date.date()).days
                alloc_data['length_of_stay'] = days
                still_admitted += 1
                
            period_allocations_list.append(alloc_data)
        
        total_period_allocations = len(period_allocations_list)
        avg_period_los = round(period_los_total / discharged_count, 1) if discharged_count > 0 else 0
        
        return Response({
            # Current status
            'total_beds': total_beds,
            'occupied_beds': occupied_beds,
            'available_beds': available_beds,
            'occupancy_rate': round((occupied_beds / total_beds * 100) if total_beds > 0 else 0, 1),
            'active_allocations': active_allocations_list,
            'active_allocations_count': len(active_allocations_list),
            'average_length_of_stay': avg_los,
            
            # Time period analysis
            'period_allocations': period_allocations_list,
            'total_period_allocations': total_period_allocations,
            'discharged_in_period': discharged_in_period,
            'still_admitted_from_period': still_admitted,
            'average_period_length_of_stay': avg_period_los,
            'start_date': start_date.date(),
            'end_date': end_date.date()
        })
    except Exception as e:
        return Response({
            'error': 'Failed to generate bed capacity report',
            'details': str(e)
        }, status=500)
