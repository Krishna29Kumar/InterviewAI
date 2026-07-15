/**
 * FILE: server/middleware/errorMiddleware.js
 * ================================================================
 * YE FILE KYA HAI: Poori app ke liye ek CENTRALIZED error handler.
 * Har controller mein baar-baar try/catch likhne ke bajaye, saari
 * errors yahan aakar ek jagah se clean, consistent JSON response
 * mein convert hoti hain.
 *
 * DO FUNCTIONS:
 *   1. notFound()     → Jab koi bhi requested URL kisi route se match
 *                       na ho (jaise typo wala endpoint), 404 bhejta hai
 *   2. errorHandler()  → Kisi bhi route/controller mein error throw ho,
 *                       ye usse pakad ke sahi status code + readable
 *                       message mein badal deta hai. MongoDB ki specific
 *                       errors (bad ID format, duplicate email, validation
 *                       fail) ko bhi pehchan ke user-friendly message deta hai.
 *
 * PROJECT MEIN ROLE: server.js ke bilkul aakhir mein
 * `app.use(notFound)` phir `app.use(errorHandler)` lagaya gaya hai —
 * Express mein error-middleware hamesha SABSE AAKHIR mein lagti hai,
 * taaki agar upar koi bhi route/middleware fail ho, wo yahin aakar catch ho.
 */

const errorHandler = (err, req, res, next) => {
  // Agar status code set nahi hua (abhi bhi default 200), toh 500 (Server Error) maan lo
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose CastError — matlab kisi galat-format ID se document dhoondne ki koshish hui
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key error — jaise same email se dobara register karna
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Mongoose schema validation error (jaise required field missing)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  res.status(statusCode).json({
    message,
    // Production mein stack trace hide karo (security), development mein dikhao (debugging)
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Isse errorHandler ko forward kar do
};

module.exports = {
  errorHandler,
  notFound,
};
