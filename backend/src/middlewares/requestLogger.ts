import pinoHttp from 'pino-http';

/**
 * Request logging middleware using pino-http
 */
export const requestLogger = pinoHttp({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    if (res.statusCode === 404) {
      return 'resource not found';
    }
    return `${req.method} completed`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} errored with status code: ${res.statusCode}`;
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: (() => {
        try {
          return {
            'content-type': typeof res.getHeader === 'function' ? res.getHeader('content-type') : undefined,
          };
        } catch (e) {
          return {};
        }
      })(),
    }),
  },
});