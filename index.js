'use strict';

const Ajax = require('./src/Ajax');

const ajaxPlugin = {
    name: 'AjaxPlugin',

    plugErContext: (erContext, options) => {
        let ajax = new Ajax(options);
        erContext.request = ajax.request.bind(ajax);
    }
};

module.exports = ajaxPlugin;
