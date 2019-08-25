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
                        Application.modules.Discord.setMessageSent();

                        this.getCooldown(msg.author.id).then(function (cooldown) {
                            if (cooldown !== null) {
                                return Application.modules.BirthDay.notBirthday(msg);
                            }

                            return Application.modules.BirthDay.birthday(msg);
                        });
                    }
                }
            });

            return resolve(this);
        });
    }

    notBirthday(msg) {
        msg.channel.send(Tools.parseReply(this.config.notHappyBirthdayAnswer, [msg.author]));
    }

    // @todo: set proper cooldown time.
    birthday(msg) {
        msg.channel.send(Tools.parseReply(this.config.happyBirthdayAnswer, [msg.author, Application.modules.Discord.getEmoji('bizaam')]));
        this.setCooldown(msg.author.id, 'cooldown');
    }

    setCooldown(key, value) {
        Application.modules.Redis.set(key, value)
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
