from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta, datetime

from .models import CleaningRecord, CleaningStaff
from .serializers import (
    CleaningRecordSerializer, 
    CleaningRecordCreateSerializer,
    CleaningStaffSerializer
)
from users.permissions import IsMedicalStaff


class CleaningStaffViewSet(viewsets.ModelViewSet):
    """ViewSet for managing cleaning staff"""
    queryset = CleaningStaff.objects.all()
    serializer_class = CleaningStaffSerializer
    permission_classes = [IsAuthenticated, IsMedicalStaff]
    
    def get_queryset(self):
        """Filter cleaning staff based on parameters"""
        user_type = getattr(self.request.user, 'user_type', None)
        if user_type == 'student':
            return CleaningStaff.objects.none()
        queryset = self.queryset
        # Filter by active status
        active_only = self.request.GET.get('active_only', 'false').lower() == 'true'
        if active_only:
            queryset = queryset.filter(is_active=True)
        # Search by name
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(contact_number__icontains=search)
            )
        return queryset.order_by('name')
    
    @action(detail=False, methods=['get'])
    def active_staff(self, request):
        """Get only active cleaning staff for quick selection"""
        active_staff = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(active_staff, many=True)
        return Response(serializer.data)


class CleaningRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for managing medical room cleaning records"""
    queryset = CleaningRecord.objects.all()
    serializer_class = CleaningRecordSerializer
    permission_classes = [IsAuthenticated, IsMedicalStaff]
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return CleaningRecordCreateSerializer
        return CleaningRecordSerializer
    
    def get_queryset(self):
        """Filter cleaning records based on parameters"""
        user_type = getattr(self.request.user, 'user_type', None)
        if user_type == 'student':
            return CleaningRecord.objects.none()
        queryset = self.queryset.select_related('recorded_by')
        # Date filters
        date_from = self.request.GET.get('date_from')
        date_to = self.request.GET.get('date_to')
        today_only = self.request.GET.get('today_only', 'false').lower() == 'true'
        if today_only:
            today = timezone.now().date()
            queryset = queryset.filter(cleaning_date=today)
        elif date_from:
            queryset = queryset.filter(cleaning_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(cleaning_date__lte=date_to)
        # Staff filters
        cleaner_name = self.request.GET.get('cleaner_name')
        recorded_by = self.request.GET.get('recorded_by')
        if cleaner_name:
            queryset = queryset.filter(cleaner_name__icontains=cleaner_name)
        if recorded_by:
            queryset = queryset.filter(recorded_by_id=recorded_by)
        # Quality filter
        min_rating = self.request.GET.get('min_rating')
        if min_rating:
            queryset = queryset.filter(quality_rating__gte=min_rating)
        return queryset.order_by('-cleaning_date', '-start_time')
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get cleaning dashboard statistics"""
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Basic counts
        total_records = CleaningRecord.objects.count()
        today_cleanings = CleaningRecord.objects.filter(cleaning_date=today).count()
        week_cleanings = CleaningRecord.objects.filter(cleaning_date__gte=week_ago).count()
        month_cleanings = CleaningRecord.objects.filter(cleaning_date__gte=month_ago).count()
        
        # Average quality rating
        avg_rating = CleaningRecord.objects.filter(
            quality_rating__isnull=False,
            cleaning_date__gte=month_ago
        ).aggregate(avg_rating=Avg('quality_rating'))['avg_rating']
        
        # Top cleaners this month
        top_cleaners = CleaningRecord.objects.filter(
            cleaning_date__gte=month_ago
        ).values('cleaner_name').annotate(
            cleaning_count=Count('id'),
            avg_rating=Avg('quality_rating')
        ).order_by('-cleaning_count')[:5]
        
        # Recent activity (last 10 records)
        recent_records = CleaningRecord.objects.select_related('recorded_by')\
            .order_by('-recorded_at')[:10]
        recent_serializer = CleaningRecordSerializer(recent_records, many=True)
        
        return Response({
            'total_records': total_records,
            'today_cleanings': today_cleanings,
            'week_cleanings': week_cleanings,
            'month_cleanings': month_cleanings,
            'average_rating': round(avg_rating, 1) if avg_rating else None,
            'top_cleaners': list(top_cleaners),
            'recent_activity': recent_serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def today_summary(self, request):
        """Get today's cleaning summary"""
        today = timezone.now().date()
        today_records = CleaningRecord.objects.filter(
            cleaning_date=today
        ).select_related('recorded_by')
        
        serializer = self.get_serializer(today_records, many=True)
        return Response({
            'date': today,
            'total_cleanings': today_records.count(),
            'records': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def cleaning_history(self, request):
        """Get cleaning history with aggregated data"""
        # Get date range (default to last 30 days)
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        # Daily cleaning counts
        daily_stats = CleaningRecord.objects.filter(
            cleaning_date__gte=start_date
        ).extra(
            select={'day': 'date(cleaning_date)'}
        ).values('day').annotate(
            count=Count('id'),
            avg_rating=Avg('quality_rating')
        ).order_by('day')
        
        # Cleaner performance
        cleaner_stats = CleaningRecord.objects.filter(
            cleaning_date__gte=start_date
        ).values('cleaner_name').annotate(
            total_cleanings=Count('id'),
            avg_rating=Avg('quality_rating'),
            latest_cleaning=timezone.now().date()  # Will be overridden by max
        ).order_by('-total_cleanings')
        
        return Response({
            'period_days': days,
            'start_date': start_date,
            'daily_stats': list(daily_stats),
            'cleaner_performance': list(cleaner_stats)
        })
    
    @action(detail=False, methods=['get'])
    def staff_suggestions(self, request):
        """Get staff suggestions for creating new records"""
        # Active cleaning staff
        active_staff = CleaningStaff.objects.filter(is_active=True)
        staff_serializer = CleaningStaffSerializer(active_staff, many=True)
        
        # Recent cleaners (from cleaning records)
        recent_cleaners = CleaningRecord.objects.values('cleaner_name', 'cleaner_contact')\
            .distinct().order_by('-cleaning_date')[:10]
        
        return Response({
            'registered_staff': staff_serializer.data,
            'recent_cleaners': list(recent_cleaners)
        })
