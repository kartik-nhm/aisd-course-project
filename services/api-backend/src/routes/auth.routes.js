/**
 * Authentication Routes (Patient, Doctor, Pharmacist)
 */

const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const User = require('../models/User');
const Patient = require('../models/Patient');
const DoctorProfile = require('../models/DoctorProfile');
const Pharmacy = require('../models/Pharmacy');
const Otp = require('../models/Otp');
const { env } = require('../config/env');
const { ROLE_CODES, ROLE_CLAIMS } = require('../middleware/auth');

const router = express.Router();

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function generateToken(user) {
  const roleClaim = ROLE_CLAIMS[user.role] || 'Patient';
  return jwt.sign(
    {
      sub: user.phone || user.email,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: roleClaim,
      roleCode: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Register User (Patient, Doctor, or Pharmacist)
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, role = ROLE_CODES.PATIENT, pincode, licenseNumber } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Name, email, password, and phone are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail, role });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email and role already exists' });
    }

    const hashedPassword = hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: String(phone).trim(),
      role,
    });

    // Create role-specific profile document
    if (role === ROLE_CODES.PATIENT) {
      await Patient.updateOne(
        { phone: user.phone },
        { $set: { name: user.name, phone: user.phone, pincode: pincode || '' } },
        { upsert: true }
      );
    } else if (role === ROLE_CODES.DOCTOR) {
      await DoctorProfile.updateOne(
        { email: user.email },
        { $set: { name: user.name, email: user.email } },
        { upsert: true }
      );
    } else if (role === ROLE_CODES.PHARMACIST) {
      await Pharmacy.updateOne(
        { email: user.email },
        {
          $set: {
            name: user.name,
            email: user.email,
            phone: user.phone,
            pincode: pincode || '560001',
            licenseNumber: licenseNumber || `PHAR-REG-${Date.now().toString().slice(-6)}`,
          },
        },
        { upsert: true }
      );
    }

    const token = generateToken(user);
    return res.status(201).json({
      success: true,
      token,
      user: { name: user.name, email: user.email, phone: user.phone, role: ROLE_CLAIMS[user.role] },
    });
  } catch (error) {
    console.error('[AuthRoute] signup error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Login User
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const query = { email: String(email).toLowerCase().trim() };
    if (role) query.role = role;

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const hashed = hashPassword(password);
    if (user.password !== hashed) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      token,
      user: { name: user.name, email: user.email, phone: user.phone, role: ROLE_CLAIMS[user.role] },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Send OTP via Resend
 */
router.post('/otp/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalizedEmail = String(email).toLowerCase().trim();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.updateOne(
      { username: normalizedEmail },
      { $set: { otp: otpCode, expiresAt } },
      { upsert: true }
    );

    if (env.RESEND_API_KEY) {
      const resend = new Resend(env.RESEND_API_KEY);
      await resend.emails.send({
        from: env.RESEND_SENDER_EMAIL,
        to: normalizedEmail,
        subject: `Your Smart Telehealth Verification Code: ${otpCode}`,
        html: `<p>Your verification code is: <strong>${otpCode}</strong>. Valid for 10 minutes.</p>`,
      });
    } else {
      console.log(`[OTP Mock] Code for ${normalizedEmail}: ${otpCode}`);
    }

    return res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Verify OTP
 */
router.post('/otp/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    const record = await Otp.findOne({ username: normalizedEmail });

    if (!record || record.otp !== String(otp).trim()) {
      return res.status(400).json({ valid: false, error: 'Invalid or expired OTP' });
    }

    await Otp.deleteOne({ username: normalizedEmail });
    return res.json({ valid: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
