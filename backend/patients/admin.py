from django.contrib import admin
from .models import Patient, Treatment


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('name', 'employee_student_id', 'age', 'gender', 'patient_type', 'created_at')
    list_filter = ('gender', 'patient_type', 'blood_group')
    search_fields = ('name', 'employee_student_id', 'phone')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('employee_student_id', 'name', 'age', 'gender', 'patient_type')
        }),
        ('Contact Information', {
            'fields': ('phone',)
        }),
        ('Medical Information', {
            'fields': ('blood_group', 'allergies', 'chronic_conditions')
        }),
        ('System Fields', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'visit_date', 'diagnosis', 'severity')
    list_filter = ('severity', 'visit_date', 'doctor')
    search_fields = ('patient__name', 'patient__annual_number', 'diagnosis', 'symptoms')
    date_hierarchy = 'visit_date'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Visit Information', {
            'fields': ('patient', 'doctor', 'visit_date', 'severity')
        }),
        ('Medical Details', {
            'fields': ('symptoms', 'diagnosis', 'treatment_given')
        }),
        ('Medication', {
            'fields': ('medicines_prescribed', 'dosage_instructions')
        }),
        ('Follow-up', {
            'fields': ('follow_up_date', 'notes')
        }),
        ('System Fields', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
