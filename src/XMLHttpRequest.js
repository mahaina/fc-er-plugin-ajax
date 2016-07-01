'use strict';

const XHR = require('xmlhttprequest');

module.exports = function () {
    return new XHR.XMLHttpRequest();
};