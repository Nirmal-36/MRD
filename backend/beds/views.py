from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from .models import Bed, BedAllocation
from .serializers import (
    BedSerializer, BedCreateUpdateSerializer, BedAllocationSerializer,
    BedAllocationCreateSerializer, BedDischargeSerializer
)
from users.permissions import IsMedicalStaff, IsPatientReadOnly


class BedViewSet(viewsets.ModelViewSet):
    """ViewSet for managing beds"""
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    permission_classes = [IsAuthenticated, IsPatientReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    def get_permissions(self):
        """Students can only view bed availability, not manage beds"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsMedicalStaff]
        else:
            permission_classes = [IsAuthenticated, IsPatientReadOnly]
        return [permission() for permission in permission_classes]
    
    filterset_fields = ['status', 'has_oxygen', 'has_monitor', 'has_ventilator', 'is_active']
    search_fields = ['bed_number', 'description']
    ordering_fields = ['bed_number', 'created_at']
    ordering = ['bed_number']
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action in ['create', 'update', 'partial_update']:
            return BedCreateUpdateSerializer
        return BedSerializer
    
    def get_queryset(self):
        """Custom queryset with additional filtering"""
        queryset = Bed.objects.filter(is_active=True)
        
        # Filter by equipment
        has_equipment = getattr(self.request, 'query_params', self.request.GET).get('has_equipment')
        if has_equipment == 'oxygen':
            queryset = queryset.filter(has_oxygen=True)
        elif has_equipment == 'monitor':
            queryset = queryset.filter(has_monitor=True)
        elif has_equipment == 'ventilator':
            queryset = queryset.filter(has_ventilator=True)
        elif has_equipment == 'any':
            queryset = queryset.filter(
                Q(has_oxygen=True) | Q(has_monitor=True) | Q(has_ventilator=True)
            )
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available beds with optional equipment filtering"""
        queryset = Bed.objects.filter(status='available', is_active=True)
        
        # Filter by equipment requirements
        oxygen_required = request.query_params.get('oxygen') == 'true'
        monitor_required = request.query_params.get('monitor') == 'true'
        ventilator_required = request.query_params.get('ventilator') == 'true'
        
        if oxygen_required:
            queryset = queryset.filter(has_oxygen=True)
        if monitor_required:
            queryset = queryset.filter(has_monitor=True)
        if ventilator_required:
            queryset = queryset.filter(has_ventilator=True)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def occupied(self, request):
        """Get all occupied beds with patient information"""
        beds = Bed.objects.filter(status='occupied', is_active=True)
        serializer = self.get_serializer(beds, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get bed utilization analytics"""
        total_beds = Bed.objects.filter(is_active=True).count()
        available_count = Bed.objects.filter(status='available', is_active=True).count()
        occupied_count = Bed.objects.filter(status='occupied', is_active=True).count()
        
        # Equipment breakdown
        oxygen_beds = Bed.objects.filter(has_oxygen=True, is_active=True).count()
        monitor_beds = Bed.objects.filter(has_monitor=True, is_active=True).count()
        ventilator_beds = Bed.objects.filter(has_ventilator=True, is_active=True).count()
        
        # Utilization statistics
        utilization_rate = round((occupied_count / max(total_beds, 1)) * 100, 2)
        
        return Response({
            'summary': {
                'total_beds': total_beds,
                'available_beds': available_count,
                'occupied_beds': occupied_count,
                'utilization_rate': utilization_rate
            },
            'equipment': {
                'oxygen_equipped': oxygen_beds,
                'monitor_equipped': monitor_beds,
                'ventilator_equipped': ventilator_beds
            },
            'status_distribution': {
                'available': available_count,
                'occupied': occupied_count
            }
        })
    
    @action(detail=False, methods=['get'])
    def equipment_summary(self, request):
        """Get summary of beds by equipment type"""
        equipment_stats = {
            'oxygen': {
                'total': Bed.objects.filter(has_oxygen=True, is_active=True).count(),
                'available': Bed.objects.filter(has_oxygen=True, status='available', is_active=True).count()
            },
            'monitor': {
                'total': Bed.objects.filter(has_monitor=True, is_active=True).count(),
                'available': Bed.objects.filter(has_monitor=True, status='available', is_active=True).count()
            },
            'ventilator': {
                'total': Bed.objects.filter(has_ventilator=True, is_active=True).count(),
                'available': Bed.objects.filter(has_ventilator=True, status='available', is_active=True).count()
            }
        }
        
        return Response(equipment_stats)


class BedAllocationViewSet(viewsets.ModelViewSet):
    queryset = BedAllocation.objects.all()
    serializer_class = BedAllocationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['bed', 'attending_doctor', 'is_active']
    search_fields = ['patient_name', 'patient_id', 'condition']
    ordering_fields = ['admission_date', 'expected_discharge_date']
    ordering = ['-admission_date']
    
    def get_permissions(self):
        """Doctors can create allocations and discharge patients.
        Note: Nurses are kept for backward compatibility but doctors handle all duties."""
        if self.action in ['create', 'discharge']:
            # Doctors (and legacy nurse accounts) can allocate/discharge
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Only medical staff can update/delete
            permission_classes = [IsAuthenticated, IsMedicalStaff]
        else:
            # All authenticated users can view
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return BedAllocationCreateSerializer
        elif self.action == 'discharge':
            return BedDischargeSerializer
        return BedAllocationSerializer
    
    def get_queryset(self):
        """Custom queryset with additional filtering. HODs can only see allocations for their department's patients."""
        user = self.request.user
        
        # HODs can only see bed allocations for patients from their department
        if getattr(user, 'user_type', None) == 'hod':
            from users.models import User
            from patients.models import Patient
            dept_users = User.objects.filter(department=getattr(user, 'department'), is_active=True)
            dept_patients = Patient.objects.filter(user__in=dept_users)
            # Filter allocations where patient_name or patient_id matches department patients
            queryset = BedAllocation.objects.filter(
                patient_id__in=dept_patients.values_list('employee_student_id', flat=True)
            )
        else:
            queryset = super().get_queryset()
        
        # Filter by doctor for current user
        if getattr(self.request, 'query_params', self.request.GET).get('my_patients') == 'true':
            if getattr(user, 'user_type', None) == 'doctor':
                queryset = queryset.filter(attending_doctor=user)
        
        # Filter overdue patients
        if getattr(self.request, 'query_params', self.request.GET).get('overdue') == 'true':
            today = timezone.now().date()
            queryset = queryset.filter(
                expected_discharge_date__lt=today,
                is_active=True,
                actual_discharge_date__isnull=True
            )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create bed allocation - only doctors and admin can allocate beds.
        Note: Nurse type kept for backward compatibility."""
        if request.user.user_type not in ['doctor', 'nurse', 'admin']:
            return Response(
                {'error': 'Only doctors and admins can allocate beds'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active bed allocations"""
        allocations = BedAllocation.objects.filter(is_active=True)
        serializer = self.get_serializer(allocations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue patients (past expected discharge date)"""
        today = timezone.now().date()
        overdue_allocations = BedAllocation.objects.filter(
            expected_discharge_date__lt=today,
            is_active=True,
            actual_discharge_date__isnull=True
        )
        serializer = self.get_serializer(overdue_allocations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def admissions_today(self, request):
        """Get today's admissions"""
        today = timezone.now().date()
        today_admissions = BedAllocation.objects.filter(
            admission_date__date=today
        )
        serializer = self.get_serializer(today_admissions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expected_discharges(self, request):
        """Get patients expected to be discharged today"""
        today = timezone.now().date()
        expected_discharges = BedAllocation.objects.filter(
            expected_discharge_date=today,
            is_active=True,
            actual_discharge_date__isnull=True
        )
        serializer = self.get_serializer(expected_discharges, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def discharge(self, request, pk=None):
        """Discharge patient from bed"""
        allocation = self.get_object()
        
        if not allocation.is_active:
            return Response({'error': 'Patient already discharged'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(allocation, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True, 
                'message': f'Patient {allocation.patient_name} discharged successfully',
                'bed_number': allocation.bed.bed_number
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get bed allocation analytics"""
        total_allocations = BedAllocation.objects.count()
        active_allocations = BedAllocation.objects.filter(is_active=True).count()
        
        # Today's statistics
        today = timezone.now().date()
        today_admissions = BedAllocation.objects.filter(admission_date__date=today).count()
        today_discharges = BedAllocation.objects.filter(actual_discharge_date__date=today).count()
        expected_discharges_today = BedAllocation.objects.filter(
            expected_discharge_date=today,
            is_active=True,
            actual_discharge_date__isnull=True
        ).count()
        
        # Overdue patients
        overdue_count = BedAllocation.objects.filter(
            expected_discharge_date__lt=today,
            is_active=True,
            actual_discharge_date__isnull=True
        ).count()
        
        # Average stay duration for discharged patients
        discharged_allocations = BedAllocation.objects.filter(
            actual_discharge_date__isnull=False
        )
        
        total_days = sum([allocation.duration_days for allocation in discharged_allocations])
        avg_stay = round(total_days / max(discharged_allocations.count(), 1), 1)
        
        return Response({
            'summary': {
                'total_allocations': total_allocations,
                'active_allocations': active_allocations,
                'average_stay_days': avg_stay
            },
            'today': {
                'admissions': today_admissions,
                'discharges': today_discharges,
                'expected_discharges': expected_discharges_today
            },
            'alerts': {
                'overdue_patients': overdue_count
            }
        })
