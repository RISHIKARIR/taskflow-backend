const { Router } = require("express");
const authenticate = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");
const orgMemberController = require("../controllers/orgMembercontroller");


const router = Router();

router.use(authenticate);

router.get("/", requireRole("org_admin"), orgMemberController.listMembers);
router.post("/", requireRole("org_admin"), orgMemberController.addMember);
router.delete("/:userId", requireRole("org_admin"), orgMemberController.removeMember);
router.patch("/:userId/role", requireRole("org_admin"), orgMemberController.updateMemberRole);

module.exports = router;