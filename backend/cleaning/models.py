from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date


class CleaningRecord(models.Model):
    """
    Simple cleaning record for medical room where doctors/nurses
    record cleaning staff details and cleaning time
    """
    
    # Cleaning Staff Information (external staff, not system users)
    cleaner_name = models.CharField(
        max_length=100,
        default="Unknown Cleaner",
        help_text="Name of the person who performed the cleaning"
    )
    cleaner_contact = models.CharField(max_length=15, blank=True, help_text="Contact number if available")
    
    # Cleaning Details
    cleaning_date = models.DateField(
        default=date.today,
        help_text="The date when the cleaning was performed"
    )
    start_time = models.TimeField(
        null=True, blank=True,
        help_text="Time when cleaning started"
    )
    end_time = models.TimeField(
        null=True, blank=True,
        help_text="Time when cleaning finished"
    )
    
    # Additional Information
    supplies_used = models.TextField(blank=True, help_text="Cleaning supplies used (detergent, disinfectant, etc.)")
    areas_cleaned = models.TextField(
        default="Medical room general cleaning",
        help_text="List the specific areas that were cleaned (beds, floors, bathrooms, etc.)"
    )
    notes = models.TextField(blank=True, help_text="Any additional notes or observations")
    
    # Quality Assessment (optional)
    quality_rating = models.IntegerField(
        blank=True, 
        null=True, 
        choices=[(i, f"{i} Star{'s' if i != 1 else ''}") for i in range(1, 6)],
        help_text="Quality rating from 1-5 stars (optional)"
    )
    
    # System Fields - Who recorded this cleaning
    # recorded_by = models.ForeignKey(
    #     settings.AUTH_USER_MODEL,
    #     on_delete=models.CASCADE,
    #     related_name='cleaning_records_made',
    #     limit_choices_to={'user_type__in': ['doctor', 'nurse']},
    #     help_text="Doctor or nurse who recorded this cleaning"
    # )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cleaning_records_made',
        limit_choices_to={'user_type__in': ['doctor', 'nurse']},
        db_constraint=False,
        help_text="Doctor or nurse who recorded this cleaning"
    )

    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def clean(self):
        """Validate cleaning times"""
        super().clean()

        # Enforce recorder logically (not DB-level)
        if not self.recorded_by:
            raise ValidationError({
                'recorded_by': 'Cleaning record must be recorded by a doctor or nurse.'
            })
        
        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                raise ValidationError({
                    'end_time': 'End time must be after start time.'
                })
    
    def save(self, *args, **kwargs):
        """Override save to ensure validation"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def duration_minutes(self):
        """Calculate cleaning duration in minutes"""
        if self.start_time and self.end_time:
            from datetime import datetime, timedelta
            start_dt = datetime.combine(self.cleaning_date, self.start_time)
            end_dt = datetime.combine(self.cleaning_date, self.end_time)
            duration = end_dt - start_dt
            return int(duration.total_seconds() / 60)
        return None
    
    @property
    def duration_display(self):
        """Human readable duration"""
        minutes = self.duration_minutes
        if minutes:
            hours = minutes // 60
            mins = minutes % 60
            if hours > 0:
                return f"{hours}h {mins}m"
            else:
                return f"{mins}m"
        return "-"
    
    def __str__(self):
        return f"Cleaning by {self.cleaner_name} on {self.cleaning_date}"
    
    class Meta:
        db_table = 'cleaning_records'
        ordering = ['-cleaning_date', '-start_time']
        verbose_name = 'Medical Room Cleaning Record'
        verbose_name_plural = 'Medical Room Cleaning Records'



class CleaningStaff(models.Model):
    """
    Model to keep track of regular cleaning staff for quick selection
    """
    name = models.CharField(max_length=100, unique=True)
    contact_number = models.CharField(max_length=15, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, help_text="Additional notes about this cleaning staff")
    
    # System Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'cleaning_staff'
        ordering = ['name']
        verbose_name = 'Cleaning Staff'
        verbose_name_plural = 'Cleaning Staff'
