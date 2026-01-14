from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


class Bed(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('occupied', 'Occupied'),
    )

    bed_number = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True, help_text="Additional notes about this bed")
    
    # Status Information
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    
    # Equipment/Features
    has_oxygen = models.BooleanField(default=False)
    has_monitor = models.BooleanField(default=False)
    has_ventilator = models.BooleanField(default=False)
    
    # System Fields
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()

        if not self.bed_number.strip():
            raise ValidationError({'bed_number': 'Bed number cannot be empty.'})
        
        # Ensure bed number is alphanumeric
        if not self.bed_number.replace('-', '').replace('_', '').isalnum():
            raise ValidationError({
                'bed_number': 'Bed number should contain only letters, numbers, hyphens, and underscores.'
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Bed {self.bed_number} ({self.get_status_display()})"

    @property
    def is_available(self):
        return self.status == 'available' and self.is_active

    @property
    def current_patient(self):
        active_allocation = self.allocations.filter(is_active=True).first()
        return active_allocation.patient_name if active_allocation else None

    @property
    def equipment_list(self):
        equipment = []
        if self.has_oxygen:
            equipment.append('Oxygen')
        if self.has_monitor:
            equipment.append('Monitor')
        if self.has_ventilator:
            equipment.append('Ventilator')
        return equipment

    class Meta:
        db_table = 'beds'
        ordering = ['bed_number']


class BedAllocation(models.Model):
    bed = models.ForeignKey(
        Bed, on_delete=models.CASCADE, related_name='allocations', db_constraint=False)
    
    # Patient Information - Add ForeignKey for data consistency
    patient_record = models.ForeignKey(
        'patients.Patient',
        on_delete=models.CASCADE,
        related_name='bed_allocations',
        null=True,
        blank=True,
        help_text="Linked patient record for data consistency",
        db_constraint=False
    )
    
    # String fields kept for backward compatibility and display
    patient_name = models.CharField(max_length=100)
    patient_id = models.CharField(max_length=20, help_text="Employee/Student ID")
    
    # Allocation Details
    admission_date = models.DateTimeField()
    expected_discharge_date = models.DateField(blank=True, null=True)
    actual_discharge_date = models.DateTimeField(blank=True, null=True)
    
    # Medical Information
    condition = models.TextField()
    special_requirements = models.TextField(blank=True)
    attending_doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bed_allocations',
        limit_choices_to={'user_type': 'doctor'},
        db_constraint=False
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    discharge_notes = models.TextField(blank=True)
    
    # System Fields
    # allocated_by = models.ForeignKey(
    #     settings.AUTH_USER_MODEL, 
    #     on_delete=models.CASCADE, 
    #     related_name='bed_allocations_made'
    # )
    allocated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bed_allocations_made',
        db_constraint=False
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()

        # Enforce allocator logically (not DB-level)
        if not self.allocated_by:
            raise ValidationError({
                'allocated_by': 'Allocation must be performed by a user.'
            })
        
         # Check if this bed already has an active allocation
        if self.is_active:
            existing_active = BedAllocation.objects.filter(
                bed=self.bed,
                is_active=True
            )
            
            # Exclude self if updating existing allocation
            if self.pk:
                existing_active = existing_active.exclude(pk=self.pk)

            if existing_active.exists():
                existing = existing_active.first()
                raise ValidationError({
                    'bed': f'Bed {self.bed.bed_number} is already occupied by {existing.patient_name}. '
                           f'Please discharge the current patient before allocating this bed.'
                })

    def save(self, *args, **kwargs):
        # Track if is_active changed
        is_new = self.pk is None
        old_is_active = None

        if not is_new:
            try:
                old_is_active = BedAllocation.objects.get(pk=self.pk).is_active
            except BedAllocation.DoesNotExist:
                pass
        
        # Auto-populate patient info from patient_record if available
        if self.patient_record:
            if not self.patient_name:
                self.patient_name = self.patient_record.name
            if not self.patient_id:
                self.patient_id = self.patient_record.employee_student_id
        
        # Validate before saving
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Update bed status based on is_active status
        if is_new and self.is_active:
            # New active allocation - mark bed as occupied
            self.bed.status = 'occupied'
            self.bed.save(update_fields=['status'])

        elif not is_new and old_is_active != self.is_active:
            # is_active changed
            if not self.is_active:
                # Discharged - check if bed has any other active allocations
                other_active = BedAllocation.objects.filter(
                    bed=self.bed,
                    is_active=True
                ).exclude(pk=self.pk).exists()

                if not other_active:
                    # No other active allocations - make bed available
                    self.bed.status = 'available'
                    self.bed.save(update_fields=['status'])
            else:
                # Reactivated - mark bed as occupied
                self.bed.status = 'occupied'
                self.bed.save(update_fields=['status'])

    def __str__(self):
        return f"{self.patient_name} - Bed {self.bed.bed_number}"

    @property
    def duration_days(self):
        end_date = self.actual_discharge_date.date() if self.actual_discharge_date else timezone.now().date()
        return (end_date - self.admission_date.date()).days

    class Meta:
        db_table = 'bed_allocations'
        ordering = ['-admission_date']
