/**
 * Export utility functions for downloading Excel files
 */

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob data to download
 * @param {string} filename - The name of the file to download
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Extract filename from Content-Disposition header
 * @param {string} contentDisposition - The Content-Disposition header value
 * @returns {string} - The extracted filename or a default name
 */
export const getFilenameFromResponse = (response) => {
  const contentDisposition = response.headers['content-disposition'];
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1];
    }
  }
  return `export_${new Date().getTime()}.xlsx`;
};

/**
 * Handle export API call and download
 * @param {Function} exportFunction - The API function to call
 * @param {Object} params - Optional parameters for the export
 * @param {Function} setLoading - Loading state setter
 * @param {Function} showSuccess - Success message function
 * @param {Function} showError - Error message function
 */
export const handleExport = async (exportFunction, params, setLoading, showSuccess, showError) => {
  try {
    setLoading(true);
    const response = await exportFunction(params);
    const filename = getFilenameFromResponse(response);
    downloadBlob(response.data, filename);
    showSuccess('Export successful! File downloaded.');
  } catch (error) {
    console.error('Export error:', error);
    showError(error.response?.data?.error || 'Failed to export data. Please try again.');
  } finally {
    setLoading(false);
  }
};

/**
 * Generate filename with timestamp
 * @param {string} prefix - Filename prefix
 * @returns {string} - Filename with timestamp
 */
export const generateFilename = (prefix) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  return `${prefix}_${timestamp}.xlsx`;
};
