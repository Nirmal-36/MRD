from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Q
from .models import Bed, BedAllocation


@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = [
        'bed_number', 'status_colored', 'current_patient_info', 
        'equipment_display', 'is_active', 'created_at'
    ]
    list_filter = ['status', 'has_oxygen', 'has_monitor', 'has_ventilator', 'is_active']
    search_fields = ['bed_number', 'description']
    ordering = ['bed_number']
    readonly_fields = ['created_at', 'updated_at', 'current_patient', 'equipment_list']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('bed_number', 'description', 'status')
        }),
        ('Equipment', {
            'fields': ('has_oxygen', 'has_monitor', 'has_ventilator', 'equipment_list'),
            'description': 'Available medical equipment for this bed'
        }),
        ('Status & System', {
            'fields': ('is_active', 'current_patient', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_colored(self, obj):
        """Display status with colors"""
        colors = {
            'available': 'green',
            'occupied': 'orange'
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_colored.short_description = 'Status'
    status_colored.admin_order_field = 'status'
    
    def current_patient_info(self, obj):
        """Display current patient information"""
        if obj.status == 'occupied':
            patient = obj.current_patient
            if patient:
                return format_html('<strong>{}</strong>', patient)
        return '-'
    current_patient_info.short_description = 'Current Patient'
    
    def equipment_display(self, obj):
        """Display available equipment"""
        equipment = obj.equipment_list
        if equipment:
            return ', '.join(equipment)
        return 'None'
    equipment_display.short_description = 'Equipment'
    
    actions = ['make_available', 'mark_occupied']
    
    def make_available(self, request, queryset):
        """Mark selected beds as available"""
        # Only allow if bed is not currently occupied with active allocation
        available_beds = []
        for bed in queryset:
            if not bed.allocations.filter(is_active=True).exists():
                bed.status = 'available'
                bed.save()
                available_beds.append(bed.bed_number)
        
        if available_beds:
            self.message_user(request, f'Beds {", ".join(available_beds)} marked as available.')
        else:
            self.message_user(request, 'No beds could be marked as available (check for active allocations).')
    make_available.short_description = 'Mark selected beds as available'


@admin.register(BedAllocation)
class BedAllocationAdmin(admin.ModelAdmin):
    list_display = [
        'patient_name', 'patient_id', 'bed_number', 'attending_doctor',
        'admission_date', 'expected_discharge_date', 'duration_days', 
        'status_display', 'is_overdue'
    ]
    list_filter = [
        'is_active', 'admission_date', 'expected_discharge_date',
        'attending_doctor', 'bed__status'
    ]
    search_fields = [
        'patient_name', 'patient_id', 'condition', 'bed__bed_number',
        'attending_doctor__first_name', 'attending_doctor__last_name'
    ]
    ordering = ['-admission_date']
    readonly_fields = [
        'allocated_by', 'created_at', 'updated_at', 'duration_days'
    ]
    date_hierarchy = 'admission_date'
    
    fieldsets = (
        ('Patient Information', {
            'fields': ('patient_name', 'patient_id', 'condition', 'special_requirements')
        }),
        ('Bed & Medical Team', {
            'fields': ('bed', 'attending_doctor')
        }),
        ('Timeline', {
            'fields': ('admission_date', 'expected_discharge_date', 'actual_discharge_date', 'duration_days'),
            'description': 'Admission and discharge timeline'
        }),
        ('Status & Notes', {
            'fields': ('is_active', 'discharge_notes')
        }),
        ('System Information', {
            'fields': ('allocated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def bed_number(self, obj):
        """Display bed number"""
        return obj.bed.bed_number
    bed_number.short_description = 'Bed'
    bed_number.admin_order_field = 'bed__bed_number'
    
    def status_display(self, obj):
        """Display allocation status with colors"""
        if obj.is_active:
            color = 'green'
            text = 'Active'
        else:
            color = 'gray'
            text = 'Discharged'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, text
        )
    status_display.short_description = 'Status'
    status_display.admin_order_field = 'is_active'
    
    def is_overdue(self, obj):
        """Check if patient is overdue for discharge"""
        if not obj.expected_discharge_date or obj.actual_discharge_date or not obj.is_active:
            return '-'
        
        today = timezone.now().date()
        if today > obj.expected_discharge_date:
            return format_html('<span style="color: red; font-weight: bold;">OVERDUE</span>')
        elif today == obj.expected_discharge_date:
            return format_html('<span style="color: orange; font-weight: bold;">DUE TODAY</span>')
        else:
            return 'On Track'
    is_overdue.short_description = 'Discharge Status'
    
    def get_readonly_fields(self, request, obj=None):
        """Dynamic readonly fields"""
        readonly = list(self.readonly_fields)
        
        if obj and not obj.is_active:
            # If patient is discharged, make most fields readonly
            readonly.extend([
                'patient_name', 'patient_id', 'bed', 'attending_doctor',
                'admission_date', 'expected_discharge_date', 'condition'
            ])
        
        return readonly
    
    def save_model(self, request, obj, form, change):
        """Auto-set allocated_by and handle bed status"""
        if not change:  # Creating new allocation
            obj.allocated_by = request.user
            # Mark bed as occupied
            obj.bed.status = 'occupied'
            obj.bed.save()
        else:  # Updating existing allocation
            # If discharging patient
            if 'is_active' in form.changed_data and not obj.is_active:
                if not obj.actual_discharge_date:
                    obj.actual_discharge_date = timezone.now()
                # Make bed available
                obj.bed.status = 'available'
                obj.bed.save()
        
        super().save_model(request, obj, form, change)
    
    actions = ['discharge_patients', 'extend_stay']
    
    def discharge_patients(self, request, queryset):
        """Discharge selected active patients"""
        discharged = 0
        for allocation in queryset.filter(is_active=True):
            allocation.is_active = False
            allocation.actual_discharge_date = timezone.now()
            allocation.save()
            
            # Make bed available
            allocation.bed.status = 'available'
            allocation.bed.save()
            discharged += 1
        
        self.message_user(request, f'{discharged} patients discharged successfully.')
    discharge_patients.short_description = 'Discharge selected patients'
    
    def extend_stay(self, request, queryset):
        """Extend stay for selected patients (add 3 days to expected discharge)"""
        from datetime import timedelta
        extended = 0
        for allocation in queryset.filter(is_active=True):
            if allocation.expected_discharge_date:
                allocation.expected_discharge_date += timedelta(days=3)
                allocation.save()
                extended += 1
        
        self.message_user(request, f'Extended stay by 3 days for {extended} patients.')
    extend_stay.short_description = 'Extend stay by 3 days'
