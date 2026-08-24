const { Worker } = require("bullmq");
const redisClient = require("../lib/redisClient");
const models = require("../models");
const { users: User, Task } = require("../models"); // adjust names to match your models/index.js exports
const { emailDLQ } = require("../queues/emailQueue");



async function sendMockEmail(to, subject) {

  console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);

  return { sent: true, to, subject };
}




const emailWorker = new Worker(
  "email-notifications",
  async (job) => {
    const { taskId, userId } = job.data;
 
    const [task, user] = await Promise.all([
      Task.findByPk(taskId),
      User.findByPk(userId),
    ]);
 
    if (!task || !user) {
      throw new Error(`Task or user not found: taskId=${taskId}, userId=${userId}`);
    }
 
    await sendMockEmail(user.email, `You've been assigned: ${task.title}`);
    
 
    return { emailSentTo: user.email, taskId };
  },
  { connection: redisClient, concurrency: 5 }
);
 
emailWorker.on("failed", async (job, err) => {
  console.error(
    `Job ${job.id} failed after ${job.attemptsMade} attempts:`,
    err.message
  );

  if (job.attemptsMade >= job.opts.attempts) {
    try {
      await emailDLQ.add(
        "failed-email",
        {
          originalJobId: job.id,
          ...job.data,
          failedReason: err.message,
          failedAt: new Date().toISOString(),
        },
        {
          jobId: `dlq-${job.id}`,
        }
      );

      console.log(`Job ${job.id} moved to DLQ`);
    } catch (dlqError) {
      console.error(
        `Failed to move job ${job.id} to DLQ`,
        dlqError.message
      );
    }
  }
});
 
emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});
 
module.exports = emailWorker;