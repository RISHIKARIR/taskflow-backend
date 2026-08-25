const { Queue } = require("bullmq");
const redisClient = require("../lib/redisClient");
 
const emailQueue = new Queue("email-notifications", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 }, 
    removeOnComplete: 100,
    removeOnFail: false, 
  },
});
 

const emailDLQ = new Queue("email-notifications-dlq", {
  connection: redisClient,
});



async function enqueueAssignmentEmail(taskId, userId, assignedByUserId) {
  return emailQueue.add("send-assignment-email", {
    taskId,
    userId,
    assignedByUserId,
    enqueuedAt: new Date().toISOString(),
  });
}
 
module.exports = { emailQueue, enqueueAssignmentEmail,emailDLQ };