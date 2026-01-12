from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django import forms
from .models import User, ProfileChangeRequest


class UserAdminForm(forms.ModelForm):
    # Remove queryset assignment from __init__

    class Meta:
        model = User
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        user_type = cleaned_data.get('user_type')
        employee_id = cleaned_data.get('employee_id')
        student_id = cleaned_data.get('student_id')
        approved_by = cleaned_data.get('approved_by')

        # Apply the same validation logic as in the model
        if user_type == 'student':
            if not student_id:
                self.add_error('student_id', 'Student ID is required for students.')
            if employee_id:
                self.add_error('employee_id', 'Students should not have an employee ID.')
        elif user_type in ['doctor', 'nurse', 'staff', 'admin']:
            if not employee_id:
                user_type_display = dict(User.USER_TYPES).get(user_type, user_type) or user_type
                self.add_error('employee_id', f'Employee ID is required for {user_type_display.lower()}s.')
            if student_id:
                user_type_display = dict(User.USER_TYPES).get(user_type, user_type) or user_type
                self.add_error('student_id', f'{user_type_display}s should not have a student ID.')

        # Only admin users can approve
        if approved_by and approved_by.user_type != 'admin':
            self.add_error('approved_by', 'Only admin users can approve staff registrations.')

        return cleaned_data


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserAdminForm
    
    fieldsets = (*BaseUserAdmin.fieldsets,
        ('MRD System Info', {
            'fields': ('user_type', 'phone', 'employee_id', 'student_id', 'department', 'is_available', 'is_approved', 'approved_by', 'approved_at'),
            'description': 'Students require Student ID only. Doctors, Nurses, Staff, and Admins require Employee ID only.'
        }),
    )

    add_fieldsets = (*BaseUserAdmin.add_fieldsets,
        ('MRD System Info', {
            'fields': ('user_type', 'phone', 'employee_id', 'student_id', 'department', 'is_available', 'is_approved', 'approved_by', 'approved_at'),
            'description': 'Students require Student ID only. Doctors, Nurses, Staff, and Admins require Employee ID only.'
        }),
    )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'approved_by':
            kwargs["queryset"] = User.objects.filter(user_type='admin')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    list_display = ('username', 'get_display_id', 'email', 'first_name', 'last_name', 'user_type', 'is_available', 'is_approved', 'is_staff')
    list_filter = ('user_type', 'is_available', 'is_approved', 'is_staff', 'is_active', 'department')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'employee_id', 'student_id')
    
    def get_display_id(self, obj):
        """Show the appropriate ID in list view"""
        return obj.get_display_id() or '-'
    get_display_id.short_description = 'ID'
    get_display_id.admin_order_field = 'employee_id'


@admin.register(ProfileChangeRequest)
class ProfileChangeRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'requested_first_name', 'requested_last_name', 'requested_username', 'status', 'created_at', 'reviewed_by', 'reviewed_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'user__email', 'reason')
    readonly_fields = ('user', 'current_first_name', 'current_last_name', 'current_username', 'created_at', 'updated_at', 'reviewed_at', 'reviewed_by')
    
    def save_model(self, request, obj, form, change):
        """Automatically call approve/reject methods when status changes"""
        if change:  # Only for existing objects
            old_status = ProfileChangeRequest.objects.get(pk=obj.pk).status
            new_status = obj.status
            
            # If status changed to approved, call approve method
            if old_status == 'pending' and new_status == 'approved':
                obj.approve(request.user, obj.admin_notes or '')
                return  # approve() already saves
            
            # If status changed to rejected, call reject method
            elif old_status == 'pending' and new_status == 'rejected':
                obj.reject(request.user, obj.admin_notes or 'Rejected by admin')
                return  # reject() already saves
        
        super().save_model(request, obj, form, change)
