if (typeof define !== 'function') {var define = require('amdefine')(module)}

define(function (require) {
    'use strict';

    return function () {
        return global.XMLHttpRequest
            ? new global.XMLHttpRequest()
            : new global.ActiveXObject('Microsoft.XMLHTTP');
    };
});
