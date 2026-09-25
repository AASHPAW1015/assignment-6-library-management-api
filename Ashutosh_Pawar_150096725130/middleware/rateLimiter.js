const rateLimit = require("express-rate-limit");

// Caps each IP to 100 requests per 15 minutes across all /api routes.
// Guards the API against brute-force login attempts and general abuse/DoS.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max requests per window per IP
  message: {
    success: false,
    message:
      "Too many requests created from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // send RateLimit-* headers
  legacyHeaders: false, // drop the old X-RateLimit-* headers
});

module.exports = apiLimiter;
