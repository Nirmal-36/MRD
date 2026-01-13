from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Medicine, MedicineTransaction, StockRequest


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'current_stock', 'minimum_stock_level', 
        'stock_status_colored', 'unit_price', 'expiry_date', 'is_active'
    ]
    list_filter = [
        'category', 'manufacturer', 'is_active', 'expiry_date'
    ]
    search_fields = ['name', 'generic_name', 'manufacturer', 'description']
    ordering = ['name']
    # Make current_stock readonly - stock changes must go through MedicineTransaction
    readonly_fields = ['current_stock', 'created_at', 'updated_at', 'stock_status', 'is_low_stock']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'generic_name', 'category', 'manufacturer', 'description')
        }),
        ('Stock Management', {
            'fields': ('current_stock', 'minimum_stock_level', 'unit', 'unit_price'),
            'description': '⚠️ Current stock is READ-ONLY. To change stock, create a Medicine Transaction (Received/Issued/Adjustment) below.'
        }),
        ('Batch Information', {
            'fields': ('batch_number', 'expiry_date'),
            'classes': ('collapse',)
        }),
        ('Status & Timestamps', {
            'fields': ('is_active', 'stock_status', 'is_low_stock', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def stock_status_colored(self, obj):
        """Display stock status with colors"""
        status = obj.stock_status
        colors = {
            'out_of_stock': 'red',
            'low_stock': 'orange',
            'adequate': 'green'
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(status, 'black'),
            status.replace('_', ' ').title()
        )
    stock_status_colored.short_description = 'Stock Status'
    stock_status_colored.admin_order_field = 'current_stock'
    
    actions = ['mark_as_low_stock_alert', 'deactivate_medicines']
    
    def mark_as_low_stock_alert(self, request, queryset):
        """Create stock requests for selected medicines with low stock"""
        count = 0
        for medicine in queryset:
            if medicine.is_low_stock:
                StockRequest.objects.get_or_create(
                    medicine=medicine,
                    status='pending',
                    defaults={
                        'requested_quantity': medicine.minimum_stock_level * 2,
                        'current_stock': medicine.current_stock,
                        'reason': f'Auto-generated: Low stock alert for {medicine.name}',
                        'priority': 'high',
                        'requested_by': request.user
                    }
                )
                count += 1
        self.message_user(request, f'{count} stock requests created for low stock medicines.')
    mark_as_low_stock_alert.short_description = 'Create stock requests for low stock items'
    
    def deactivate_medicines(self, request, queryset):
        """Deactivate selected medicines"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} medicines deactivated.')
    deactivate_medicines.short_description = 'Deactivate selected medicines'


@admin.register(MedicineTransaction)
class MedicineTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'medicine', 'transaction_type', 'quantity', 'date', 
        'performed_by', 'supplier', 'patient_display'
    ]
    list_filter = [
        'transaction_type', 'date', 'performed_by', 'medicine__category'
    ]
    search_fields = [
        'medicine__name', 'supplier', 'patient', 'patient_record__name', 
        'patient_record__employee_student_id', 'reference_number', 'remarks'
    ]
    ordering = ['-date']
    readonly_fields = ['created_at', 'patient_display']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Transaction Details', {
            'fields': ('medicine', 'transaction_type', 'quantity', 'date')
        }),
        ('Reference Information', {
            'fields': ('reference_number', 'supplier', 'patient_record', 'patient_display'),
            'description': 'Supplier for received items, Patient for issued items'
        }),
        ('System Information', {
            'fields': ('performed_by', 'remarks', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def patient_display(self, obj):
        """Display patient name from patient_record or fallback to patient field"""
        if obj.patient_record:
            return f"{obj.patient_record.name} ({obj.patient_record.employee_student_id})"
        return obj.patient or 'N/A'
    patient_display.short_description = 'Patient'
    
    def get_readonly_fields(self, request, obj=None):
        """Make performed_by readonly when editing"""
        readonly = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly.extend(['medicine', 'transaction_type', 'quantity', 'date'])
        return readonly
    
    def save_model(self, request, obj, form, change):
        """Auto-set performed_by for new transactions and adjust medicine stock"""
        if not change:  # Creating new object
            obj.performed_by = request.user
        super().save_model(request, obj, form, change)

        # Adjust medicine stock after saving transaction
        medicine = obj.medicine
        if obj.transaction_type == 'received':
            medicine.current_stock += obj.quantity
        elif obj.transaction_type == 'issued':
            medicine.current_stock = max(0, medicine.current_stock - obj.quantity)
        elif obj.transaction_type in ['expired', 'adjustment']:
            medicine.current_stock = max(0, medicine.current_stock - obj.quantity)
        medicine.save(skip_stock_validation=True)


@admin.register(StockRequest)
class StockRequestAdmin(admin.ModelAdmin):
    list_display = [
        'medicine', 'requested_quantity', 'priority', 'status', 
        'requested_by', 'requested_date', 'approved_by'
    ]
    list_filter = [
        'status', 'priority', 'requested_date', 'approved_date', 'medicine__category'
    ]
    search_fields = [
        'medicine__name', 'reason', 'notes', 'requested_by__username'
    ]
    ordering = ['-requested_date']
    readonly_fields = [
        'requested_by', 'requested_date', 'approved_by', 'approved_date', 'current_stock'
    ]
    date_hierarchy = 'requested_date'
    
    fieldsets = (
        ('Request Details', {
            'fields': ('medicine', 'requested_quantity', 'current_stock', 'priority')
        }),
        ('Justification', {
            'fields': ('reason', 'estimated_usage_days')
        }),
        ('Status Management', {
            'fields': ('status', 'expected_delivery_date', 'notes'),
            'description': 'Update status and delivery expectations'
        }),
        ('System Information', {
            'fields': ('requested_by', 'requested_date', 'approved_by', 'approved_date'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Dynamic readonly fields based on user permissions and status"""
        readonly = list(self.readonly_fields)
        
        if obj and obj.status in ['approved', 'rejected', 'received']:
            # Can't edit approved/rejected/received requests
            readonly.extend(['requested_quantity', 'priority', 'reason'])
        
        return readonly
    
    def save_model(self, request, obj, form, change):
        """Auto-set request details and handle status changes"""
        if not change:  # Creating new object
            obj.requested_by = request.user
            obj.current_stock = obj.medicine.current_stock
        else:  # Updating existing object
            # Handle status changes
            if 'status' in form.changed_data:
                if obj.status in ['approved', 'rejected'] and not obj.approved_by:
                    obj.approved_by = request.user
                    obj.approved_date = timezone.now()
        
        super().save_model(request, obj, form, change)
    
    actions = ['approve_requests', 'mark_as_ordered']
    
    def approve_requests(self, request, queryset):
        """Approve selected pending requests"""
        pending_requests = queryset.filter(status='pending')
        updated = pending_requests.update(
            status='approved',
            approved_by=request.user,
            approved_date=timezone.now()
        )
        self.message_user(request, f'{updated} stock requests approved.')
    approve_requests.short_description = 'Approve selected pending requests'
    
    def mark_as_ordered(self, request, queryset):
        """Mark approved requests as ordered"""
        approved_requests = queryset.filter(status='approved')
        updated = approved_requests.update(status='ordered')
        self.message_user(request, f'{updated} stock requests marked as ordered.')
    mark_as_ordered.short_description = 'Mark approved requests as ordered'
