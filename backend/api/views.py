from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, F
from django.utils import timezone
from datetime import datetime, timedelta

from patients.models import Patient, Treatment
from medicines.models import Medicine, MedicineTransaction, StockRequest
from beds.models import Bed, BedAllocation
from cleaning.models import CleaningRecord
from users.models import User


class DashboardView(APIView):
    """
    Dashboard API to get overview statistics
    """
    
    def get(self, request):
        # Today's date
        today = timezone.now().date()
        
        # Patient statistics
        total_patients = Patient.objects.count()
        new_patients_today = Patient.objects.filter(created_at__date=today).count()
        
        # Treatment statistics
        treatments_today = Treatment.objects.filter(visit_date__date=today).count()
        pending_follow_ups = Treatment.objects.filter(
            follow_up_date=today,
            follow_up_date__isnull=False
        ).count()
        
        # Medicine statistics
        total_medicines = Medicine.objects.filter(is_active=True).count()
        low_stock_medicines = Medicine.objects.filter(
            current_stock__lte=F('minimum_stock_level'),
            is_active=True
        ).count()
        out_of_stock = Medicine.objects.filter(current_stock=0, is_active=True).count()
        
        # Bed statistics
        total_beds = Bed.objects.filter(is_active=True).count()
        available_beds = Bed.objects.filter(status='available', is_active=True).count()
        occupied_beds = Bed.objects.filter(status='occupied', is_active=True).count()
        
        # Staff availability
        available_doctors = User.objects.filter(
            user_type='doctor',
            is_available=True,
            is_active=True
        ).count()
        available_nurses = User.objects.filter(
            user_type='nurse',
            is_available=True,
            is_active=True
        ).count()
        
        # Cleaning statistics
        cleanings_today = CleaningRecord.objects.filter(
            cleaning_date=today
        ).count()
        total_cleanings = CleaningRecord.objects.count()
        
        # Recent activities (last 7 days)
        week_ago = today - timedelta(days=7)
        recent_treatments = Treatment.objects.filter(
            visit_date__date__gte=week_ago
        ).count()
        
        data = {
            'patients': {
                'total': total_patients,
                'new_today': new_patients_today,
            },
            'treatments': {
                'today': treatments_today,
                'pending_follow_ups': pending_follow_ups,
                'recent_week': recent_treatments,
            },
            'medicines': {
                'total': total_medicines,
                'low_stock': low_stock_medicines,
                'out_of_stock': out_of_stock,
            },
            'beds': {
                'total': total_beds,
                'available': available_beds,
                'occupied': occupied_beds,
                'occupancy_rate': round((occupied_beds / total_beds * 100) if total_beds > 0 else 0, 1),
            },
            'staff': {
                'available_doctors': available_doctors,
                'available_nurses': available_nurses,
            },
            'cleaning': {
                'today': cleanings_today,
                'total': total_cleanings,
            }
        }
        
        return Response(data)


