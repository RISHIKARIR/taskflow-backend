require('dotenv').config();
const jwt = require('jsonwebtoken');
const { org_members: OrgMember } = require('../models');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided', code: 'NO_TOKEN', details: {} });
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN', details: {} });
    }

    const membership = await OrgMember.findOne({
      where: { user_id: payload.sub },
    });

    if (!membership) {
      return res.status(403).json({ error: 'No organization membership found', code: 'NO_ORG', details: {} });
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      orgId: membership.organization_id,
      role: membership.role,
    };

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR', details: {} });
  }
}

module.exports = authenticate;