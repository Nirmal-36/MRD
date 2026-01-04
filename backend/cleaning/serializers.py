from rest_framework import serializers
from django.utils import timezone
from .models import CleaningRecord, CleaningStaff


class CleaningStaffSerializer(serializers.ModelSerializer):
    """Serializer for managing cleaning staff information"""
    
    class Meta:
        model = CleaningStaff
        fields = [
            'id', 'name', 'contact_number', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_name(self, value):
        """Validate staff name"""
        if not value.strip():
            raise serializers.ValidationError("Staff name cannot be empty.")
        return value.strip().title()


class CleaningRecordSerializer(serializers.ModelSerializer):
    """Main serializer for cleaning records with all details"""
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    recorded_by_display_id = serializers.CharField(source='recorded_by.get_display_id', read_only=True)
    duration_minutes = serializers.ReadOnlyField()
    duration_display = serializers.ReadOnlyField()
    quality_rating_display = serializers.SerializerMethodField()
    
    class Meta:
        model = CleaningRecord
        fields = [
            'id', 'cleaner_name', 'cleaner_contact', 'cleaning_date',
            'start_time', 'end_time', 'supplies_used', 'areas_cleaned',
            'notes', 'quality_rating', 'quality_rating_display',
            'recorded_by', 'recorded_by_name', 'recorded_by_display_id',
            'duration_minutes', 'duration_display', 'recorded_at', 'updated_at'
        ]
        read_only_fields = [
            'recorded_by', 'recorded_at', 'updated_at', 'duration_minutes',
            'duration_display', 'quality_rating_display'
        ]
    
    def get_quality_rating_display(self, obj):
        """Get quality rating with stars"""
        if obj.quality_rating:
            stars = '⭐' * obj.quality_rating
            return f"{obj.quality_rating}/5 {stars}"
        return None
    
    def validate(self, data):
        """Cross-field validation"""
        cleaning_date = data.get('cleaning_date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        # Validate date is not in future
        if cleaning_date and cleaning_date > timezone.now().date():
            raise serializers.ValidationError({
                'cleaning_date': 'Cleaning date cannot be in the future.'
            })
        
        # Validate times
        if start_time and end_time:
            if end_time <= start_time:
                raise serializers.ValidationError({
                    'end_time': 'End time must be after start time.'
                })
        
        return data
    
    def create(self, validated_data):
        """Set the user who recorded this cleaning"""
        validated_data['recorded_by'] = self.context['request'].user
        return super().create(validated_data)


class CleaningRecordCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating new cleaning records"""
    staff_suggestions = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = CleaningRecord
        fields = [
            'cleaner_name', 'cleaner_contact', 'cleaning_date',
            'start_time', 'end_time', 'supplies_used', 'areas_cleaned',
            'notes', 'quality_rating', 'staff_suggestions'
        ]
    
    def get_staff_suggestions(self, obj=None):
        """Get list of regular cleaning staff for suggestions"""
        staff = CleaningStaff.objects.filter(is_active=True)
        return CleaningStaffSerializer(staff, many=True).data
    
    def validate_cleaner_name(self, value):
        """Validate and normalize cleaner name"""
        if not value.strip():
            raise serializers.ValidationError("Cleaner name is required.")
        return value.strip().title()
    
    def validate(self, data):
        """Cross-field validation for creation"""
        cleaning_date = data.get('cleaning_date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        # Must provide cleaning date
        if not cleaning_date:
            raise serializers.ValidationError({
                'cleaning_date': 'Cleaning date is required.'
            })
        
        # Date validation
        if cleaning_date > timezone.now().date():
            raise serializers.ValidationError({
                'cleaning_date': 'Cannot record cleaning for future dates.'
            })
        
        # Time validation
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })
        
        # Areas cleaned is required
        if not data.get('areas_cleaned', '').strip():
            raise serializers.ValidationError({
                'areas_cleaned': 'Please specify what areas were cleaned.'
            })
        
        return data