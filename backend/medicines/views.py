from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F, Q, Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import Medicine, MedicineTransaction, StockRequest
from .serializers import (
    MedicineSerializer, MedicineCreateUpdateSerializer, PatientMedicineSerializer,
    MedicineTransactionSerializer, StockRequestSerializer, 
    StockRequestApprovalSerializer
)
from users.permissions import IsMedicalStaff, IsPharmacist, IsDoctorOrAdmin, IsPharmacistOrPatientReadOnly


class MedicineViewSet(viewsets.ModelViewSet):
    """ViewSet for managing medicines"""
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated, IsPharmacistOrPatientReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'manufacturer', 'is_active']
    search_fields = ['name', 'generic_name', 'description', 'batch_number']
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action in ['create', 'update', 'partial_update']:
            return MedicineCreateUpdateSerializer
        return MedicineSerializer

    def get_queryset(self):
        """Filter medicines based on user type and query parameters"""
        queryset = super().get_queryset()
        user_type = getattr(self.request.user, 'user_type', None)
        if user_type in ['student', 'employee']:
            queryset = queryset.filter(is_active=True)

        expiry_status = self.request.query_params.get('expiry_status')
        if expiry_status == 'expired':
            queryset = queryset.filter(expiry_date__lt=timezone.now().date())
        elif expiry_status == 'expiring_soon':
            thirty_days_later = timezone.now().date() + timedelta(days=30)
            queryset = queryset.filter(
                expiry_date__lte=thirty_days_later,
                expiry_date__gte=timezone.now().date()
            )

        stock_status = self.request.query_params.get('stock_status')
        if stock_status == 'low_stock':
            queryset = queryset.filter(current_stock__lte=F('minimum_stock_level'))
        elif stock_status == 'out_of_stock':
            queryset = queryset.filter(current_stock=0)
        elif stock_status == 'adequate':
            queryset = queryset.filter(current_stock__gt=F('minimum_stock_level'))

        return queryset
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get medicines with low stock"""
        medicines = Medicine.objects.filter(
            current_stock__lte=F('minimum_stock_level'),
            is_active=True
        )
        serializer = self.get_serializer(medicines, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Get medicines that are out of stock"""
        medicines = Medicine.objects.filter(current_stock=0, is_active=True)
        serializer = self.get_serializer(medicines, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get medicines expiring in next 30 days"""
        from datetime import timedelta
        thirty_days_later = timezone.now().date() + timedelta(days=30)
        medicines = Medicine.objects.filter(
            expiry_date__lte=thirty_days_later,
            expiry_date__gte=timezone.now().date(),
            is_active=True
        )
        serializer = self.get_serializer(medicines, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        """Manually adjust medicine stock"""
        medicine = self.get_object()
        new_stock = request.data.get('new_stock')
        reason = request.data.get('reason', 'Manual adjustment')
        
        if new_stock is None:
            return Response({'error': 'new_stock is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_stock = int(new_stock)
            if new_stock < 0:
                return Response({'error': 'Stock cannot be negative'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create adjustment transaction
            quantity_diff = abs(medicine.current_stock - new_stock)
            transaction_type = 'received' if new_stock > medicine.current_stock else 'adjustment'
            
            MedicineTransaction.objects.create(
                medicine=medicine,
                transaction_type=transaction_type,
                quantity=quantity_diff,
                date=timezone.now(),
                performed_by=request.user,
                remarks=reason
            )
            
            medicine.current_stock = new_stock
            # Use skip_stock_validation to bypass direct stock change validation
            medicine.save(skip_stock_validation=True)
            
            return Response({
                'success': True,
                'new_stock': medicine.current_stock,
                'message': f'Stock adjusted to {new_stock}'
            })
            
        except ValueError:
            return Response({'error': 'Invalid stock value'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get medicine analytics and statistics"""
        total_medicines = Medicine.objects.filter(is_active=True).count()
        low_stock_count = Medicine.objects.filter(
            current_stock__lte=F('minimum_stock_level'),
            is_active=True
        ).count()
        out_of_stock_count = Medicine.objects.filter(
            current_stock=0,
            is_active=True
        ).count()
        
        # Expiry analysis
        today = timezone.now().date()
        thirty_days_later = today + timedelta(days=30)
        expired_count = Medicine.objects.filter(
            expiry_date__lt=today,
            is_active=True
        ).count()
        expiring_soon_count = Medicine.objects.filter(
            expiry_date__lte=thirty_days_later,
            expiry_date__gte=today,
            is_active=True
        ).count()
        
        # Value analysis
        total_stock_value = Medicine.objects.filter(is_active=True).aggregate(
            total_value=Sum(F('current_stock') * F('unit_price'))
        )['total_value'] or 0
        
        # Category breakdown
        category_stats = Medicine.objects.filter(is_active=True).values('category').annotate(
            count=Count('id'),
            total_stock=Sum('current_stock'),
            total_value=Sum(F('current_stock') * F('unit_price'))
        ).order_by('-count')
        
        return Response({
            'summary': {
                'total_medicines': total_medicines,
                'low_stock_count': low_stock_count,
                'out_of_stock_count': out_of_stock_count,
                'expired_count': expired_count,
                'expiring_soon_count': expiring_soon_count,
                'total_stock_value': float(total_stock_value),
                'stock_health_percentage': round(
                    ((total_medicines - low_stock_count - out_of_stock_count) / max(total_medicines, 1)) * 100, 2
                )
            },
            'categories': list(category_stats),
            'alerts': {
                'critical': out_of_stock_count + expired_count,
                'warning': low_stock_count + expiring_soon_count
            }
        })
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get list of medicine categories with counts"""
        categories = Medicine.objects.filter(is_active=True).values('category').annotate(
            count=Count('id'),
            low_stock_count=Count('id', filter=Q(current_stock__lte=F('minimum_stock_level'))),
            out_of_stock_count=Count('id', filter=Q(current_stock=0))
        ).order_by('category')
        
        return Response(list(categories))


class MedicineTransactionViewSet(viewsets.ModelViewSet):
    queryset = MedicineTransaction.objects.all()
    serializer_class = MedicineTransactionSerializer
    permission_classes = [IsAuthenticated, IsPharmacist]  # Only pharmacists can access transactions
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['transaction_type', 'medicine', 'performed_by']
    search_fields = ['medicine__name', 'supplier', 'patient', 'remarks']
    ordering_fields = ['date']
    ordering = ['-date']
    
    def get_queryset(self):
        """Restrict access to medicine transactions. HODs can only see transactions related to their department's patients."""
        user = self.request.user
        
        # HODs can only see transactions related to their department's patients
        if getattr(user, 'user_type', None) == 'hod':
            from users.models import User
            from patients.models import Patient
            dept_users = User.objects.filter(department=user.department, is_active=True)
            dept_patients = Patient.objects.filter(user__in=dept_users)
            # Filter transactions that have patient field linked to department patients
            return MedicineTransaction.objects.filter(patient__in=dept_patients.values_list('name', flat=True))
        
        # Medical staff can see all transactions
        return MedicineTransaction.objects.all()
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's transactions"""
        today = timezone.now().date()
        transactions = MedicineTransaction.objects.filter(date__date=today)
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)


