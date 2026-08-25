
const { Router } = require("express");
const  authenticate  = require("../middlewares/auth.middleware");
const taskController = require("../controllers/task.controller");

const router = Router();

router.use(authenticate); 

router.post("/", taskController.createTask);
router.get("/", taskController.listTasks);
router.get("/:id", taskController.getTask);
router.patch("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

router.post("/:id/assign", taskController.assignTask);
router.delete("/:id/assign/:userId", taskController.unassignTask);

module.exports = router;