const { org_members: OrgMember } = require("../models");
const { AppError } = require("../utils/errors");
 
async function listMembers(orgId) {
  return OrgMember.findAll({ where: { organization_id: orgId } });
}
 
async function removeMember(orgId, userId) {
  const member = await OrgMember.findOne({
    where: { organization_id: orgId, user_id: userId },
  });
  if (!member) {
    throw new AppError("Member not found", "MEMBER_NOT_FOUND", 404);
  }
  await member.destroy();
  return { removed: true };
}
 
async function updateMemberRole(orgId, userId, role) {
  if (!["org_admin", "member"].includes(role)) {
    throw new AppError("Invalid role", "VALIDATION_ERROR", 422, {
      role: "Must be 'org_admin' or 'member'",
    });
  }
 
  const member = await OrgMember.findOne({
    where: { organization_id: orgId, user_id: userId },
  });
  if (!member) {
    throw new AppError("Member not found", "MEMBER_NOT_FOUND", 404);
  }
 
  member.role = role;
  await member.save();
  return member;
}
 
module.exports = { listMembers, removeMember, updateMemberRole };