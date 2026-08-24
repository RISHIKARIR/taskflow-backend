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

async function addMember(orgId, userId) {
  if (!userId) {
    const error = new Error("user_id is required");
    error.statusCode = 400;
    error.code = "USER_ID_REQUIRED";
    throw error;
  }

 
  const user = await users.findByPk(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }


  const existingMember = await org_members.findOne({
    where: {
      org_id: orgId,
      user_id: userId
    }
  });

  if (existingMember) {
    const error = new Error(
      "User is already a member of this organization"
    );
    error.statusCode = 409;
    error.code = "ALREADY_MEMBER";
    throw error;
  }


  const member = await org_members.create({
    org_id: orgId,
    user_id: userId,
    role: "member"
  });

  return member;
}
 
module.exports = { listMembers, removeMember, updateMemberRole,addMember };