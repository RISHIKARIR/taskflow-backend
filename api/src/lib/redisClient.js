const Redis = require("ioredis");
 
const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, 
});
 
module.exports = redisClient;