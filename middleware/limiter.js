import rateLimit from 'express-rate-limit';

const devLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,           // very high limit for dev
  message: "Too many requests from this IP. Please try again later.",
});

const prodLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // stricter limit for production
  message: "Too many requests from this IP. Please try again later.",
});

const limiter = process.env.NODE_ENV === 'production' ? prodLimiter : devLimiter;

export default limiter;