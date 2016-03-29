'use strict';

const Ajax = require('./src/Ajax');

const ajaxPlugin = {
    name: 'AjaxPlugin',

    plugErContext: (options, erContext) => {
        options = options || {};
        let userid = options.userid || '';
        let token = options.token || '';
        let baseUrl = options.baseUrl || '';

        let ajax = new Ajax(baseUrl, {userid, token})

        erContext.request = ajax.request.bind(ajax);
    }
};

module.exports = ajaxPlugin;
