if (typeof define !== 'function') {var define = require('amdefine')(module)}

define(function (require) {
    'use strict';

    const Ajax = require('./Ajax');

    class AjaxPlugin {
        constructor(erContext, options) {
            let ajax = new Ajax(options);
            erContext.request = ajax.request.bind(ajax);
        }

        get name () {
            return 'ajax';
        }
    }

    return AjaxPlugin;
});
