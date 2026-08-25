
const { Router } = require("express");
const  authenticate  = require("../middlewares/auth.middleware");
const  requireRole  = require("../middlewares/role.middleware");
const projectController = require("../controllers/project.controller");

const router = Router();

router.use(authenticate); 

router.post("/", projectController.createProject);
router.get("/", projectController.listProjects);
router.get("/:id", projectController.getProject);
router.get("/:id/dashboard", projectController.getDashboard);
router.patch("/:id", projectController.updateProject);




router.delete("/:id", requireRole("org_admin"), projectController.deleteProject);




module.exports = router;