/**
 * @fileoverview Redis configuration.
 * This file handles the connection and configuration for Redis.
 */

const { Redis } = require("@upstash/redis");

let redisErrorLogged = false;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

(async () => {
  try {
    await redis.ping();
    console.log("✅ Upstash Redis Connected");
    redisErrorLogged = false;
  } catch (err) {
    if (!redisErrorLogged) {
      console.error("❌ Upstash Redis Connection Error:", err.message);
      redisErrorLogged = true;
    }
  }
})();

module.exports = redis;