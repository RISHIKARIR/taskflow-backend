const { Op } = require("sequelize");
const { Task, Project, org_members: OrgMember, TaskAssignment } = require("../models");
const { AppError } = require("../utils/errors");
const { enqueueAssignmentEmail } = require("../queues/emailQueue");
const { sequelize } = require("../models");
 
async function createTask(orgId, data) {
  
  const project = await Project.findOne({
    where: { id: data.project_id, organization_id: orgId },
  });
  if (!project) {
    throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
  }

  console.log(data,"nibguigbui")
  console.log("Creating task with data", data.due_date);

  
 
  return Task.create({
    title: data.title,
    description: data.description || null,
    status: data.status || "todo",
    priority: data.priority || "medium",
    due_date: data.due_date || null,
    project_id: data.project_id,
  });
}
 
async function getTasks(orgId, filters, pagination) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.dueDateFrom || filters.dueDateTo) {
    where.due_date = {};
    if (filters.dueDateFrom) where.due_date[Op.gte] = new Date(filters.dueDateFrom);
    if (filters.dueDateTo) where.due_date[Op.lte] = new Date(filters.dueDateTo);
  }
 
  const include = [
    {
      model: Project,
      as: "Project",
      where: { organization_id: orgId }, // org scoping via join
      attributes: [],
    },
  ];
 
  if (filters.assigneeId) {
    include.push({
      model: TaskAssignment,
      where: { user_id: filters.assigneeId },
      required: true,
    });
  }
 
  const { rows: data, count: total } = await Task.findAndCountAll({
    where,
    include,
    offset: pagination.skip,
    limit: pagination.limit,
    order: [["createdAt", "DESC"]],
    distinct: true,
  });
 
  return { data, total };
}
 
async function getTaskById(orgId, taskId) {
  const task = await Task.findOne({
    where: { id: taskId },
    include: [{ model: Project, as: "Project" }],
  });
 
  if (!task) {
    throw new AppError("Task not found", "TASK_NOT_FOUND", 404);
  }
  if (task.Project.organization_id !== orgId) {
    throw new AppError("Forbidden", "FORBIDDEN", 403, {});
  }
 
  return task;
}
 
async function updateTask(orgId, taskId, data) {
  const task = await getTaskById(orgId, taskId);
  return task.update(data);
}
 
async function deleteTask(orgId, taskId) {
  const task = await getTaskById(orgId, taskId);
  return task.destroy(); 
}
 
async function assignTask(orgId, taskId, userId, assignedByUserId) {

  const transaction = await sequelize.transaction();

  try {

  await getTaskById(orgId, taskId);

  const member = await OrgMember.findOne({
    where: {
      user_id: userId,
      organization_id: orgId
    },
    transaction
  });

  if (!member) {
    throw new AppError(
      "User does not belong to this organization",
      "USER_NOT_IN_ORG",
      403
    );
  }

  const assignment = await TaskAssignment.create({
    task_id: taskId,
    user_id: userId
  },
{transaction});

  const job = await enqueueAssignmentEmail(
    taskId,
    userId,
    assignedByUserId
  );


  await transaction.commit();

  return {
    assignment,
    jobId: job.id
  };



}catch(err){
  await transaction.rollback();
  throw err;
}


}
 
async function unassignTask(orgId, taskId, userId) {
  await getTaskById(orgId, taskId);
  return TaskAssignment.destroy({ where: { task_id: taskId, user_id: userId } });
}
 
module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  unassignTask,
};