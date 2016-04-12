'use strict';

const Ajax = require('./src/Ajax');

class AjaxPlugin {
    static get name () {
        return 'ajax';
    }

    constructor(erContext, options) {
        let ajax = new Ajax(options);
        erContext.request = ajax.request.bind(ajax);
    }
}

module.exports = AjaxPlugin;
