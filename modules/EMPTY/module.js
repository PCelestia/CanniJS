'use strict';

// @IMPORTS
// const Application = require('../../lib/Application');
const Module = require('../../lib/Module');
const Promise = require('bluebird');

module.exports = class EMPTY extends Module {
    init() {
        return new Promise(resolve => {
            this.log.debug('Initializing...');
            return resolve(this);
        });
    }

    start() {
        return new Promise(resolve => {
            this.log.debug('Starting...');
            return resolve(this);
        });
    }

    stop() {
        return new Promise(resolve => {
            this.log.debug('Stopping...');
            return resolve(this);
        });
    }
};
