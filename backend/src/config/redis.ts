/**
 * @fileoverview Redis configuration.
 * This file handles the connection and configuration for Redis.
 */

import { Redis } from "@upstash/redis";
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from "./env";

let redisErrorLogged = false;

const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL as string,
  token: UPSTASH_REDIS_REST_TOKEN as string,
});

(async () => {
  try {
    await redis.ping();
    console.log("✅ Upstash Redis Connected");
    redisErrorLogged = false;
  } catch (err: any) {
    if (!redisErrorLogged) {
      console.error("❌ Upstash Redis Connection Error:", err.message);
      redisErrorLogged = true;
    }
  }
})();

export default redis;