class ReportsView(APIView):
    """
    Generate various reports
    """
    
    def get(self, request):
        report_type = request.query_params.get('type', 'summary')
        
        if report_type == 'patient_summary':
            return self._patient_summary_report()
        elif report_type == 'medicine_usage':
            return self._medicine_usage_report()
        elif report_type == 'bed_utilization':
            return self._bed_utilization_report()
        else:
            return self._summary_report()
    
    def _summary_report(self):
        # Monthly summary for the current year
        current_year = timezone.now().year
        monthly_data = []
        
        for month in range(1, 13):
            patients_count = Patient.objects.filter(
                created_at__year=current_year,
                created_at__month=month
            ).count()
            
            treatments_count = Treatment.objects.filter(
                visit_date__year=current_year,
                visit_date__month=month
            ).count()
            
            monthly_data.append({
                'month': month,
                'patients': patients_count,
                'treatments': treatments_count
            })
        
        return Response({'monthly_summary': monthly_data})
    
    def _patient_summary_report(self):
        # Patient demographics and statistics
        gender_stats = Patient.objects.values('gender').annotate(count=Count('id'))
        type_stats = Patient.objects.values('patient_type').annotate(count=Count('id'))
        department_stats = Patient.objects.values('department').annotate(count=Count('id'))[:10]
        
        return Response({
            'gender_distribution': list(gender_stats),
            'type_distribution': list(type_stats),
            'top_departments': list(department_stats)
        })
    
    def _medicine_usage_report(self):
        # Medicine stock and usage statistics
        stock_levels = Medicine.objects.values('name', 'current_stock', 'minimum_stock_level', 'stock_status')
        recent_transactions = MedicineTransaction.objects.filter(
            date__gte=timezone.now() - timedelta(days=30)
        ).values('medicine__name').annotate(total_issued=Count('id')).order_by('-total_issued')[:10]
        
        return Response({
            'stock_levels': list(stock_levels),
            'top_used_medicines': list(recent_transactions)
        })
    
    def _bed_utilization_report(self):
        # Bed utilization statistics
        bed_stats = Bed.objects.values('status').annotate(count=Count('id'))
        occupancy_history = BedAllocation.objects.filter(
            admission_date__gte=timezone.now() - timedelta(days=30)
        ).extra(
            select={'day': 'date(admission_date)'}
        ).values('day').annotate(admissions=Count('id')).order_by('day')
        
        return Response({
            'bed_status_distribution': list(bed_stats),
            'daily_admissions': list(occupancy_history)
        })


class LowStockView(APIView):
    """
    Get medicines with low stock
    """
    
    def get(self, request):
        low_stock_medicines = Medicine.objects.filter(
            current_stock__lte=F('minimum_stock_level'),
            is_active=True
        ).select_related()
        
        data = []
        for medicine in low_stock_medicines:
            data.append({
                'id': getattr(medicine, 'id'),
                'name': medicine.name,
                'current_stock': medicine.current_stock,
                'minimum_stock_level': medicine.minimum_stock_level,
                'unit': medicine.unit,
                'status': medicine.stock_status,
                'category': medicine.category,
            })
        
        return Response(data)


class BedAvailabilityView(APIView):
    """
    Get real-time bed availability
    """
    
    def get(self, request):
        beds = Bed.objects.filter(is_active=True).select_related()
        
        data = []
        for bed in beds:
            current_allocation = getattr(bed, 'allocations').filter(is_active=True).first()
            
            bed_data = {
                'id': getattr(bed, 'id'),
                'bed_number': bed.bed_number,
                'description': bed.description,
                'status': bed.status,
                'is_available': bed.status == 'available',
                'has_oxygen': bed.has_oxygen,
                'has_monitor': bed.has_monitor,
                'has_ventilator': bed.has_ventilator,
            }
            
            if current_allocation:
                bed_data['current_patient'] = {
                    'name': current_allocation.patient_name,
                    'patient_id': current_allocation.patient_id,
                    'admission_date': current_allocation.admission_date,
                    'attending_doctor': current_allocation.attending_doctor.get_full_name(),
                    'condition': current_allocation.condition,
                }
            
            data.append(bed_data)
        
        return Response(data)


class DoctorAvailabilityView(APIView):
    """
    Get doctor availability status
    """
    
    def get(self, request):
        doctors = User.objects.filter(
            user_type='doctor',
            is_active=True
        ).select_related()
        
        data = []
        for doctor in doctors:
            # Get current patient count for doctor
            current_patients = BedAllocation.objects.filter(
                attending_doctor=doctor,
                is_active=True
            ).count()
            
            # Get today's appointments/treatments
            today_treatments = Treatment.objects.filter(
                doctor=doctor,
                visit_date__date=timezone.now().date()
            ).count()
            
            data.append({
                'id': getattr(doctor, 'id'),
                'name': doctor.get_full_name(),
                'username': doctor.username,
                'department': doctor.department,
                'is_available': doctor.is_available,
                'phone': doctor.phone,
                'email': doctor.email,
                'current_patients': current_patients,
                'today_treatments': today_treatments,
            })
        
        return Response(data)