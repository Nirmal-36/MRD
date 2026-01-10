import { useState, useCallback } from 'react';

/**
 * Hook for real-time form validation
 * @param {object} initialValues - Initial form values
 * @param {object} validationRules - Validation rules for each field
 */
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    // Required validation
    if (rules.required && !value) {
      return rules.required.message || 'This field is required';
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength.value) {
      return rules.minLength.message || `Minimum length is ${rules.minLength.value}`;
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength.value) {
      return rules.maxLength.message || `Maximum length is ${rules.maxLength.value}`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.value.test(value)) {
      return rules.pattern.message || 'Invalid format';
    }

    // Custom validation
    if (rules.validate && typeof rules.validate === 'function') {
      const error = rules.validate(value, values);
      if (error) return error;
    }

    return '';
  }, [validationRules, values]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));

    // Real-time validation if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return isValid;
  }, [values, validationRules, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValue,
    setValues,
  };
};
