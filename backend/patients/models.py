from django.db import models
from django.conf import settings
from django.db.models import Q
from django.core.exceptions import ValidationError


class Patient(models.Model):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )
    
    PATIENT_TYPE_CHOICES = (
        ('student', 'Student'),
        ('staff', 'Staff'),
    )
    
    # Link to registered user (this establishes the relationship)
    # user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_record', null=True, blank=True)
    user = models.OneToOneField(
    settings.AUTH_USER_MODEL,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='medical_record',
    db_constraint=False
    )

    
    # Basic Information - Employee ID/Student Roll No (combined field)
    employee_student_id = models.CharField(max_length=20, unique=True, verbose_name="Employee ID/Student Roll No")
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    patient_type = models.CharField(max_length=10, choices=PATIENT_TYPE_CHOICES)
    
    # Contact Information
    phone = models.CharField(max_length=15, blank=True)
    
    # Medical Information
    blood_group = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True)
    chronic_conditions = models.TextField(blank=True)
    
    # System Fields
    # created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_patients')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_patients',
        db_constraint=False
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if not self.created_by:
            raise ValidationError({'created_by': 'Patient record must be created by a user.'})
    
    def __str__(self):
        return f"{self.name} ({self.employee_student_id})"
    
    def save(self, *args, **kwargs):
        # Automatically link to existing user if not already linked
        if not self.user and self.employee_student_id:
            from users.models import User
            try:
                # Multiple strategies for finding the user
                existing_user = None
                
                # Strategy 1: Direct username match
                try:
                    existing_user = User.objects.get(username=self.employee_student_id)
                except User.DoesNotExist:
                    pass
                
                # Strategy 2: Match by employee_id or student_id
                if not existing_user:
                    existing_user = User.objects.filter(
                        Q(employee_id=self.employee_student_id) | 
                        Q(student_id=self.employee_student_id)
                    ).first()
                
                # Strategy 3: Match by full name if provided
                if not existing_user and self.name:
                    name_parts = self.name.split()
                    if len(name_parts) >= 2:
                        first_name, last_name = name_parts[0], ' '.join(name_parts[1:])
                        existing_user = User.objects.filter(
                            first_name__iexact=first_name,
                            last_name__iexact=last_name
                        ).first()
                
                if existing_user:
                    self.user = existing_user
                    # Update name from user if different
                    if existing_user.first_name and existing_user.last_name:
                        full_name = f"{existing_user.first_name} {existing_user.last_name}"
                        if self.name != full_name:
                            self.name = full_name
                    # Update phone from user if available
                    if existing_user.phone:
                        self.phone = existing_user.phone
                            
            except Exception as e:
                # Log the error but don't fail the save
                pass
        
        # If user is already linked, sync phone from user
        if self.user and self.user.phone:
            self.phone = self.user.phone
        
        super().save(*args, **kwargs)
    
    class Meta:
        db_table = 'patients'
        ordering = ['-created_at']
        # Note: MySQL doesn't support partial unique constraints with conditions
        # The uniqueness is enforced at the application level


