const { Router } = require("express");
const authenticate = require("../middlewares/auth.middleware"); // matches your actual export (no braces)
const { getJobStatus } = require("../controllers/jobController");
 
const router = Router();
router.get("/:id", authenticate, getJobStatus);
 
module.exports = router;