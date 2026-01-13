import random
import logging
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def generate_otp():
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))


def store_otp(email, otp, expiry_minutes=10):
    """Store OTP in cache with expiration"""
    cache_key = f"otp_{email}"
    cache.set(cache_key, otp, timeout=expiry_minutes * 60)
    logger.info(f"OTP stored for {email}")
    return True


def verify_otp(email, otp, delete_after_verify=False):
    """Verify OTP from cache"""
    cache_key = f"otp_{email}"
    stored_otp = cache.get(cache_key)
    
    if not stored_otp:
        return False, "OTP expired or not found"
    
    if stored_otp != otp:
        return False, "Invalid OTP"
    
    # Mark OTP as verified for password reset flow
    if not delete_after_verify:
        verified_key = f"otp_verified_{email}"
        cache.set(verified_key, otp, timeout=600)  # 10 minutes
    else:
        # Delete OTP immediately if requested
        cache.delete(cache_key)
    
    return True, "OTP verified successfully"


def clear_otp(email):
    """Clear OTP and verification status from cache"""
    cache_key = f"otp_{email}"
    verified_key = f"otp_verified_{email}"
    cache.delete(cache_key)
    cache.delete(verified_key)
    logger.info(f"OTP and verification status cleared for {email}")


def is_otp_verified(email, otp):
    """Check if OTP was previously verified"""
    verified_key = f"otp_verified_{email}"
    verified_otp = cache.get(verified_key)
    return verified_otp == otp


def send_otp_email(email, otp):
    """
    Send OTP via email using Django's email backend
    """
    try:
        subject = "KLH MedCare - Password Reset OTP"
        message = f"""
Hello,

Your One-Time Password (OTP) for password reset is:

{otp}

This OTP is valid for 10 minutes.

If you did not request a password reset, please ignore this email.

Best regards,
KLH MedCare Team
        """.strip()
        
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]
        
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        
        logger.info(f"✅ OTP email sent successfully to {email}")
        return True, "OTP sent successfully to your email"
            
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        # In development, log the OTP
        if settings.DEBUG:
            logger.warning(f"Development mode - OTP for {email}: {otp}")
            return True, f"OTP generated (check console): {otp}"
        return False, "Failed to send OTP email. Please try again."

