const express = require('express');
const requestLogger = require('./middleware/requestLogger');
const createRateLimiter = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// --- Global middleware  ---
app.use(express.json()); 
app.use(requestLogger); 
app.use(createRateLimiter({ windowMs: 60_000, max: 100 })); // custom: throttling

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: { statusCode: 400, message: 'Malformed JSON in request body' },
    });
  }
  next(err);
});

// --- Routes ---
app.use('/api', routes);


app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
