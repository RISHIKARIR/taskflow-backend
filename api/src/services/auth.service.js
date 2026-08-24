const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { users: User, Refreshtoken } = require('../models');
const { hashToken, issueTokens } = require('../utils/token.utils');

async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error('Email exists');
    err.code = 'EMAIL_EXISTS';
    throw err;
  }

  const hashed_password = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashed_password });
  const tokens = await issueTokens(user);

  return { user: { id: user.id, name: user.name, email: user.email }, ...tokens };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    const err = new Error('Invalid credentials');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const tokens = await issueTokens(user);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    ...tokens,
  };
}

async function refreshTokens({ refreshToken }) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (e) {
    const err = new Error('Invalid token');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await Refreshtoken.findOne({
    where: { user_id: payload.sub, hashed_token: tokenHash, revoked: false },
  });

  if (!stored || stored.expires_at < new Date()) {
    const err = new Error('Invalid or revoked token');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  const user = await User.findByPk(payload.sub);
  if (!user) {
    const err = new Error('User not found');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  stored.revoked = true;
  await stored.save();

  return await issueTokens(user);
}

async function logoutUser({ refreshToken }) {
  if (!refreshToken) {
    const err = new Error('Refresh token is required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await Refreshtoken.findOne({
    where: { hashed_token: tokenHash },
  });

  if (!stored) {
    return true;
  }

  stored.revoked = true;
  await stored.save();
  return true;
}

module.exports = {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
};