const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const ROLE_CODES = {
  PATIENT: '01',
  DOCTOR: '02',
  PHARMACIST: '03',
};

const ROLE_CLAIMS = {
  [ROLE_CODES.PATIENT]: 'Patient',
  [ROLE_CODES.DOCTOR]: 'Doctor',
  [ROLE_CODES.PHARMACIST]: 'Pharmacist',
};

function normalizeRole(roleClaim) {
  const r = String(roleClaim || '').toLowerCase();
  if (r === 'patient' || r === '01') return 'patient';
  if (r === 'doctor' || r === '02') return 'doctor';
  if (r === 'pharmacist' || r === 'pharamcist' || r === '03') return 'pharmacist';
  return 'unknown';
}

function attachAuth(req, _res, next) {
  const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    req.auth = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.auth = {
      token,
      subject: decoded.sub || decoded.phone || decoded.email,
      role: normalizeRole(decoded.role),
      roleCode: decoded.role,
      email: decoded.email,
      phone: decoded.phone,
    };
  } catch (_e) {
    req.auth = null;
  }
  next();
}

function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}

module.exports = {
  attachAuth,
  requireAuth,
  ROLE_CODES,
  ROLE_CLAIMS,
  normalizeRole,
};
