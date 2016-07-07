if (typeof define !== 'function') {var define = require('amdefine')(module)}

define(function (require) {
    'use strict';

    const XHR = require('xmlhttprequest');

    return function () {
        return new XHR.XMLHttpRequest();
    };
});
