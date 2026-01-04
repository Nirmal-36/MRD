"""
Standard response utilities for consistent API responses
"""
from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message=None, status_code=status.HTTP_200_OK):
    """
    Standard success response format
    
    Args:
        data: Response data (can be dict, list, or None)
        message: Optional success message
        status_code: HTTP status code (default 200)
    
    Returns:
        Response object with standardized format
    """
    response_data = {
        'success': True,
    }
    
    if message:
        response_data['message'] = message
    
    if data is not None:
        # If data is a list, wrap it in results
        if isinstance(data, list):
            response_data['results'] = data
            response_data['count'] = len(data)
        else:
            response_data['data'] = data
    
    return Response(response_data, status=status_code)


def error_response(message, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Standard error response format
    
    Args:
        message: Error message string
        errors: Optional dict of field-specific errors
        status_code: HTTP status code (default 400)
    
    Returns:
        Response object with standardized error format
    """
    response_data = {
        'success': False,
        'message': message,
    }
    
    if errors:
        response_data['errors'] = errors
    
    return Response(response_data, status=status_code)


def list_response(queryset, serializer_class, message=None):
    """
    Standard list response format (for custom actions returning lists)
    
    Args:
        queryset: QuerySet or list of objects
        serializer_class: Serializer class to use
        message: Optional message
    
    Returns:
        Response with standardized list format matching DRF pagination
    """
    serializer = serializer_class(queryset, many=True)
    
    return Response({
        'results': serializer.data,
        'count': len(serializer.data),
        'message': message
    })


def paginated_response(page, serializer_class):
    """
    Standard paginated response format
    
    Args:
        page: Paginated queryset (from paginator)
        serializer_class: Serializer class to use
    
    Returns:
        Response with pagination metadata
    """
    serializer = serializer_class(page, many=True)
    
    return Response({
        'results': serializer.data,
        'count': page.paginator.count,
        'next': page.next_page_number() if page.has_next() else None,
        'previous': page.previous_page_number() if page.has_previous() else None,
    })
