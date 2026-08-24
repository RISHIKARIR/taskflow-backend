const { emailQueue } = require("../queues/emailQueue");
const { AppError } = require("../utils/errors");
 
async function getJobStatus(req, res, next) {
  try {
    const job = await emailQueue.getJob(req.params.id);
    if (!job) throw new AppError("Job not found", "JOB_NOT_FOUND", 404);
 
    const state = await job.getState(); // waiting|active|completed|failed|delayed
 
    const statusMap = {
      waiting: "pending",
      delayed: "pending",
      active: "active",
      completed: "completed",
      failed: "failed",
    };
 
    res.json({
      id: job.id,
      status: statusMap[state] || state,
      attemptsMade: job.attemptsMade,
      data: job.data,
      result: job.returnvalue || null,
      failedReason: job.failedReason || null,
      timestamp: job.timestamp,
    });
  } catch (err) {
    next(err);
  }
}
 
module.exports = { getJobStatus };