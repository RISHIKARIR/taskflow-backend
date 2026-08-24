const orgMemberService = require("../services/orgMemberservice");
 
async function listMembers(req, res, next) {
  try {
    const members = await orgMemberService.listMembers(req.user.orgId);
    res.json({ data: members });
  } catch (err) {
    next(err);
  }
}
 
async function removeMember(req, res, next) {
  try {
    await orgMemberService.removeMember(req.user.orgId, req.params.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
 
async function updateMemberRole(req, res, next) {
  try {
    const member = await orgMemberService.updateMemberRole(
      req.user.orgId,
      req.params.userId,
      req.body.role
    );
    res.json(member);
  } catch (err) {
    next(err);
  }
}
 
module.exports = { listMembers, removeMember, updateMemberRole };