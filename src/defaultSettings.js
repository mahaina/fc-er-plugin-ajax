'use strict';

const XHRFactory = require('./XMLHttpRequest');

// Empty function, used as default callback
const empty = () => {};

module.exports = {
    // Default type of request
    type: 'POST',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed if the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: XHRFactory,
    // MIME types mapping
    accepts: {
        script: 'text/javascript, application/javascript',
        json: 'application/json',
        xml: 'application/xml, text/xml',
        html: 'text/html',
        text: 'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,

    dataType: 'json',

    url: 'request.ajax'
};
