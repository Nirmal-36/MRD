"""
Custom exception handler for standardized error responses
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns standardized error format
    
    Returns:
        {
            "success": false,
            "message": "Human-readable error message",
            "errors": {field: [errors]} (if validation error),
            "status_code": 400
        }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Standardize the error response
        custom_response = {
            'success': False,
            'status_code': response.status_code
        }
        
        # Handle different error types
        if isinstance(response.data, dict):
            # Check if it's a validation error (field-specific errors)
            if any(isinstance(v, list) for v in response.data.values()):
                # Field validation errors
                custom_response['message'] = 'Validation failed'
                custom_response['errors'] = response.data
            else:
                # Single error message or detail
                custom_response['message'] = (
                    response.data.get('detail') or 
                    response.data.get('error') or
                    response.data.get('message') or
                    'An error occurred'
                )
                # Include any additional error details
                if len(response.data) > 1:
                    custom_response['errors'] = response.data
        elif isinstance(response.data, list):
            # List of errors
            custom_response['message'] = response.data[0] if response.data else 'An error occurred'
            custom_response['errors'] = response.data
        else:
            # String error
            custom_response['message'] = str(response.data)
        
        response.data = custom_response
    else:
        # Handle Django validation errors not caught by DRF
        if isinstance(exc, DjangoValidationError):
            response = Response(
                {
                    'success': False,
                    'message': 'Validation failed',
                    'errors': exc.message_dict if hasattr(exc, 'message_dict') else {'error': exc.messages},
                    'status_code': status.HTTP_400_BAD_REQUEST
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return response


def get_error_message(error_data):
    """
    Extract a single error message from error data
    Useful for displaying in UI
    """
    if isinstance(error_data, str):
        return error_data
    
    if isinstance(error_data, dict):
        # Get first error from dict
        for key, value in error_data.items():
            if isinstance(value, list) and value:
                return f"{key}: {value[0]}"
            return f"{key}: {value}"
    
    if isinstance(error_data, list) and error_data:
        return error_data[0]
    
    return "An error occurred"
