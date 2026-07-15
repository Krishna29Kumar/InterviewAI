/**
 * FILE: server/models/User.js
 * ================================================================
 * YE FILE KYA HAI: MongoDB mein har registered user kaisa dikhta hai,
 * uska schema (blueprint).
 *
 * FIELDS: name, email (unique), password (hashed, kabhi query mein
 * wapas nahi aata by default), avatar (profile pic URL), role
 * (user/admin — future admin panel ke liye ready hai).
 *
 * SECURITY FEATURE — Auto Password Hashing:
 *   Jab bhi koi User document save hota hai, `pre('save')` hook chalta
 *   hai jo automatically password ko bcrypt se hash kar deta hai —
 *   taaki plain-text password kabhi bhi database mein na jaaye.
 *
 *   IMPORTANT FIX: Ye hook sirf tab hashing chalata hai jab password
 *   actually change hua ho (`isModified('password')`). Agar user sirf
 *   naam/email update kare, toh password ko dobara hash NAHI karta —
 *   warna already-hashed password phir se hash ho jaata (double-hash
 *   bug), jisse agli baar login fail ho jaata.
 *
 * PROJECT MEIN ROLE: authController.js (register/login) aur
 * profileController.js (profile update) dono is model ko use karte hain.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false, // Query karne pe by default password field wapas nahi aata (security)
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// Har save se pehle password ko bcrypt se encrypt karo — LEKIN SIRF agar
// password field actually change hua ho. `return` yahan zaroori hai,
// warna neeche wali hashing lines bhi chal jaati hain aur password ko
// baar-baar (naam/email update pe bhi) dobara hash kar deti hain, jisse
// login tootne wala bug ban jaata.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Login ke waqt: user ne jo password type kiya, use DB ke hashed password se compare karo
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
