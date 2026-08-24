const { Op } = require("sequelize");
const { AppError } = require("../utils/errors");
const { enqueueAssignmentEmail } = require("../queues/emailQueue");

async function assignTaskWithNotification(orgId, taskId, userId, assignedByUserId, models) {
  const { Tasks: Task, org_members: OrgMember, TaskAssignments: TaskAssignment } = models;
 
  const task = await Task.findOne({ where: { id: taskId, orgId, deletedAt: null } });
  if (!task) throw new AppError("Task not found", "TASK_NOT_FOUND", 404);
 
  const member = await OrgMember.findOne({ where: { user_id: userId, organization_id: orgId } });
  if (!member) {
    throw new AppError("User does not belong to this organization", "USER_NOT_IN_ORG", 403);
  }
 
  // bonus: dedupe within 5 seconds
  const recent = await TaskAssignment.findOne({
    where: {
      taskId,
      userId,
      createdAt: { [Op.gte]: new Date(Date.now() - 5000) },
    },
  });
  if (recent) return recent;
 
  const assignment = await TaskAssignment.create({ taskId, userId });
 
  try {
    await enqueueAssignmentEmail(taskId, userId, assignedByUserId);
  } catch (err) {
    console.error(`Failed to enqueue email job for assignment ${assignment.id}:`, err.message);
  }
 
  return assignment;
}
 
module.exports = { assignTaskWithNotification };