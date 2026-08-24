// src/routes/projectRoutes.js
const { Router } = require("express");
const  authenticate  = require("../middlewares/auth.middleware");
const  requireRole  = require("../middlewares/role.middleware");
const projectController = require("../controllers/project.controller");

const router = Router();

router.use(authenticate); // sab routes protected

router.post("/", projectController.createProject);
router.get("/", projectController.listProjects);
router.get("/:id", projectController.getProject);
router.get("/:id/dashboard", projectController.getDashboard);
router.patch("/:id", projectController.updateProject);

// sirf org_admin delete kar sakta hai
router.delete("/:id", requireRole("org_admin"), projectController.deleteProject);

module.exports = router;