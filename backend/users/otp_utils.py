import random
import logging
import os
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


def generate_otp():
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))


def store_otp(phone_number, otp, expiry_minutes=10):
    """Store OTP in cache with expiration"""
    cache_key = f"otp_{phone_number}"
    cache.set(cache_key, otp, timeout=expiry_minutes * 60)
    logger.info(f"OTP stored for {phone_number}: {otp}")  # For development only
    return True


def verify_otp(phone_number, otp, delete_after_verify=False):
    """Verify OTP from cache"""
    cache_key = f"otp_{phone_number}"
    stored_otp = cache.get(cache_key)
    
    if not stored_otp:
        return False, "OTP expired or not found"
    
    if stored_otp != otp:
        return False, "Invalid OTP"
    
    # Mark OTP as verified for password reset flow
    if not delete_after_verify:
        verified_key = f"otp_verified_{phone_number}"
        cache.set(verified_key, otp, timeout=600)  # 10 minutes
    else:
        # Delete OTP immediately if requested
        cache.delete(cache_key)
    
    return True, "OTP verified successfully"


def clear_otp(phone_number):
    """Clear OTP and verification status from cache"""
    cache_key = f"otp_{phone_number}"
    verified_key = f"otp_verified_{phone_number}"
    cache.delete(cache_key)
    cache.delete(verified_key)
    logger.info(f"OTP and verification status cleared for {phone_number}")


def is_otp_verified(phone_number, otp):
    """Check if OTP was previously verified"""
    verified_key = f"otp_verified_{phone_number}"
    verified_otp = cache.get(verified_key)
    return verified_otp == otp


def send_otp_sms(phone_number, otp):
    """
    Send OTP via SMS using Twilio
    Supports both trial (verified numbers) and production accounts
    Falls back to console logging if Twilio is not configured
    """
    try:
        # Check if Twilio is configured
        twilio_enabled = all([
            hasattr(settings, 'TWILIO_ACCOUNT_SID'),
            hasattr(settings, 'TWILIO_AUTH_TOKEN'),
            hasattr(settings, 'TWILIO_PHONE_NUMBER'),
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN
        ])
        
        if not twilio_enabled:
            # Development mode: Twilio not configured - Log to console
            logger.warning(f"Twilio not configured - Development mode OTP")
            logger.info(f"OTP for {phone_number}: {otp} (valid for 10 minutes)")
            return True, "OTP sent successfully (console mode)"
        
        # Twilio is configured - try to send SMS
        from twilio.rest import Client
        
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        # Format phone number for international SMS (add +91 for India if needed)
        formatted_phone = phone_number if phone_number.startswith('+') else f'+91{phone_number}'
        
        # Check if this is a trial account with verified numbers
        verified_numbers = getattr(settings, 'TWILIO_VERIFIED_NUMBERS', '')
        verified_list = [num.strip() for num in verified_numbers.split(',') if num.strip()]
        
        # Try to send SMS
        message = client.messages.create(
            body=f"Your MRD System OTP is: {otp}. Valid for 10 minutes. Do not share this code.",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=formatted_phone
        )
        
        logger.info(f"✅ SMS sent successfully to {phone_number}. SID: {message.sid}")
        return True, "OTP sent successfully to your mobile"
            
    except Exception as e:
        error_str = str(e)
        logger.error(f"Failed to send OTP to {phone_number}: {error_str}")
        
        # Check if it's a trial account unverified number error
        if 'unverified' in error_str.lower() or '21608' in error_str:
            # Trial account with unverified number - log to console
            logger.warning(f"Twilio trial account - unverified number: {phone_number}")
            logger.info(f"OTP for {phone_number}: {otp} (valid for 10 minutes)")
            logger.info(f"To send real SMS: Verify {formatted_phone if phone_number.startswith('+') else f'+91{phone_number}'} at Twilio console or upgrade account")
            return True, f"OTP generated: {otp} (Verify phone at Twilio console for SMS delivery)"
        else:
            # Other Twilio errors - log and continue
            logger.error(f"SMS delivery failed for {phone_number}: {error_str[:100]}")
            logger.info(f"Fallback mode - OTP for {phone_number}: {otp} (valid for 10 minutes)")
            return True, f"OTP generated: {otp} (SMS failed, check logs)"
