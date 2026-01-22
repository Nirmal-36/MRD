from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Medicine, MedicineTransaction, StockRequest
from django.db import transaction as db_transaction



class PatientMedicineSerializer(serializers.ModelSerializer):
    """Simplified medicine serializer for patients - hides stock and pricing info"""
    availability_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Medicine
        fields = [
            'id', 'name', 'generic_name', 'category', 'manufacturer', 'description',
            'unit', 'availability_status'
        ]
        read_only_fields = ['id', 'availability_status']
    
    def get_availability_status(self, obj):
        """Return simple availability status for patients"""
        if not obj.is_active:
            return 'Not Available'
        elif obj.current_stock > 0:
            return 'Available'
        else:
            return 'Out of Stock'


class MedicineSerializer(serializers.ModelSerializer):
    stock_status = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    days_to_expiry = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()
    recent_transactions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Medicine
        fields = [
            'id', 'name', 'generic_name', 'category', 'manufacturer', 'description',
            'current_stock', 'minimum_stock_level', 'unit', 'unit_price',
            'expiry_date', 'batch_number', 'is_active',
            'stock_status', 'is_low_stock', 'days_to_expiry', 'total_value',
            'recent_transactions_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'stock_status', 'is_low_stock',
            'days_to_expiry', 'total_value', 'recent_transactions_count'
        ]
    
    def get_days_to_expiry(self, obj):
        """Calculate days until expiry"""
        if not obj.expiry_date:
            return None
        today = timezone.now().date()
        if obj.expiry_date < today:
            return 0  # Already expired
        return (obj.expiry_date - today).days
    
    def get_total_value(self, obj):
        """Calculate total stock value"""
        return float(obj.current_stock * obj.unit_price)
    
    def get_recent_transactions_count(self, obj):
        """Count transactions in last 30 days"""
        thirty_days_ago = timezone.now() - timedelta(days=30)
        return obj.transactions.filter(created_at__gte=thirty_days_ago).count()
    
    def validate_current_stock(self, value):
        """Validate stock is not negative"""
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value
    
    def validate_minimum_stock_level(self, value):
        """Validate minimum stock level is positive"""
        if value <= 0:
            raise serializers.ValidationError("Minimum stock level must be greater than 0.")
        return value
    
    def validate_unit_price(self, value):
        """Validate price is not negative"""
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value
    
    def validate_expiry_date(self, value):
        """Warn if expiry date is in the past"""
        if value and value < timezone.now().date():
            # Allow past dates but add a warning in the response
            pass  # We'll handle this in the view if needed
        return value


class MedicineCreateUpdateSerializer(serializers.ModelSerializer):
    """Separate serializer for create/update with different field requirements"""
    
    class Meta:
        model = Medicine
        fields = [
            'name', 'generic_name', 'category', 'manufacturer', 'description',
            'current_stock', 'minimum_stock_level', 'unit', 'unit_price',
            'expiry_date', 'batch_number', 'is_active'
        ]
        extra_kwargs = {
            'expiry_date': {'required': True, 'allow_null': False}
        }

    def validate(self, data):
        """Cross-field validation and expiry enforcement"""
        current_stock = data.get('current_stock', 0)
        minimum_stock = data.get('minimum_stock_level', 1)
        expiry_date = data.get('expiry_date', None)
        if expiry_date is None:
            raise serializers.ValidationError({
                'expiry_date': 'Expiry date is required and cannot be blank.'
            })
        # Warn if initial stock is below minimum (but allow it)
        if current_stock < minimum_stock:
            pass
        return data


class MedicineTransactionSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    medicine_category = serializers.CharField(source='medicine.category', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    performed_by_display_id = serializers.CharField(source='performed_by.get_display_id', read_only=True)
    stock_after_transaction = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicineTransaction
        fields = [
            'id', 'medicine', 'medicine_name', 'medicine_category',
            'transaction_type', 'quantity', 'date', 'reference_number',
            'supplier', 'patient_record', 'patient', 'performed_by', 'performed_by_name',
            'performed_by_display_id', 'remarks', 'stock_after_transaction', 'created_at'
        ]
        read_only_fields = ['performed_by', 'created_at', 'stock_after_transaction', 'patient']
    
    def get_stock_after_transaction(self, obj):
        """Calculate what stock would be after this transaction"""
        return obj.medicine.current_stock
    
    def validate_quantity(self, value):
        """Validate quantity is positive"""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value
    
    def validate(self, data):
        """Cross-field validation based on transaction type"""
        transaction_type = data.get('transaction_type')
        supplier = data.get('supplier', '')
        patient = data.get('patient', '')
        medicine = data.get('medicine')
        quantity = data.get('quantity', 0)
        
        # Validate required fields based on transaction type
        if transaction_type == 'received' and not supplier:
            raise serializers.ValidationError({
                'supplier': 'Supplier is required for received transactions.'
            })
        
        if transaction_type == 'issued' and not patient:
            raise serializers.ValidationError({
                'patient': 'Patient information is required for issued transactions.'
            })
        
        # Check if there's enough stock for issued/expired/adjustment transactions
        if transaction_type in ['issued', 'expired', 'adjustment'] and medicine:
            if quantity > medicine.current_stock:
                raise serializers.ValidationError({
                    'quantity': f'Insufficient stock. Available: {medicine.current_stock}, Requested: {quantity}'
                })
        
        return data
    
    def create(self, validated_data):

        with db_transaction.atomic():
            validated_data['performed_by'] = self.context['request'].user
            transaction_obj = super().create(validated_data)

            medicine = transaction_obj.medicine

            if transaction_obj.transaction_type == 'received':
                medicine.current_stock += transaction_obj.quantity
            elif transaction_obj.transaction_type in ['issued', 'expired', 'adjustment']:
                medicine.current_stock = max(0, medicine.current_stock - transaction_obj.quantity)

            medicine.save(skip_stock_validation=True)

            return transaction_obj


class StockRequestSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    medicine_category = serializers.CharField(source='medicine.category', read_only=True)

    # 🔧 ALWAYS RETURN THESE (frontend expects them)
    current_stock = serializers.IntegerField(source='medicine.current_stock', read_only=True)

    requested_by_name = serializers.SerializerMethodField()
    requested_by_display_id = serializers.SerializerMethodField()

    approved_by_name = serializers.SerializerMethodField()
    approved_by_display_id = serializers.SerializerMethodField()

    days_pending = serializers.SerializerMethodField()
    estimated_cost = serializers.SerializerMethodField()


    
    class Meta:
        model = StockRequest
        fields = [
            'id',
            'medicine',
            'medicine_name',
            'medicine_category',
            'requested_quantity',
            'current_stock',
            'priority',
            'reason',
            'estimated_usage_days',
            'status',
            'requested_by',
            'requested_by_name',
            'requested_by_display_id',
            'approved_by',
            'approved_by_name',
            'approved_by_display_id',
            'requested_date',
            'approved_date',
            'expected_delivery_date',
            'notes',
            'days_pending',
            'estimated_cost',
        ]
        read_only_fields = [
            'requested_by',
            'requested_date',
            'approved_by',
            'approved_date',
            'current_stock',
            'days_pending',
            'estimated_cost',
        ]

    def get_requested_by_name(self, obj):
        return obj.requested_by.get_full_name() if obj.requested_by else None

    def get_requested_by_display_id(self, obj):
        return obj.requested_by.get_display_id() if obj.requested_by else None

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None

    def get_approved_by_display_id(self, obj):
        return obj.approved_by.get_display_id() if obj.approved_by else None

    def get_days_pending(self, obj):
        if obj.status != 'pending':
            return None
        return (timezone.now().date() - obj.requested_date.date()).days

    def get_estimated_cost(self, obj):
        return float(obj.requested_quantity * obj.medicine.unit_price)
    
    def validate_estimated_usage_days(self, value):
        """Validate estimated usage days if provided"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Estimated usage days must be greater than 0.")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        medicine = data.get('medicine')
        requested_quantity = data.get('requested_quantity', 0)
        priority = data.get('priority', 'medium')

        # Auto-set priority based on stock level if not explicitly set
        if medicine and 'priority' not in self.initial_data:
            if medicine.current_stock == 0:
                data = {**data, 'priority': 'urgent'}
            elif medicine.is_low_stock:
                data = {**data, 'priority': 'high'}


        # Suggest reasonable quantities based on minimum stock level
        if medicine and requested_quantity > (medicine.minimum_stock_level * 10):
            # Allow but could add a warning in the view
            pass

        return data
    
    def create(self, validated_data):
        validated_data['requested_by'] = self.context['request'].user
        validated_data['current_stock'] = validated_data['medicine'].current_stock
        return super().create(validated_data)


class StockRequestApprovalSerializer(serializers.ModelSerializer):
    """Separate serializer for approval/rejection actions"""
    action_reason = serializers.CharField(write_only=True, required=False)
    expiry_date = serializers.DateField(write_only=True, required=False, help_text="Required when approving stock requests")
    batch_number = serializers.CharField(write_only=True, required=False, help_text="Optional batch number for the new stock")
    
    class Meta:
        model = StockRequest
        fields = ['id', 'status', 'expected_delivery_date', 'notes', 'action_reason', 'expiry_date', 'batch_number']
        read_only_fields = ['id']
    
    def validate_status(self, value):
        """Validate status transitions"""
        if self.instance:
            current_status = self.instance.status
            valid_transitions = {
                'pending': ['approved', 'rejected'],
                'approved': ['ordered', 'rejected'],
                'ordered': ['received'],
                'received': [],  # Final state
                'rejected': []   # Final state
            }
            
            if value not in valid_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Cannot change status from {current_status} to {value}"
                )
        
        return value
    
    def validate(self, data):
        """Validate expiry_date is provided when approving"""
        status = data.get('status')
        expiry_date = data.get('expiry_date')
        
        # Require expiry_date when approving stock request
        if status == 'approved' and not expiry_date:
            raise serializers.ValidationError({
                'expiry_date': 'Expiry date is required when approving stock requests'
            })
        
        # Validate expiry_date is not in the past
        if expiry_date and expiry_date < timezone.now().date():
            raise serializers.ValidationError({
                'expiry_date': 'Expiry date cannot be in the past'
            })
        
        return data