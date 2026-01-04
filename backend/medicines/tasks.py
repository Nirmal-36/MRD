from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from medicines.models import Medicine, StockRequest


@shared_task
def send_low_stock_alert(medicine_id):
    """Send email alert for low stock medicine"""
    try:
        medicine = Medicine.objects.get(id=medicine_id)
        
        subject = f'Low Stock Alert: {medicine.name}'
        message = f"""
        Dear Management,
        
        This is an automated alert to inform you that the medicine '{medicine.name}' is running low on stock.
        
        Current Stock: {medicine.current_stock} {medicine.unit}
        Minimum Stock Level: {medicine.minimum_stock_level} {medicine.unit}
        Category: {medicine.get_category_display()}
        
        Please arrange for restocking as soon as possible.
        
        Regards,
        Medical Room Management System
        """
        
        recipient_list = [settings.DEFAULT_FROM_EMAIL]  # Add management emails here
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        
        return f'Low stock alert sent for {medicine.name}'
        
    except Medicine.DoesNotExist:
        return f'Medicine with ID {medicine_id} not found'


@shared_task
def send_stock_request_notification(stock_request_id):
    """Send email notification for stock requests"""
    try:
        stock_request = StockRequest.objects.get(id=stock_request_id)
        
        subject = f'Stock Request #{stock_request.id}: {stock_request.medicine.name}'
        message = f"""
        Dear Management,
        
        A new stock request has been submitted:
        
        Medicine: {stock_request.medicine.name}
        Requested Quantity: {stock_request.requested_quantity} {stock_request.medicine.unit}
        Current Stock: {stock_request.current_stock} {stock_request.medicine.unit}
        Priority: {stock_request.get_priority_display()}
        Requested By: {stock_request.requested_by.get_full_name()}
        
        Reason: {stock_request.reason}
        
        Please review and approve this request at your earliest convenience.
        
        Regards,
        Medical Room Management System
        """
        
        recipient_list = [settings.DEFAULT_FROM_EMAIL]  # Add management emails here
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        
        return f'Stock request notification sent for request #{stock_request.id}'
        
    except StockRequest.DoesNotExist:
        return f'Stock request with ID {stock_request_id} not found'


@shared_task
def check_low_stock_medicines():
    """Periodic task to check for low stock medicines and send alerts"""
    low_stock_medicines = Medicine.objects.filter(
        current_stock__lte=models.F('minimum_stock_level'),
        is_active=True
    )
    
    alerts_sent = 0
    for medicine in low_stock_medicines:
        send_low_stock_alert.delay(medicine.id)
        alerts_sent += 1
    
    return f'Checked stock levels, sent {alerts_sent} alerts'


@shared_task
def generate_daily_cleaning_schedule():
    """Generate daily cleaning records based on schedules"""
    from cleaning.models import CleaningSchedule, CleaningRecord
    from django.utils import timezone
    
    today = timezone.now().date()
    daily_schedules = CleaningSchedule.objects.filter(
        frequency='daily',
        is_active=True
    )
    
    records_created = 0
    for schedule in daily_schedules:
        record, created = CleaningRecord.objects.get_or_create(
            area=schedule.area,
            cleaning_type=schedule.cleaning_type,
            scheduled_date=today,
            defaults={
                'scheduled_time': schedule.preferred_time,
                'assigned_to': schedule.default_assignee,
                'created_by_id': 1,  # System user
            }
        )
        if created:
            records_created += 1
    
    return f'Generated {records_created} daily cleaning records'