const { Queue } = require("bullmq");
const redisClient = require("../lib/redisClient");
 
const emailQueue = new Queue("email-notifications", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 }, // 1s -> 2s -> 4s
    removeOnComplete: 100,
    removeOnFail: false, // keep failed jobs = dead-letter queue
  },
});
 
async function enqueueAssignmentEmail(taskId, userId, assignedByUserId) {
  return emailQueue.add("send-assignment-email", {
    taskId,
    userId,
    assignedByUserId,
    enqueuedAt: new Date().toISOString(),
  });
}
 
module.exports = { emailQueue, enqueueAssignmentEmail };