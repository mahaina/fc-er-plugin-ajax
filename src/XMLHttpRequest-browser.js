'use strict';

module.exports = function () {
    return global.XMLHttpRequest
        ? new global.XMLHttpRequest()
        : new global.ActiveXObject('Microsoft.XMLHTTP');;
};
