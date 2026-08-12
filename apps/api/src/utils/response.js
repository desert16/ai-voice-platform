/**
 * Standardized success response format.
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {any} [data=null] - Payload data
 * @param {number} [statusCode=200] - HTTP status code
 */
function success(res, message, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Standardized error response format.
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {any} [details=null] - Detailed error info
 */
function error(res, message, statusCode = 500, details = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    details,
  });
}

/**
 * Standardized paginated success response.
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {any[]} items - Array of data items
 * @param {number} total - Total number of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} [statusCode=200] - HTTP status code
 */
function paginated(res, message, items, total, page, limit, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

module.exports = {
  success,
  error,
  paginated,
};