class StockRequestViewSet(viewsets.ModelViewSet):
    queryset = StockRequest.objects.all()
    serializer_class = StockRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'medicine', 'requested_by', 'approved_by']
    search_fields = ['medicine__name', 'reason', 'notes']
    ordering_fields = ['requested_date', 'priority', 'approved_date']
    ordering = ['-requested_date']
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action in ['approve', 'reject']:
            return StockRequestApprovalSerializer
        return StockRequestSerializer
    
    def get_queryset(self):
        """Custom queryset with additional filtering"""
        queryset = super().get_queryset()
        
        # Filter by age of request
        days_old = self.request.query_params.get('days_old')
        if days_old:
            try:
                days_ago = timezone.now() - timedelta(days=int(days_old))
                queryset = queryset.filter(requested_date__lte=days_ago)
            except ValueError:
                pass
        
        # Filter requests for current user
        if self.request.query_params.get('my_requests') == 'true':
            queryset = queryset.filter(requested_by=self.request.user)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a stock request and increment medicine stock"""
        stock_request = self.get_object()
        if stock_request.status != 'pending':
            return Response({
                'error': 'Only pending requests can be approved'
            }, status=status.HTTP_400_BAD_REQUEST)
        # Update request status
        stock_request.status = 'approved'
        stock_request.approved_by = request.user
        stock_request.approved_date = timezone.now()
        stock_request.save()
        # Increment medicine stock using transaction
        medicine = stock_request.medicine
        quantity = stock_request.requested_quantity
        from django.utils import timezone as dj_timezone
        from medicines.models import MedicineTransaction
        MedicineTransaction.objects.create(
            medicine=medicine,
            transaction_type='received',
            quantity=quantity,
            date=dj_timezone.now(),
            performed_by=request.user,
            remarks=f"Stock request approved (ID: {stock_request.id})"
        )
        medicine.current_stock += quantity
        medicine.save(skip_stock_validation=True)
        
        return Response({
            'success': True,
            'message': 'Stock request approved and stock updated',
            'new_stock': medicine.current_stock
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a stock request"""
        stock_request = self.get_object()
        
        if stock_request.status != 'pending':
            return Response({
                'error': 'Only pending requests can be rejected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        stock_request.status = 'rejected'
        stock_request.approved_by = request.user
        stock_request.approved_date = timezone.now()
        stock_request.notes = request.data.get('reason', 'Request rejected')
        stock_request.save()
        
        return Response({
            'success': True,
            'message': 'Stock request rejected'
        })
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending stock requests"""
        requests = StockRequest.objects.filter(status='pending')
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)
