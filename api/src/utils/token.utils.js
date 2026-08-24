require("dotenv").config();


const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const { Refreshtoken } = require("../models");
const { org_members } = require("../models");

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueTokens(user) {

  const membership = await org_members.findOne({
    where: { user_id: user.id },
  });





  const accessToken = jwt.sign(
    {
      sub: user.id, email: user.email,
      orgId: membership ? membership.organization_id : null,
      role: membership ? membership.role : null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await Refreshtoken.create({
    user_id: user.id,
    hashed_token: hashToken(refreshToken),
    revoked: false,
    expires_at: expiresAt,
  });

  return { accessToken, refreshToken };
}

module.exports = {
  hashToken,
  issueTokens,
};