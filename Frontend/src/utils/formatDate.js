/**
 * Formats a date string into DD-MM-YY format
 * @param {string|Date} date - The date to format (can be Date object or date string)
 * @returns {string} - Formatted date string in DD-MM-YY format
 */
export const formatDate = (date) => {
  try {
    // Convert to Date object if string is provided
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Get day, month, and year
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString().slice(-2); // Get last 2 digits of year
    
    // Return formatted date
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats a date string into a more readable format with time
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string with time
 */
export const formatDateWithTime = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString().slice(-2);
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date with time:', error);
    return 'Invalid Date';
  }
}; 