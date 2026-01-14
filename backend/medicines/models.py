from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal


class Medicine(models.Model):
    CATEGORY_CHOICES = (
        ('tablet', 'Tablet'),
        ('capsule', 'Capsule'),
        ('syrup', 'Syrup'),
        ('injection', 'Injection'),
        ('ointment', 'Ointment'),
        ('drops', 'Drops'),
        ('other', 'Other'),
    )
    
    name = models.CharField(max_length=200)
    generic_name = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    manufacturer = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    
    # Stock Information
    current_stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    minimum_stock_level = models.IntegerField(default=10, validators=[MinValueValidator(1)])
    unit = models.CharField(max_length=20, default='pieces')  # pieces, bottles, boxes, etc.
    
    # Pricing
    from decimal import Decimal
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Expiry Management
    expiry_date = models.DateField(blank=True, null=True)
    batch_number = models.CharField(max_length=50, blank=True)
    
    # System Fields
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        """
        Override save to prevent direct stock manipulation.
        Stock changes should only happen through MedicineTransaction.
        """
        if self.pk:  # Existing medicine (update)
            try:
                old_medicine = Medicine.objects.get(pk=self.pk)
                old_stock = old_medicine.current_stock
                new_stock = self.current_stock
                
                # Allow stock changes only through specific internal calls
                # Check if this save was triggered by transaction or prescription
                skip_validation = kwargs.pop('skip_stock_validation', False)
                
                if not skip_validation and new_stock != old_stock:
                    from django.core.exceptions import ValidationError
                    raise ValidationError(
                        "Cannot modify stock directly. Please create a Medicine Transaction "
                        "(Received/Issued/Expired/Adjustment) to change stock levels."
                    )
            except Medicine.DoesNotExist:
                pass  # This shouldn't happen, but handle gracefully
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.unit})"
    
    @property
    def is_low_stock(self):
        return self.current_stock <= self.minimum_stock_level
    
    @property
    def stock_status(self):
        if self.current_stock == 0:
            return 'out_of_stock'
        elif self.is_low_stock:
            return 'low_stock'
        else:
            return 'adequate'
    
    class Meta:
        db_table = 'medicines'
        ordering = ['name']


class MedicineTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('received', 'Received'),
        ('issued', 'Issued'),
        ('expired', 'Expired/Discarded'),
        ('adjustment', 'Stock Adjustment'),
    )
    
    # medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='transactions')
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name='transactions',
        db_constraint=False
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    
    # Transaction Details
    date = models.DateTimeField()
    reference_number = models.CharField(max_length=50, blank=True)  # Invoice/Bill number
    supplier = models.CharField(max_length=200, blank=True)  # For received items
    
    # Patient Reference - Improved with ForeignKey for data integrity
    patient_record = models.ForeignKey(
        'patients.Patient',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='medicine_transactions',
        help_text='Linked patient for issued medicines',
        db_constraint=False
    )
    patient = models.CharField(
        max_length=200, 
        blank=True,
        help_text='Patient name for display (auto-populated from patient_record or manual for old records)'
    )
    
    # System Fields
    # performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_constraint=False
    )
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if not self.performed_by:
            raise ValidationError({'performed_by': 'Transaction must be performed by a user.'})
    
    def save(self, *args, **kwargs):
        # Auto-populate patient name from patient_record if available
        if self.patient_record and not self.patient:
            self.patient = self.patient_record.name
        super().save(*args, **kwargs)
    
    def __str__(self):
        # Use transaction_type directly for display
        return f"{self.medicine.name} - {self.transaction_type} ({self.quantity})"
    
    class Meta:
        db_table = 'medicine_transactions'
        ordering = ['-date']


class StockRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('ordered', 'Ordered'),
        ('received', 'Received'),
        ('rejected', 'Rejected'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    # medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='stock_requests')
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name='stock_requests',
        db_constraint=False
    )
    requested_quantity = models.IntegerField(validators=[MinValueValidator(1)])
    current_stock = models.IntegerField()  # Stock at time of request
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Request Details
    reason = models.TextField()
    estimated_usage_days = models.IntegerField(blank=True, null=True)
    
    # Status Management
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    # requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stock_requests_made')
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_requests_made',
        db_constraint=False
    )
    # approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_requests_approved')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_requests_approved',
        db_constraint=False
    )
    
    # Timestamps
    requested_date = models.DateTimeField(auto_now_add=True)
    approved_date = models.DateTimeField(blank=True, null=True)
    expected_delivery_date = models.DateField(blank=True, null=True)
    
    # System Fields
    notes = models.TextField(blank=True)

    def clean(self):
        if not self.requested_by:
            raise ValidationError({'requested_by': 'Stock request must be created by a user.'})
        
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.medicine.name} - {self.requested_quantity} units ({self.status})"
    
    class Meta:
        db_table = 'stock_requests'
        ordering = ['-requested_date']
