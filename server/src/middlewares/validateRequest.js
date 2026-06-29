import { AppError } from './errorHandler.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const parsedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Optionally attach validated data back to req to ensure sanitized data is used
      req.body = parsedData.body || req.body;
      req.query = parsedData.query || req.query;
      req.params = parsedData.params || req.params;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return next(new AppError(`Validation Error: ${message}`, 400));
      }
      next(error);
    }
  };
};
