const { v4: uuidv4 } = require('uuid');


const requestLogger = (req, res, next) => {
  req.requestId = uuidv4();
  const start = process.hrtime.bigint();

  res.setHeader('X-Request-Id', req.requestId);

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [${req.requestId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs.toFixed(1)}ms)`
    );
  });

  next();
};

module.exports = requestLogger;
