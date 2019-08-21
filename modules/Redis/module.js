"use strict";

// @IMPORTS
const Module = require("../../lib/Module");
const Promise = require("bluebird");
const Redis = require("redis");

module.exports = class CanniRedis extends Module {
    init() {
        return new Promise(async (resolve, reject) => {
            this.log.debug("Initializing...");

            this.redisConfig = this.config.redisConfig;

            if (this.redisConfig['host'].toLowerCase() === 'env') {
                this.redisConfig['host'] = process.env.REDIS_HOST;
            }

            if (this.redisConfig['port'].toLowerCase() === 'env') {
                this.redisConfig['port'] = process.env.REDIS_PORT;
            }

            Promise.promisifyAll(this.client = Redis.createClient(this.redisConfig['port'], this.redisConfig['host']));

            this.client.on('connect', () => {
                this.log.info("Canni bot connection to Redis established");
            });

            return resolve(this);
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.log.debug("Starting...");

            return resolve(this);
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.log.debug("Stopping...");

            return resolve(this);
        });
    }

    async get(key) {
        return await this.client.getAsync(key);
    }

    async set(key, value) {
        return await this.client.set(key, value);
    }
};
