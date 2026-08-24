
const { sequelize, Project: ProjectModel, Task: TaskModel } = require("../models");
const { AppError: AppErr } = require("../utils/errors");
 
async function createProject(orgId, data) {
  return ProjectModel.create({
    name: data.name,
    description: data.description || null,
    organization_id: orgId,
  });
}
 
async function getProjects(orgId, pagination) {
  const { rows: data, count: total } = await ProjectModel.findAndCountAll({
    where: { organization_id: orgId },
    offset: pagination.skip,
    limit: pagination.limit,
    order: [["createdAt", "DESC"]],
  });
  return { data, total };
}
 
async function getProjectById(orgId, projectId) {
  const project = await ProjectModel.findOne({ where: { id: projectId } });
  if (!project) {
    throw new AppErr("Project not found", "PROJECT_NOT_FOUND", 404);
  }
  if (project.organization_id !== orgId) {
    throw new AppErr("Forbidden", "FORBIDDEN", 403, {});
  }
  return project;
}
 
async function updateProject(orgId, projectId, data) {
  const project = await getProjectById(orgId, projectId);
  return project.update(data);
}
 
async function deleteProject(orgId, projectId) {
  const project = await getProjectById(orgId, projectId);
  return project.destroy(); 
}
 
async function getProjectDashboard(orgId, projectId) {
  const project = await getProjectById(orgId, projectId);
 
  const counts = await TaskModel.findAll({
    where: { project_id: projectId },
    attributes: ["status", [sequelize.fn("COUNT", sequelize.col("status")), "count"]],
    group: ["status"],
    raw: true,
  });
 
  const statusCounts = { todo: 0, in_progress: 0, review: 0, done: 0 };
  counts.forEach((c) => (statusCounts[c.status] = parseInt(c.count, 10)));
 
  return { projectId, name: project.name, taskCounts: statusCounts };
}
 
module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectDashboard,
};