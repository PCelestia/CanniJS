'use strict';

const fs = require('fs');
const Promise = require('bluebird');
const moment = require('moment');
const htmlEntities = require('html-entities');
const xmlEntities = htmlEntities.AllHtmlEntities;
const striptags = require('striptags');

module.exports = class Tools {

    constructor() {
        throw 'Cannot construct singleton';
    }

    static getConfigValueByPath(config, path, defaultValue) {
        const pathParts = path.split('.');
        let currentConfig = JSON.parse(JSON.stringify(config));
        let i;

        for (i = 0; i < pathParts.length; i++) {
            const pathPart = pathParts[i];

            if (currentConfig[pathPart]) {
                currentConfig = currentConfig[pathPart];
            }
            else {
                return defaultValue || null;
            }
        }

        return currentConfig;
    }

    static getArrayDifferences(a, b) {
        // eslint-disable-next-line prefer-const
        let diff = [];

        for (let i = 0; i < b.length; i++) {
            const bval = b[i];
            const aval = a[i];

            if (bval instanceof Object) {
                for (const key in bval) {
                    if (aval instanceof Object) {
                        if (aval[key] != bval[key]) {
                            diff.push(bval);
                            break;
                        }
                    }
                    else if (aval != bval[key]) {
                        diff.push(bval);
                        break;
                    }
                }
            }
            else if (aval != bval) {
                diff.push(bval);
                break;
            }
        }

        return diff;
    }

    static escapeForRegexp(str, delimiter) {
        if (!str) {
            return '';
        }

        str = str + '';
        return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
    }

    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static loadCommentedConfigFile(path) {
        try {
            return this.parseCommentedJson(fs.readFileSync(path));
        }
        catch (e) {
            const Application = require('./Application.js');
            Application.log.error('Error loading JSON ' + path);
        }
    }

    static parseCommentedJson(json) {
        return JSON.parse(this.minifyJson(json));
    }

    static minifyJson(json) {

        if (json instanceof Buffer) {
            json = json.toString();
        }

        try {
            if (JSON.parse(json)) {
                return json;
            }
        }
        catch (e) {
            const Application = require('./Application.js');
            Application.log.error(e);
        }

        // eslint-disable-next-line no-var
        var tokenizer = /'|(\/\*)|(\*\/)|(\/\/)|\n|\r/g,
            in_string = false,
            in_multiline_comment = false,
            in_singleline_comment = false,
            tmp, tmp2, new_str = [], ns = 0, from = 0, lc, rc
        ;

        tokenizer.lastIndex = 0;

        // eslint-disable-next-line no-cond-assign
        while (tmp = tokenizer.exec(json)) {
            lc = RegExp.leftContext;
            rc = RegExp.rightContext;
            if (!in_multiline_comment && !in_singleline_comment) {
                tmp2 = lc.substring(from);
                if (!in_string) {
                    tmp2 = tmp2.replace(/(\n|\r|\s)*/g, '');
                }
                new_str[ns++] = tmp2;
            }
            from = tokenizer.lastIndex;

            if (tmp[0] == '\'' && !in_multiline_comment && !in_singleline_comment) {
                tmp2 = lc.match(/(\\)*$/);
                // start of string with ', or unescaped ' character found to end string
                if (!in_string || !tmp2 || (tmp2[0].length % 2) == 0) {
                    in_string = !in_string;
                }
                // include ' character in next catch
                from--;
                rc = json.substring(from);
            }
            else if (tmp[0] == '/*' && !in_string && !in_multiline_comment && !in_singleline_comment) {
                in_multiline_comment = true;
            }
            else if (tmp[0] == '*/' && !in_string && in_multiline_comment && !in_singleline_comment) {
                in_multiline_comment = false;
            }
            else if (tmp[0] == '//' && !in_string && !in_multiline_comment && !in_singleline_comment) {
                in_singleline_comment = true;
            }
            else if ((tmp[0] == '\n' || tmp[0] == '\r') && !in_string && !in_multiline_comment && in_singleline_comment) {
                in_singleline_comment = false;
            }
            else if (!in_multiline_comment && !in_singleline_comment && !(/\n|\r|\s/.test(tmp[0]))) {
                new_str[ns++] = tmp[0];
            }
        }
        new_str[ns++] = rc;
        return new_str.join('');
    }

    static measureTime() {
        const start = new Date().getTime();

        return () => {
            const end = new Date().getTime();
            return end - start;
        };
    }

    static escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    }

    // eslint-disable-next-line no-unused-vars
    static pad(str, width, padChar = ' ') {
        const len = Math.max(0, width - String(str).length);
        return str + Array(len + 1).join(' ');
    }

    static padTime(num) {
        if (String(num).length == 2) {
            return String(num);
        }

        return '0' + String(num);
    }

    static isNumber(val) {
        return /^[\.0-9]+$/.test(String(val));
    }

    static formatDuration(duration) {
        // don't forget the second param
        const sec_num = parseInt(duration / 1000, 10);
        let hours = Math.floor(sec_num / 3600);
        let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        let seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours < 10) {
            hours = '0' + hours;
        }
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        return hours + ':' + minutes + ':' + seconds;
    }

    static toPrecision(value, precision) {
        precision = precision || 0;
        const power = Math.pow(10, precision);
        const absValue = Math.abs(Math.round(value * power));
        let result = (value < 0 ? '-' : '') + String(Math.floor(absValue / power));

        if (precision > 0) {
            const fraction = String(absValue % power);
            const padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
            result += '.' + padding + fraction;
        }

        return result;
    }

    static isInDate(start, end) {
        if (end.unix() === -3600 || end.unix() === 0) {
            end = moment(new Date('INVALID DATE'));
        }
        if (start.unix() === -3600 || start.unix() === 0) {
            start = moment(new Date('INVALID DATE'));
        }

        if (start.isValid() && end.isValid()) {
            return start.isBefore() && end.isAfter();
        }
        else if (start.isValid()) {
            return start.isBefore();
        }
        else if (end.isValid()) {
            return end.isAfter();
        }
        return true;
    }

    static escapeForCDATA(val, keeptags) {
        if (!val) {
            return val;
        }

        if (typeof val !== 'string') {
            val = val.toString();
        }

        val = xmlEntities.decode(val);

        if (keeptags === true) {
            return val;
        }

        return striptags(val, keeptags || []);
    }

    static parseReply(str) {
        // eslint-disable-next-line prefer-const
        let args = [].slice.call(arguments, 1), i = 0;

        try {
            return str.replace(/%s/g, () => args[0][i++]);
        }
        catch (error) {
            return str.replace(/%s/g, () => args[i++]);
        }
    }

    static getRandomIntFromInterval(min, max, fine) {
        fine = fine || false;
        if (fine) {
            return Math.random() * (max - min + 1) + min;
        }
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static chancePercent(limit, fine) {
        fine = fine || false;
        return (Tools.getRandomIntFromInterval(0, 100, fine) <= limit);
    }

    static strContainsWord(str, word) {
        str = str.replace(/[!'#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, '');
        str = str.toLowerCase();
        const wrd = word.toLowerCase();
        const wrdArray = str.split(' ');

        for (let i = 0; i < wrdArray.length; i++) {
            if (wrd === wrdArray[i]) {
                return true;
            }
        }

        return false;
    }

    static strStartsWord(str, word) {
        str = str.match(/^([\w\-]+)/g);
        return (str && str[0].toLowerCase() === word.toLowerCase());
    }

    static msg_contains(msg, text) {
        return msg.content.toLowerCase().includes(text.toLowerCase());
    }

    static msg_contains_list(msg, list) {
        let cond = false;
        const msg_contains = this.msg_contains;
        list.forEach(function(item) {
            if (msg_contains(msg, item)) cond = true;
        });
        return cond;
    }

    static msg_contains_word_list(msg, list) {
        let cond = false;
        const str = msg.content;
        const strContainsWord = this.strContainsWord;
        list.forEach(function(item) {
            if (strContainsWord(str, item)) cond = true;
        });
        return cond;
    }

    static msg_starts(msg, text) {
        return msg.content.toLowerCase().startsWith(text.toLowerCase());
    }

    static msg_starts_mentioned(msg, text) {
        const content = msg.content.toLowerCase().split('>')[1];
        if (content[0] === ' ') {
            if (content[1] === ' ') {
                return content.substring(2).startsWith(text);
            }
            return content.substring(1).startsWith(text);
        }
        return content.startsWith(text);
    }

    static get_id_from_mention(mention) {
        const tmp = mention.toString().replace(/\s/g, '');
        return tmp.substring(2, tmp.length - 1);
    }

    static getEmoji(client, type) {
        const foundEmoji = client.emojis.cache.find(emoji => emoji.name.toLowerCase() === type.toLowerCase());

        if (foundEmoji) {
            return foundEmoji;
        }
        return '';
    }

    static emoji_parser(pre, client) {
        const pre_list = pre.split(':');
        let tmp = '';
        let last_emo = false;
        pre_list.filter(Boolean).forEach(function(item) {
            if (item.includes(' ')) {
                tmp += item + ':';
                last_emo = false;
            }
            else {
                const emo = Tools.getEmoji(client, item);
                if (emo === '') {
                    tmp += item + ':';
                    last_emo = false;
                }
                else {
                    tmp = tmp.slice(0, -1);
                    tmp += emo;
                    last_emo = true;
                }
            }
        });
        if (!last_emo && pre[pre.length - 1] !== ':') {
            tmp = tmp.slice(0, -1);
        }
        return tmp;
    }

    // mention format <@name#number>
    static mention_parser(pre, guild) {
        let tmp = '';
        let tmp_pre = '';
        let status = 0;
        let content = '';

        [...pre].forEach(function(char) {
            if (status === 0) {
                if (char === '<') {
                    status = 1;
                    tmp += char;
                    content += tmp_pre;
                    tmp_pre = '';
                }
                else {
                    tmp_pre += char;
                }
            }
            else if (status === 1) {
                if (char === '>') {
                    const user = Tools.find_user_by_tag(guild, tmp.slice(2));
                    if (user !== null) {
                        status = 0;
                        content += user;
                        tmp = '';
                    }
                    else {
                        status = 0;
                        content += tmp + char;
                        tmp = '';
                    }
                }
                else {
                    tmp += char;
                }
            }
        });
        content += tmp_pre;
        content += tmp;
        return content;
    }

    static find_user_by_tag(guild, tag) {
        if (guild === null) {
            return null;
        }
        const member = guild.members.fetch(tag);
        if (member !== null) {
            return member.user;
        }
        return null;
    }

    static find_user_by_id(guild, id) {
        if (guild === null) {
            return null;
        }
        const member = guild.members.find(m => m.user.id === id);
        if (member !== null) {
            return member.user;
        }
        return null;
    }

    static test_ENV(env) {
        if (process.env[env]) {
            return true;
        }
        else {
            console.log('Warning no ENV variable called: ' + env);
            return false;
        }
    }

    static guild_by_id(client, id) {
        return client.guilds.resolve(x => x.id === id);
    }

    static loadFile(path) {
        try {
            return fs.readFileSync(path);
        }
        catch (e) {
            const Application = require('./Application.js');
            Application.log.error('Error loading File ' + path);
        }
    }

    static listSender(target, data, delay_in, parse = [], interrupt = { inter:false }) {
        return new Promise(function(resolve) {

            let delay;
            if (delay_in.length === 1) {
                delay_in = delay_in[0];
            }
            if (Array.isArray(delay_in)) {
                delay = delay_in.shift();
            }
            else {
                delay = delay_in;
            }

            const pre = data[0];
            const count = (pre.match(/%s/g) || []).length;
            const content = Tools.parseReply(pre, parse.slice(0, count));
            if (!interrupt.inter) {
                if (content === '') {
                    if (data.length > 1) {
                        setTimeout(function() {
                            Tools.listSender(target, data.slice(1), delay_in, parse.slice(count), interrupt);
                        }, delay).then(resolve);
                    }
                    else {
                        resolve();
                    }
                }
                else {
                    target.send(content).then(function() {
                        if (data.length > 1) {
                            setTimeout(function() {
                                Tools.listSender(target, data.slice(1), delay_in, parse.slice(count), interrupt).then(resolve);
                            }, delay);
                        }
                        else {
                            resolve();
                        }
                    });
                }
            }
            else {
                resolve();
            }
        });
    }

    static check_date(date, range = 0) {
        // date = (month, day)
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        if (date[0] === month) {
            if (day - range <= date[1] && date[1] <= day + range) {
                return true;
            }
        }

        return false;
    }
};
