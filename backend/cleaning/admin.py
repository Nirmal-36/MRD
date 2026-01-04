from django.contrib import admin
from django.utils.html import format_html
from .models import CleaningRecord, CleaningStaff


@admin.register(CleaningStaff)
class CleaningStaffAdmin(admin.ModelAdmin):
    """Admin interface for managing cleaning staff"""
    list_display = [
        'name', 'contact_number', 'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'contact_number']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Staff Information', {
            'fields': ('name', 'contact_number', 'is_active')
        }),
        ('Additional Notes', {
            'fields': ('notes',)
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(CleaningRecord)
class CleaningRecordAdmin(admin.ModelAdmin):
    """Admin interface for managing cleaning records"""
    list_display = [
        'cleaning_date', 'cleaner_name', 'start_time', 'end_time',
        'duration_display', 'quality_stars', 'recorded_by_name'
    ]
    list_filter = [
        'cleaning_date', 'quality_rating', 'recorded_by__user_type'
    ]
    search_fields = [
        'cleaner_name', 'cleaner_contact', 'areas_cleaned',
        'recorded_by__first_name', 'recorded_by__last_name'
    ]
    date_hierarchy = 'cleaning_date'
    ordering = ['-cleaning_date', '-start_time']
    readonly_fields = [
        'recorded_by', 'recorded_at', 'updated_at', 
        'duration_minutes', 'duration_display'
    ]
    
    fieldsets = (
        ('Cleaning Information', {
            'fields': (
                'cleaning_date', 'start_time', 'end_time',
                'duration_display', 'cleaner_name', 'cleaner_contact'
            )
        }),
        ('Work Details', {
            'fields': ('areas_cleaned', 'supplies_used', 'notes')
        }),
        ('Quality Assessment', {
            'fields': ('quality_rating',)
        }),
        ('System Information', {
            'fields': ('recorded_by', 'recorded_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def save_model(self, request, obj, form, change):
        """Set the user who recorded this cleaning"""
        if not change:
            obj.recorded_by = request.user
        super().save_model(request, obj, form, change)
    
    def quality_stars(self, obj):
        """Display quality rating as stars"""
        if obj.quality_rating:
            stars = '⭐' * obj.quality_rating
            return format_html(f'<span title="{obj.quality_rating}/5">{stars}</span>')
        return '-'
    quality_stars.short_description = 'Quality'
    
    def recorded_by_name(self, obj):
        """Display recorded by user with their role"""
        if obj.recorded_by:
            return f"{obj.recorded_by.get_full_name()} ({obj.recorded_by.get_user_type_display()})"
        return '-'
    recorded_by_name.short_description = 'Recorded By'
    
    def duration_display(self, obj):
        """Display cleaning duration in a readable format"""
        return obj.duration_display
    duration_display.short_description = 'Duration'
