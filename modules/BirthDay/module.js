"use strict";

// @IMPORTS
const Application = require("../../lib/Application");
const Module = require("../../lib/Module");
const Promise = require("bluebird");
const Tools = require("../../lib/Tools");

module.exports = class BirthDay extends Module {
    start() {
        return new Promise(async(resolve, reject) => {
            this.log.debug("Starting...");

            this.testValue = await this.getCooldown('test');
            this.log.debug('test value birthday: ' + this.testValue);

            Application.modules.Discord.client.on('message', (msg) => {
                if (msg.author.bot) {
                    return;
                }

                if (Application.modules.Discord.isUserBlocked(msg.author.id)) {
                    return;
                }

                if (Application.modules.Discord.isMessageSent()) {
                    return;
                }

                if (msg.isMemberMentioned(Application.modules.Discord.client.user)) {
                    if (Tools.msg_contains(msg, 'today is my birthday')) {
                        if (this.getCooldown(msg.author.id)) {
                            return msg.channel.send('no!');
                        }

                        return this.birthday(msg);
                    }
                }
            });

            return resolve(this);
        });
    }

    birthday(msg) {
        msg.channel.send('Happy birthday');
        this.setCooldown(msg.author.id, 'cooldown');
    }

    setCooldown(key, value) {
        Application.module.Redis.set(key, value)
    }

    getCooldown(key) {
        return Application.modules.Redis.get(key);
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.log.debug("Stopping...");
            return resolve(this);
        })
    }
};
