'use strict';

const Ajax = require('./src/Ajax');

class AjaxPlugin {
    constructor(erContext, options) {
        let ajax = new Ajax(options);
        erContext.request = ajax.request.bind(ajax);
    }

    get name () {
        return 'ajax';
    }
}

module.exports = AjaxPlugin;
