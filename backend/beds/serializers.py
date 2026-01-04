from rest_framework import serializers
from django.utils import timezone
from .models import Bed, BedAllocation


class BedSerializer(serializers.ModelSerializer):
    is_available = serializers.ReadOnlyField()
    current_patient = serializers.SerializerMethodField()
    current_allocation_id = serializers.SerializerMethodField()
    equipment_list = serializers.ReadOnlyField()
    total_allocations = serializers.SerializerMethodField()
    
    class Meta:
        model = Bed
        fields = [
            'id', 'bed_number', 'description', 'status', 'has_oxygen', 'has_monitor',
            'has_ventilator', 'is_active', 'is_available', 'current_patient',
            'current_allocation_id', 'equipment_list', 'total_allocations', 
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'is_available', 'current_patient',
            'current_allocation_id', 'equipment_list', 'total_allocations'
        ]
    
    def get_current_allocation_id(self, obj):
        """Get the ID of the current active allocation"""
        active_allocation = obj.allocations.filter(is_active=True).first()
        return active_allocation.id if active_allocation else None
    
    def get_current_patient(self, obj):
        """Get information about current patient"""
        active_allocation = obj.allocations.filter(is_active=True).first()
        if active_allocation:
            return {
                'name': active_allocation.patient_name,
                'patient_id': active_allocation.patient_id,
                'admission_date': active_allocation.admission_date,
                'attending_doctor': active_allocation.attending_doctor.get_full_name(),
                'attending_doctor_id': active_allocation.attending_doctor.get_display_id(),
                'condition': active_allocation.condition,
                'days_admitted': active_allocation.duration_days
            }
        return None
    
    def get_total_allocations(self, obj):
        """Get total number of allocations for this bed"""
        return obj.allocations.count()
    
    def validate_bed_number(self, value):
        """Validate bed number format and uniqueness"""
        if not value.strip():
            raise serializers.ValidationError("Bed number cannot be empty.")
        
        # Check for uniqueness (excluding current instance during updates)
        queryset = Bed.objects.filter(bed_number=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A bed with this number already exists.")
        
        return value.strip().upper()  # Normalize to uppercase


class BedCreateUpdateSerializer(serializers.ModelSerializer):
    """Separate serializer for create/update operations"""
    
    class Meta:
        model = Bed
        fields = [
            'bed_number', 'description', 'has_oxygen', 'has_monitor',
            'has_ventilator', 'is_active'
        ]
    
    def validate_bed_number(self, value):
        """Validate and normalize bed number"""
        if not value.strip():
            raise serializers.ValidationError("Bed number cannot be empty.")
        
        # Check uniqueness
        queryset = Bed.objects.filter(bed_number=value.strip().upper())
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A bed with this number already exists.")
        
        return value.strip().upper()


class BedAllocationSerializer(serializers.ModelSerializer):
    bed_number = serializers.CharField(source='bed.bed_number', read_only=True)
    bed_equipment = serializers.CharField(source='bed.equipment_list', read_only=True)
    attending_doctor_name = serializers.CharField(source='attending_doctor.get_full_name', read_only=True)
    attending_doctor_display_id = serializers.CharField(source='attending_doctor.get_display_id', read_only=True)
    allocated_by_name = serializers.CharField(source='allocated_by.get_full_name', read_only=True)
    allocated_by_display_id = serializers.CharField(source='allocated_by.get_display_id', read_only=True)
    duration_days = serializers.ReadOnlyField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = BedAllocation
        fields = [
            'id', 'bed', 'bed_number', 'bed_equipment', 'patient_name', 'patient_id',
            'admission_date', 'expected_discharge_date', 'actual_discharge_date',
            'condition', 'special_requirements', 'attending_doctor', 'attending_doctor_name',
            'attending_doctor_display_id', 'is_active', 'discharge_notes',
            'allocated_by', 'allocated_by_name', 'allocated_by_display_id',
            'duration_days', 'is_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'allocated_by', 'created_at', 'updated_at', 'duration_days', 'is_overdue'
        ]
    
    def get_is_overdue(self, obj):
        """Check if patient is overdue for discharge"""
        if not obj.expected_discharge_date or obj.actual_discharge_date or not obj.is_active:
            return False
        return timezone.now().date() > obj.expected_discharge_date
    
    def validate(self, data):
        """Cross-field validation"""
        bed = data.get('bed')
        admission_date = data.get('admission_date')
        expected_discharge_date = data.get('expected_discharge_date')
        attending_doctor = data.get('attending_doctor')
        
        # Check if bed is available (for new allocations)
        if not self.instance and bed and not bed.is_available:
            raise serializers.ValidationError({
                'bed': f'Bed {bed.bed_number} is not available for allocation.'
            })
        
        # Validate dates
        if admission_date and expected_discharge_date:
            if expected_discharge_date < admission_date.date():
                raise serializers.ValidationError({
                    'expected_discharge_date': 'Expected discharge date cannot be before admission date.'
                })
        
        # Validate attending doctor
        if attending_doctor and attending_doctor.user_type != 'doctor':
            raise serializers.ValidationError({
                'attending_doctor': 'Only users with doctor role can be assigned as attending doctor.'
            })
        
        return data
    
    def create(self, validated_data):
        validated_data['allocated_by'] = self.context['request'].user
        
        # Mark bed as occupied
        bed = validated_data['bed']
        bed.status = 'occupied'
        bed.save()
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # If marking as inactive (discharged), make bed available
        if 'is_active' in validated_data and not validated_data['is_active']:
            if not instance.actual_discharge_date:
                validated_data['actual_discharge_date'] = timezone.now()
            
            # Make bed available
            instance.bed.status = 'available'
            instance.bed.save()
        
        return super().update(instance, validated_data)


class BedAllocationCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating new bed allocations"""
    
    class Meta:
        model = BedAllocation
        fields = [
            'bed', 'patient_name', 'patient_id', 'admission_date',
            'expected_discharge_date', 'condition', 'special_requirements',
            'attending_doctor'
        ]
    
    def validate(self, data):
        """Validation for new allocations"""
        bed = data.get('bed')
        admission_date = data.get('admission_date')
        expected_discharge_date = data.get('expected_discharge_date')
        attending_doctor = data.get('attending_doctor')
        
        # Check bed availability
        if bed and not bed.is_available:
            raise serializers.ValidationError({
                'bed': f'Bed {bed.bed_number} is currently occupied and not available for allocation.'
            })
        
        # Validate dates
        if admission_date and expected_discharge_date:
            if expected_discharge_date < admission_date.date():
                raise serializers.ValidationError({
                    'expected_discharge_date': 'Expected discharge date cannot be before admission date.'
                })
        
        # Validate doctor
        if attending_doctor and attending_doctor.user_type != 'doctor':
            raise serializers.ValidationError({
                'attending_doctor': 'Only doctors can be assigned as attending doctor.'
            })
        
        return data
    
    def create(self, validated_data):
        """Create bed allocation with allocated_by from request user"""
        validated_data['allocated_by'] = self.context['request'].user
        
        # Try to link to patient record if patient_id is provided
        patient_id = validated_data.get('patient_id')
        if patient_id:
            from patients.models import Patient
            try:
                patient = Patient.objects.get(employee_student_id=patient_id)
                validated_data['patient_record'] = patient
            except Patient.DoesNotExist:
                # Patient record doesn't exist yet, will use string fields only
                pass
        
        # Mark bed as occupied
        bed = validated_data['bed']
        bed.status = 'occupied'
        bed.save()
        
        return super().create(validated_data)


class BedDischargeSerializer(serializers.ModelSerializer):
    """Serializer for bed discharge operations"""
    
    class Meta:
        model = BedAllocation
        fields = ['discharge_notes', 'actual_discharge_date']
    
    def validate(self, data):
        """Validate discharge operation"""
        if not self.instance.is_active:
            raise serializers.ValidationError("This allocation is already discharged.")
        
        return data
    
    def update(self, instance, validated_data):
        """Handle discharge process"""
        validated_data['is_active'] = False
        if not validated_data.get('actual_discharge_date'):
            validated_data['actual_discharge_date'] = timezone.now()
        
        # Make bed available
        instance.bed.status = 'available'
        instance.bed.save()
        
        return super().update(instance, validated_data)