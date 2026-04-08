"use strict";
/**
 * @fileoverview Redis configuration.
 * This file handles the connection and configuration for Redis.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("@upstash/redis");
const env_1 = require("./env");
let redisErrorLogged = false;
const redis = new redis_1.Redis({
    url: env_1.UPSTASH_REDIS_REST_URL,
    token: env_1.UPSTASH_REDIS_REST_TOKEN,
});
(async () => {
    try {
        await redis.ping();
        console.log("✅ Upstash Redis Connected");
        redisErrorLogged = false;
    }
    catch (err) {
        if (!redisErrorLogged) {
            console.error("❌ Upstash Redis Connection Error:", err.message);
            redisErrorLogged = true;
        }
    }
})();
exports.default = redis;
