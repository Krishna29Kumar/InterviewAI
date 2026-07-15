/**
 * FILE: server/config/cloudinary.js
 * ================================================================
 * YE FILE KYA HAI: Cloudinary (image/file hosting service) ka config.
 *
 * YE KYA KARTI HAI: Cloudinary SDK ko apni account credentials
 * (.env se) ke saath initialize karti hai, taaki app kahin se bhi
 * files upload/manage kar sake.
 *
 * PROJECT MEIN ROLE: User jab apna profile avatar upload karta hai
 * (ProfilePage se), tab profileController.js is configured `cloudinary`
 * instance ko use karke image ko cloud pe store karta hai.
 *
 * NOTE: Agar .env mein CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET set
 * nahi hain (jaise abhi is project mein), toh profileController.js
 * automatically local server storage (/uploads folder) pe fallback
 * kar deta hai — is file ka na hona bhi app ko crash nahi karega.
 */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

module.exports = cloudinary;
