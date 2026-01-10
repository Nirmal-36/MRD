/**
 * Standardized error handling utilities
 * Matches backend error response format
 */

/**
 * Extract error message from API error response
 * Handles multiple error formats from backend
 * 
 * @param {Error} error - Axios error object
 * @returns {string} - Human-readable error message
 */
export const extractErrorMessage = (error) => {
  // Network error (no response from server)
  if (!error.response) {
    return 'Network error. Please check your internet connection and try again.';
  }

  const { data, status } = error.response;

  // Server returned error in standard format
  if (data && typeof data === 'object') {
    // Standard format: {success: false, message: "...", errors: {...}}
    if (data.message) {
      return data.message;
    }

    // Field validation errors: {field_name: ["error1", "error2"]}
    if (data.errors && typeof data.errors === 'object') {
      const firstField = Object.keys(data.errors)[0];
      const firstError = data.errors[firstField];
      
      if (Array.isArray(firstError) && firstError.length > 0) {
        return `${formatFieldName(firstField)}: ${firstError[0]}`;
      }
      
      return `${formatFieldName(firstField)}: ${firstError}`;
    }

    // Old format: {detail: "..."}
    if (data.detail) {
      return data.detail;
    }

    // Old format: {error: "..."}
    if (data.error) {
      return data.error;
    }

    // Field-level errors without errors wrapper
    const firstKey = Object.keys(data)[0];
    if (firstKey && Array.isArray(data[firstKey])) {
      return `${formatFieldName(firstKey)}: ${data[firstKey][0]}`;
    }
  }

  // String error
  if (typeof data === 'string') {
    return data;
  }

  // Fallback to HTTP status messages
  const statusMessages = {
    400: 'Bad request. Please check your input.',
    401: 'Unauthorized. Please log in again.',
    403: 'Forbidden. You don\'t have permission to perform this action.',
    404: 'Not found. The requested resource doesn\'t exist.',
    500: 'Server error. Please try again later.',
    503: 'Service unavailable. Please try again later.',
  };

  return statusMessages[status] || `Error ${status}: An unexpected error occurred.`;
};

/**
 * Extract field-specific errors from API response
 * Useful for displaying errors next to form fields
 * 
 * @param {Error} error - Axios error object
 * @returns {Object} - Object with field names as keys and error arrays as values
 */
export const extractFieldErrors = (error) => {
  if (!error.response || !error.response.data) {
    return {};
  }

  const { data } = error.response;

  // Standard format with errors object
  if (data.errors && typeof data.errors === 'object') {
    return data.errors;
  }

  // Direct field errors
  if (typeof data === 'object' && !data.message && !data.detail) {
    const fieldErrors = {};
    
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        fieldErrors[key] = data[key];
      } else if (typeof data[key] === 'string') {
        fieldErrors[key] = [data[key]];
      }
    });
    
    return fieldErrors;
  }

  return {};
};

/**
 * Check if the error is an authentication error
 * 
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  if (!error.response) return false;
  return error.response.status === 401 || error.response.status === 403;
};

/**
 * Check if the error is a validation error
 * 
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export const isValidationError = (error) => {
  if (!error.response) return false;
  const { data, status } = error.response;
  return status === 400 && data && (data.errors || Object.keys(data).some(k => Array.isArray(data[k])));
};

/**
 * Format field name for display
 * Converts snake_case to Title Case
 * 
 * @param {string} fieldName - Field name in snake_case
 * @returns {string} - Formatted field name
 */
const formatFieldName = (fieldName) => {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Handle API error and show appropriate message
 * Can be used with toast notifications or alert dialogs
 * 
 * @param {Error} error - Axios error object
 * @param {Function} setError - State setter function for error message
 * @param {Object} options - Optional configuration
 * @returns {void}
 */
export const handleApiError = (error, setError, options = {}) => {
  const {
    onAuthError = null,
    defaultMessage = 'An error occurred. Please try again.',
  } = options;

  // Handle authentication errors
  if (isAuthError(error) && onAuthError) {
    onAuthError(error);
    return;
  }

  const message = extractErrorMessage(error) || defaultMessage;
  setError(message);

  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', {
      message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
  }
};

/**
 * Normalize API list response
 * Handles both paginated ({results: [], count: N}) and direct array responses
 * 
 * @param {Object} response - Axios response object
 * @returns {Array} - Normalized data array
 */
export const normalizeListResponse = (response) => {
  const { data } = response;

  // Standard format: {results: [], count: N}
  if (data && data.results) {
    return data.results;
  }

  // Direct array
  if (Array.isArray(data)) {
    return data;
  }

  // Single object - wrap in array
  if (data && typeof data === 'object') {
    return [data];
  }

  // Fallback to empty array
  return [];
};

/**
 * Get pagination metadata from response
 * 
 * @param {Object} response - Axios response object
 * @returns {Object} - Pagination metadata
 */
export const getPaginationMeta = (response) => {
  const { data } = response;

  if (data && typeof data === 'object') {
    return {
      count: data.count || (Array.isArray(data.results) ? data.results.length : 0),
      next: data.next || null,
      previous: data.previous || null,
    };
  }

  return {
    count: Array.isArray(data) ? data.length : 0,
    next: null,
    previous: null,
  };
};

export default {
  extractErrorMessage,
  extractFieldErrors,
  isAuthError,
  isValidationError,
  handleApiError,
  normalizeListResponse,
  getPaginationMeta,
};
