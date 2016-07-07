'use strict';

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function (require) {
    'use strict';

    var XHRFactory = require('./XMLHttpRequest-browser');

    // Empty function, used as default callback
    var empty = function empty() {};

    return {
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9kZWZhdWx0U2V0dGluZ3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFJLE9BQU8sTUFBUCxLQUFrQixVQUFsQixFQUE4QjtBQUFDLFFBQUksU0FBUyxRQUFRLFVBQVIsRUFBb0IsTUFBcEIsQ0FBVCxDQUFMO0NBQWxDOztBQUVBLE9BQU8sVUFBVSxPQUFWLEVBQW1CO0FBQ3RCLGlCQURzQjs7QUFHdEIsUUFBTSxhQUFhLFFBQVEsa0JBQVIsQ0FBYjs7O0FBSGdCLFFBTWhCLFFBQVEsU0FBUixLQUFRLEdBQU0sRUFBTixDQU5ROztBQVF0QixXQUFPOztBQUVILGNBQU0sTUFBTjs7QUFFQSxvQkFBWSxLQUFaOztBQUVBLGlCQUFTLEtBQVQ7O0FBRUEsZUFBTyxLQUFQOztBQUVBLGtCQUFVLEtBQVY7O0FBRUEsaUJBQVMsSUFBVDs7QUFFQSxnQkFBUSxJQUFSOztBQUVBLGFBQUssVUFBTDs7QUFFQSxpQkFBUztBQUNMLG9CQUFRLHlDQUFSO0FBQ0Esa0JBQU0sa0JBQU47QUFDQSxpQkFBSywyQkFBTDtBQUNBLGtCQUFNLFdBQU47QUFDQSxrQkFBTSxZQUFOO1NBTEo7O0FBUUEscUJBQWEsS0FBYjs7QUFFQSxpQkFBUyxDQUFUOztBQUVBLGtCQUFVLE1BQVY7O0FBRUEsYUFBSyxjQUFMO0tBaENKLENBUnNCO0NBQW5CLENBQVAiLCJmaWxlIjoiZGVmYXVsdFNldHRpbmdzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHt2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUpfVxuXG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBjb25zdCBYSFJGYWN0b3J5ID0gcmVxdWlyZSgnLi9YTUxIdHRwUmVxdWVzdCcpO1xuXG4gICAgLy8gRW1wdHkgZnVuY3Rpb24sIHVzZWQgYXMgZGVmYXVsdCBjYWxsYmFja1xuICAgIGNvbnN0IGVtcHR5ID0gKCkgPT4ge307XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvLyBEZWZhdWx0IHR5cGUgb2YgcmVxdWVzdFxuICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgIC8vIENhbGxiYWNrIHRoYXQgaXMgZXhlY3V0ZWQgYmVmb3JlIHJlcXVlc3RcbiAgICAgICAgYmVmb3JlU2VuZDogZW1wdHksXG4gICAgICAgIC8vIENhbGxiYWNrIHRoYXQgaXMgZXhlY3V0ZWQgaWYgdGhlIHJlcXVlc3Qgc3VjY2VlZHNcbiAgICAgICAgc3VjY2VzczogZW1wdHksXG4gICAgICAgIC8vIENhbGxiYWNrIHRoYXQgaXMgZXhlY3V0ZWQgaWYgdGhlIHNlcnZlciBkcm9wcyBlcnJvclxuICAgICAgICBlcnJvcjogZW1wdHksXG4gICAgICAgIC8vIENhbGxiYWNrIHRoYXQgaXMgZXhlY3V0ZWQgb24gcmVxdWVzdCBjb21wbGV0ZSAoYm90aDogZXJyb3IgYW5kIHN1Y2Nlc3MpXG4gICAgICAgIGNvbXBsZXRlOiBlbXB0eSxcbiAgICAgICAgLy8gVGhlIGNvbnRleHQgZm9yIHRoZSBjYWxsYmFja3NcbiAgICAgICAgY29udGV4dDogbnVsbCxcbiAgICAgICAgLy8gV2hldGhlciB0byB0cmlnZ2VyIFwiZ2xvYmFsXCIgQWpheCBldmVudHNcbiAgICAgICAgZ2xvYmFsOiB0cnVlLFxuICAgICAgICAvLyBUcmFuc3BvcnRcbiAgICAgICAgeGhyOiBYSFJGYWN0b3J5LFxuICAgICAgICAvLyBNSU1FIHR5cGVzIG1hcHBpbmdcbiAgICAgICAgYWNjZXB0czoge1xuICAgICAgICAgICAgc2NyaXB0OiAndGV4dC9qYXZhc2NyaXB0LCBhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JyxcbiAgICAgICAgICAgIGpzb246ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIHhtbDogJ2FwcGxpY2F0aW9uL3htbCwgdGV4dC94bWwnLFxuICAgICAgICAgICAgaHRtbDogJ3RleHQvaHRtbCcsXG4gICAgICAgICAgICB0ZXh0OiAndGV4dC9wbGFpbidcbiAgICAgICAgfSxcbiAgICAgICAgLy8gV2hldGhlciB0aGUgcmVxdWVzdCBpcyB0byBhbm90aGVyIGRvbWFpblxuICAgICAgICBjcm9zc0RvbWFpbjogZmFsc2UsXG4gICAgICAgIC8vIERlZmF1bHQgdGltZW91dFxuICAgICAgICB0aW1lb3V0OiAwLFxuXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG5cbiAgICAgICAgdXJsOiAncmVxdWVzdC5hamF4J1xuICAgIH07XG59KTtcbiJdfQ==