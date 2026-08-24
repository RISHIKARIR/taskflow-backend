const taskService = require("../services/taskService");
const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { validateCreateTask } = require("../validators/task.validator");
const { AppError } = require("../utils/errors"); 


async function createTask(req, res, next) {
  try {
    const validatedData = validateCreateTask(req.body);

    const task = await taskService.createTask(req.user.orgId, validatedData);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}
 
async function listTasks(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await taskService.getTasks(req.user.orgId, req.query, { skip, limit });
    res.json(buildPaginatedResponse(data, total, page, limit));
  } catch (err) {
    next(err);
  }
}
 
async function getTask(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.user.orgId, req.params.id);
    res.json(task);
  } catch (err) {
    next(err);
  }
}
 
async function updateTask(req, res, next) {
  try {
    const task = await taskService.updateTask(req.user.orgId, req.params.id, req.body);
    res.json(task);
  } catch (err) {
    next(err);
  }
}
 
async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.user.orgId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
 
async function assignTask(req, res, next) {
  try {

    const userId = req.body.userId;

     if (!userId) {
      throw new AppError(
        "userId is required",
        "USER_ID_REQUIRED",
        400
      );
    }

    const assignment = await taskService.assignTask(req.user.orgId, req.params.id, req.body.userId,req.user.id);

    


    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
}
 
async function unassignTask(req, res, next) {
  try {
    await taskService.unassignTask(req.user.orgId, req.params.id, req.params.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
 
module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  assignTask,
  unassignTask,
};