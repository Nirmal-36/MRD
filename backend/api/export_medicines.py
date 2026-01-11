"""
Medicine inventory export views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from datetime import datetime, timedelta
from medicines.models import Medicine, MedicineTransaction, StockRequest
from .export_utils import export_queryset_to_excel


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_medicine_inventory(request):
    """Export complete medicine inventory - Pharmacist/Admin/Principal/Doctor"""
    user = request.user
    
    if user.user_type not in ['pharmacist', 'admin', 'principal', 'doctor']:
        return Response({'error': 'Access denied. Only medical staff can export inventory.'}, status=403)
    
    medicines = Medicine.objects.filter(is_active=True).order_by('name')
    
    columns = [
        ('name', 'Medicine Name'),
        ('generic_name', 'Generic Name'),
        ('category', 'Category', lambda obj: obj.get_category_display()),
        ('manufacturer', 'Manufacturer'),
        ('current_stock', 'Current Stock'),
        ('unit', 'Unit'),
        ('minimum_stock_level', 'Min Stock Level'),
        ('stock_status', 'Stock Status', lambda obj: obj.stock_status.replace('_', ' ').title()),
        ('unit_price', 'Unit Price (₹)'),
        ('unit_price', 'Total Value (₹)', lambda obj: obj.current_stock * float(obj.unit_price)),
        ('expiry_date', 'Expiry Date'),
        ('batch_number', 'Batch Number'),
    ]
    
    filename = f"medicine_inventory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Medicine Inventory Report"
    
    return export_queryset_to_excel(
        queryset=medicines,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_low_stock_medicines(request):
    """Export low stock medicines - Pharmacist/Admin/Principal"""
    user = request.user
    
    if user.user_type not in ['pharmacist', 'admin', 'principal', 'doctor']:
        return Response({'error': 'Access denied'}, status=403)
    
    # Get medicines where stock is at or below minimum level
    medicines = Medicine.objects.filter(
        is_active=True,
        current_stock__lte=models.F('minimum_stock_level')
    ).order_by('current_stock')
    
    columns = [
        ('name', 'Medicine Name'),
        ('generic_name', 'Generic Name'),
        ('category', 'Category', lambda obj: obj.get_category_display()),
        ('current_stock', 'Current Stock'),
        ('minimum_stock_level', 'Min Stock Level'),
        ('unit', 'Unit'),
        ('stock_status', 'Status', lambda obj: obj.stock_status.replace('_', ' ').title()),
        ('unit_price', 'Unit Price (₹)'),
        ('minimum_stock_level', 'Reorder Qty', lambda obj: obj.minimum_stock_level * 2 - obj.current_stock),
        ('minimum_stock_level', 'Estimated Cost (₹)', lambda obj: (obj.minimum_stock_level * 2 - obj.current_stock) * float(obj.unit_price)),
    ]
    
    filename = f"low_stock_medicines_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Low Stock Alert Report"
    
    return export_queryset_to_excel(
        queryset=medicines,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_expiring_medicines(request):
    """Export medicines expiring soon - Pharmacist/Admin/Principal"""
    user = request.user
    
    if user.user_type not in ['pharmacist', 'admin', 'principal', 'doctor']:
        return Response({'error': 'Access denied'}, status=403)
    
    # Get days parameter (default 90 days)
    days = int(request.query_params.get('days', 90))
    expiry_threshold = timezone.now().date() + timedelta(days=days)
    
    medicines = Medicine.objects.filter(
        is_active=True,
        expiry_date__lte=expiry_threshold,
        expiry_date__gte=timezone.now().date()
    ).order_by('expiry_date')
    
    columns = [
        ('expiry_date', 'Expiry Date'),
        ('expiry_date', 'Days Until Expiry', lambda obj: (obj.expiry_date - timezone.now().date()).days if obj.expiry_date else 'N/A'),
        ('name', 'Medicine Name'),
        ('generic_name', 'Generic Name'),
        ('category', 'Category', lambda obj: obj.get_category_display()),
        ('batch_number', 'Batch Number'),
        ('current_stock', 'Current Stock'),
        ('unit', 'Unit'),
        ('unit_price', 'Unit Price (₹)'),
        ('unit_price', 'Total Value at Risk (₹)', lambda obj: obj.current_stock * float(obj.unit_price)),
    ]
    
    filename = f"expiring_medicines_{days}days_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = f"Medicines Expiring Within {days} Days"
    
    return export_queryset_to_excel(
        queryset=medicines,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_medicine_transactions(request):
    """Export medicine transaction history - Pharmacist/Admin/Principal"""
    user = request.user
    
    if user.user_type not in ['pharmacist', 'admin', 'principal', 'doctor']:
        return Response({'error': 'Access denied'}, status=403)
    
    # Date range filtering
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    transaction_type = request.query_params.get('type')
    
    transactions = MedicineTransaction.objects.select_related('medicine', 'performed_by').all()
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
        transactions = transactions.filter(created_at__gte=start_date)
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
        end_date = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
        transactions = transactions.filter(created_at__lte=end_date)
    if transaction_type:
        transactions = transactions.filter(transaction_type=transaction_type)
    
    transactions = transactions.order_by('-created_at')
    
    columns = [
        ('created_at', 'Transaction Date', lambda obj: obj.created_at.strftime('%Y-%m-%d %H:%M')),
        ('medicine', 'Medicine Name', lambda obj: obj.medicine.name),
        ('transaction_type', 'Type', lambda obj: obj.get_transaction_type_display()),
        ('quantity', 'Quantity'),
        ('medicine', 'Unit', lambda obj: obj.medicine.unit),
        ('remarks', 'Reason/Notes'),
        ('performed_by', 'Performed By', lambda obj: obj.performed_by.get_full_name() if obj.performed_by else 'System'),
    ]
    
    filename = f"medicine_transactions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Medicine Transaction History"
    
    return export_queryset_to_excel(
        queryset=transactions,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_stock_requests(request):
    """Export stock requests - Pharmacist/Admin/Principal"""
    user = request.user
    
    if user.user_type not in ['pharmacist', 'admin', 'principal', 'doctor']:
        return Response({'error': 'Access denied'}, status=403)
    
    # Status filtering
    status = request.query_params.get('status')  # pending, approved, rejected
    
    requests_qs = StockRequest.objects.select_related('medicine', 'requested_by', 'approved_by').all()
    
    if status:
        requests_qs = requests_qs.filter(status=status)
    
    requests_qs = requests_qs.order_by('-created_at')
    
    columns = [
        ('created_at', 'Request Date', lambda obj: obj.created_at.strftime('%Y-%m-%d')),
        ('medicine', 'Medicine Name', lambda obj: obj.medicine.name),
        ('quantity', 'Requested Quantity'),
        ('medicine', 'Unit', lambda obj: obj.medicine.unit),
        ('medicine', 'Estimated Cost (₹)', lambda obj: obj.quantity * float(obj.medicine.unit_price)),
        ('reason', 'Reason'),
        ('requested_by', 'Requested By', lambda obj: obj.requested_by.get_full_name()),
        ('status', 'Status', lambda obj: obj.get_status_display()),
        ('approved_by', 'Approved By', lambda obj: obj.approved_by.get_full_name() if obj.approved_by else 'N/A'),
        ('approved_at', 'Approved At', lambda obj: obj.approved_at.strftime('%Y-%m-%d') if obj.approved_at else 'N/A'),
    ]
    
    filename = f"stock_requests_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    title = "Stock Requests Report"
    if status:
        title += f" - {status.title()}"
    
    return export_queryset_to_excel(
        queryset=requests_qs,
        columns=columns,
        filename=filename,
        title=title,
        generated_by=f"{user.get_full_name()} ({user.username})"
    )
