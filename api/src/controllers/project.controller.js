
const projectService = require("../services/projectService");
const { parsePagination: parsePage, buildPaginatedResponse: buildPageResponse } = require("../utils/pagination");
const { validateCreateProject } = require("../validators/project.validator");
 
async function createProject(req, res, next) {
  try {
    const validatedData = validateCreateProject(req.body);
    const project = await projectService.createProject(req.user.orgId, validatedData);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}
 
async function listProjects(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const { data, total } = await projectService.getProjects(req.user.orgId, { skip, limit });
    res.json(buildPageResponse(data, total, page, limit));
  } catch (err) {
    next(err);
  }
}
 
async function getProject(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.user.orgId, req.params.id);
    res.json(project);
  } catch (err) {
    next(err);
  }
}
 
async function updateProject(req, res, next) {
  try {
    const project = await projectService.updateProject(req.user.orgId, req.params.id, req.body);
    res.json(project);
  } catch (err) {
    next(err);
  }
}
 
async function deleteProject(req, res, next) {
  try {
    await projectService.deleteProject(req.user.orgId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
 
async function getDashboard(req, res, next) {
  try {
    const dashboard = await projectService.getProjectDashboard(req.user.orgId, req.params.id);
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}
 
module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  getDashboard,
};