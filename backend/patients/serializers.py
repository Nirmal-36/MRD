from rest_framework import serializers
from .models import Patient, Treatment, TreatmentMedicine


class PatientSerializer(serializers.ModelSerializer):
    treatments_count = serializers.SerializerMethodField()
    last_visit = serializers.SerializerMethodField()
    user_status = serializers.SerializerMethodField()
    # Get actual phone and email from linked user account if available
    phone = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'user']
    
    def get_phone(self, obj):
        """Return phone from user account if linked, otherwise from patient record"""
        if obj.user and obj.user.phone:
            return obj.user.phone
        return obj.phone
    
    def get_email(self, obj):
        """Return email from user account if linked"""
        if obj.user and obj.user.email:
            return obj.user.email
        return None
    
    def get_treatments_count(self, obj):
        return obj.treatments.count()
    
    def get_last_visit(self, obj):
        last_treatment = obj.treatments.first()
        if last_treatment:
            return last_treatment.visit_date
        return None
    
    def get_user_status(self, obj):
        """Check if patient is linked to a registered user"""
        if obj.user:
            return {
                'linked': True,
                'username': obj.user.username,
                'user_type': obj.user.user_type,
                'registration_date': obj.user.date_joined
            }
        return {'linked': False}
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TreatmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    doctor_available = serializers.BooleanField(source='doctor.is_available', read_only=True)
    
    class Meta:
        model = Treatment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PatientDetailSerializer(PatientSerializer):
    recent_treatments = TreatmentSerializer(source='treatments', many=True, read_only=True)
    
    class Meta(PatientSerializer.Meta):
        fields = '__all__'

class TreatmentMedicineSerializer(serializers.ModelSerializer):
    """Serializer for prescribed medicines in a treatment"""
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    medicine_generic_name = serializers.CharField(source='medicine.generic_name', read_only=True)
    medicine_category = serializers.CharField(source='medicine.category', read_only=True)
    available_stock = serializers.IntegerField(source='medicine.current_stock', read_only=True)
    
    class Meta:
        model = TreatmentMedicine
        fields = [
            'id', 'medicine', 'medicine_name', 'medicine_generic_name', 
            'medicine_category', 'quantity', 'dosage', 'duration_days',
            'available_stock', 'stock_deducted', 'created_at'
        ]
        read_only_fields = ['stock_deducted', 'created_at']
    
    def validate(self, data):
        """Validate that enough stock is available"""
        medicine = data.get('medicine')
        quantity = data.get('quantity')
        
        if medicine and quantity:
            if medicine.current_stock < quantity:
                raise serializers.ValidationError({
                    'quantity': f'Insufficient stock. Available: {medicine.current_stock} {medicine.unit}'
                })
        
        return data


class TreatmentWithMedicinesSerializer(serializers.ModelSerializer):
    """Extended treatment serializer with prescribed medicines"""
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    doctor_available = serializers.BooleanField(source='doctor.is_available', read_only=True)
    prescribed_medicines = TreatmentMedicineSerializer(many=True, read_only=True)
    
    class Meta:
        model = Treatment
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'doctor_available',
            'visit_date', 'symptoms', 'diagnosis', 'treatment_given',
            'medicines_prescribed', 'dosage_instructions', 'severity',
            'follow_up_date', 'notes', 'prescribed_medicines',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['doctor', 'created_at', 'updated_at']
