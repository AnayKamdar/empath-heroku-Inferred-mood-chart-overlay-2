const winston = require('winston');
require('winston-daily-rotate-file');

// Custom log format to use across various loggers
const logFormat = winston.format.printf(info => {
    const label = info.label || 'default';
    return `${info.timestamp} [${label}] ${info.level}: ${info.message}`;
  });

// Base logger configuration
const baseLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.splat(),
      logFormat 
    ),
    transports: [new winston.transports.Console()], // Logging to console
  });

/**
 * Function to create logger instances for specific parts of the application.
 * Allows for easy categorization and filtering of logs.
 * 
 * @param {String} label A unique label for the logger, e.g., "HTTP", "Database".
 * @returns Logger instance with custom and predefined methods.
 */
function createLogger(label) {
    const childLogger = baseLogger.child({ label });
  
    return {
      info: (message) => childLogger.info(message),
      warn: (message) => childLogger.warn(message),
      error: (message) => childLogger.error(message),
      debug: (message) => childLogger.debug(message),

      /**
        * Custom method for logging HTTP requests. Utilizes structured logging.
        *
        * @param {Object} req The HTTP request object.
        */
      httpRequest: (req) => {
        const { method, url, headers } = req;
        childLogger.info(`HTTP Request - Method: ${method}, URL: ${url}, Headers: ${JSON.stringify(headers)}`);
      },
    };
  }

  module.exports = {
    defaultLogger: baseLogger,
    createLogger,
  };

// Example usage:

    // Using the default logger for general application-wide logging

        // const { defaultLogger } = require('../../logging/logger');
        // defaultLogger.info('Application has started.');

    // Creating and using a context-specific logger, e.g., for HTTP request logging

        // const { createLogger } = require('../../logging/logger');
        // const httpLogger = createLogger('HTTP');
        // httpLogger.httpRequest(req); // Assuming 'req' is the HTTP request object available