class Treatment(models.Model):
    SEVERITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )
    
    # patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='treatments')
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='treatments',
        db_constraint=False
    )
    # doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='treatments_given')
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='treatments_given',
        db_constraint=False
    )
    
    # Visit Information
    visit_date = models.DateTimeField()
    symptoms = models.TextField()
    diagnosis = models.TextField()
    treatment_given = models.TextField()
    
    # Medication (kept for backward compatibility and free-text notes)
    medicines_prescribed = models.TextField(blank=True, help_text="Free text for medicine names")
    dosage_instructions = models.TextField(blank=True)
    
    # Additional Information
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='low')
    follow_up_date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True)
    
    # System Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if not self.doctor:
            raise ValidationError({'doctor': 'Treatment must be recorded by a doctor.'})
    
    def __str__(self):
        return f"{self.patient.name} - {self.visit_date.strftime('%Y-%m-%d')}"
    
    def save(self, *args, **kwargs):
        """Override save to handle medicine stock updates"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # If updating existing treatment, stock management is handled separately
        # to avoid duplicate deductions
    
    def delete(self, *args, **kwargs):
        """Override delete to ensure TreatmentMedicine delete() is called for stock restoration"""
        # Manually delete each TreatmentMedicine to trigger their custom delete() method
        # (CASCADE doesn't call custom delete methods)
        for prescribed_medicine in self.prescribed_medicines.all():
            prescribed_medicine.delete()
        
        # Now delete the treatment itself
        super().delete(*args, **kwargs)
        
    class Meta:
        db_table = 'treatments'
        ordering = ['-visit_date']


class TreatmentMedicine(models.Model):
    """
    Many-to-Many relationship between Treatment and Medicine
    with additional fields for quantity and dosage
    """
    # treatment = models.ForeignKey('Treatment', on_delete=models.CASCADE, related_name='prescribed_medicines')
    treatment = models.ForeignKey(
        Treatment,
        on_delete=models.CASCADE,
        related_name='prescribed_medicines',
        db_constraint=False
    )
    # medicine = models.ForeignKey('medicines.Medicine', on_delete=models.PROTECT, related_name='prescriptions')
    medicine = models.ForeignKey(
        'medicines.Medicine',
        on_delete=models.PROTECT,
        related_name='prescriptions',
        db_constraint=False
    )
    quantity = models.IntegerField(help_text="Quantity prescribed")
    dosage = models.CharField(max_length=200, help_text="e.g., '1 tablet twice daily'")
    duration_days = models.IntegerField(default=7, help_text="Treatment duration in days")
    
    # Stock tracking
    stock_deducted = models.BooleanField(default=False, help_text="Whether stock was reduced")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.treatment.patient.name} - {self.medicine.name} ({self.quantity})"
    
    def save(self, *args, **kwargs):
        """Reduce medicine stock when prescription is created"""
        is_new = self.pk is None
        
        if is_new and not self.stock_deducted:
            # Check if enough stock is available
            if self.medicine.current_stock < self.quantity:
                from django.core.exceptions import ValidationError
                raise ValidationError(
                    f"Insufficient stock for {self.medicine.name}. "
                    f"Available: {self.medicine.current_stock}, Requested: {self.quantity}"
                )
            
            # Reduce stock
            self.medicine.current_stock -= self.quantity
            # Use skip_stock_validation to bypass direct stock change validation
            self.medicine.save(skip_stock_validation=True)
            
            # Create transaction record
            from medicines.models import MedicineTransaction
            from django.utils import timezone
            
            MedicineTransaction.objects.create(
                medicine=self.medicine,
                transaction_type='issued',
                quantity=self.quantity,
                date=timezone.now(),
                patient_record=self.treatment.patient,
                performed_by=self.treatment.doctor,
                remarks=f"Prescribed for treatment: {self.treatment.diagnosis}"
            )
            
            self.stock_deducted = True
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """
        Restore medicine stock if treatment is deleted within 5 minutes.
        After 5 minutes, medicines are considered dispensed and stock is not restored.
        """
        if self.stock_deducted:
            from django.utils import timezone
            from datetime import timedelta
            
            # Calculate time since prescription was created
            time_elapsed = timezone.now() - self.created_at
            five_minutes = timedelta(minutes=5)
            
            # Only restore stock if deleted within 5 minutes
            if time_elapsed <= five_minutes:
                # Restore stock
                self.medicine.current_stock += self.quantity
                self.medicine.save(skip_stock_validation=True)
                
                # Create reversal transaction
                from medicines.models import MedicineTransaction
                
                MedicineTransaction.objects.create(
                    medicine=self.medicine,
                    transaction_type='adjustment',
                    quantity=self.quantity,
                    date=timezone.now(),
                    patient_record=self.treatment.patient if self.treatment else None,
                    performed_by=self.treatment.doctor if self.treatment else None,
                    remarks=f"Stock restored: Treatment deleted within 5 minutes (Time elapsed: {int(time_elapsed.total_seconds())} seconds)"
                )
            else:
                # Log that stock was NOT restored
                from medicines.models import MedicineTransaction
                
                MedicineTransaction.objects.create(
                    medicine=self.medicine,
                    transaction_type='issued',
                    quantity=0,  # No quantity change, just logging
                    date=timezone.now(),
                    patient_record=self.treatment.patient if self.treatment else None,
                    performed_by=self.treatment.doctor if self.treatment else None,
                    remarks=f"Treatment deleted after 5 min grace period - Stock NOT restored ({self.quantity} {self.medicine.unit} already dispensed)"
                )
        
        super().delete(*args, **kwargs)
    
    class Meta:
        db_table = 'treatment_medicines'
        unique_together = ('treatment', 'medicine')  # Prevent duplicate medicine in same treatment

