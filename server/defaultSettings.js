if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function (require) {
    'use strict';

    var XHRFactory = require('./XMLHttpRequest');

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9kZWZhdWx0U2V0dGluZ3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxPQUFPLE1BQVAsS0FBa0IsVUFBbEIsRUFBOEI7QUFBQyxRQUFJLFNBQVMsUUFBUSxVQUFSLEVBQW9CLE1BQXBCLENBQVQsQ0FBTDtDQUFsQzs7QUFFQSxPQUFPLFVBQVUsT0FBVixFQUFtQjtBQUN0QixpQkFEc0I7O0FBR3RCLFFBQU0sYUFBYSxRQUFRLGtCQUFSLENBQWI7OztBQUhnQixRQU1oQixRQUFRLFNBQVIsS0FBUSxHQUFNLEVBQU4sQ0FOUTs7QUFRdEIsV0FBTzs7QUFFSCxjQUFNLE1BQU47O0FBRUEsb0JBQVksS0FBWjs7QUFFQSxpQkFBUyxLQUFUOztBQUVBLGVBQU8sS0FBUDs7QUFFQSxrQkFBVSxLQUFWOztBQUVBLGlCQUFTLElBQVQ7O0FBRUEsZ0JBQVEsSUFBUjs7QUFFQSxhQUFLLFVBQUw7O0FBRUEsaUJBQVM7QUFDTCxvQkFBUSx5Q0FBUjtBQUNBLGtCQUFNLGtCQUFOO0FBQ0EsaUJBQUssMkJBQUw7QUFDQSxrQkFBTSxXQUFOO0FBQ0Esa0JBQU0sWUFBTjtTQUxKOztBQVFBLHFCQUFhLEtBQWI7O0FBRUEsaUJBQVMsQ0FBVDs7QUFFQSxrQkFBVSxNQUFWOztBQUVBLGFBQUssY0FBTDtLQWhDSixDQVJzQjtDQUFuQixDQUFQIiwiZmlsZSI6ImRlZmF1bHRTZXR0aW5ncy5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmICh0eXBlb2YgZGVmaW5lICE9PSAnZnVuY3Rpb24nKSB7dmFyIGRlZmluZSA9IHJlcXVpcmUoJ2FtZGVmaW5lJykobW9kdWxlKX1cblxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgY29uc3QgWEhSRmFjdG9yeSA9IHJlcXVpcmUoJy4vWE1MSHR0cFJlcXVlc3QnKTtcblxuICAgIC8vIEVtcHR5IGZ1bmN0aW9uLCB1c2VkIGFzIGRlZmF1bHQgY2FsbGJhY2tcbiAgICBjb25zdCBlbXB0eSA9ICgpID0+IHt9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLy8gRGVmYXVsdCB0eXBlIG9mIHJlcXVlc3RcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAvLyBDYWxsYmFjayB0aGF0IGlzIGV4ZWN1dGVkIGJlZm9yZSByZXF1ZXN0XG4gICAgICAgIGJlZm9yZVNlbmQ6IGVtcHR5LFxuICAgICAgICAvLyBDYWxsYmFjayB0aGF0IGlzIGV4ZWN1dGVkIGlmIHRoZSByZXF1ZXN0IHN1Y2NlZWRzXG4gICAgICAgIHN1Y2Nlc3M6IGVtcHR5LFxuICAgICAgICAvLyBDYWxsYmFjayB0aGF0IGlzIGV4ZWN1dGVkIGlmIHRoZSBzZXJ2ZXIgZHJvcHMgZXJyb3JcbiAgICAgICAgZXJyb3I6IGVtcHR5LFxuICAgICAgICAvLyBDYWxsYmFjayB0aGF0IGlzIGV4ZWN1dGVkIG9uIHJlcXVlc3QgY29tcGxldGUgKGJvdGg6IGVycm9yIGFuZCBzdWNjZXNzKVxuICAgICAgICBjb21wbGV0ZTogZW1wdHksXG4gICAgICAgIC8vIFRoZSBjb250ZXh0IGZvciB0aGUgY2FsbGJhY2tzXG4gICAgICAgIGNvbnRleHQ6IG51bGwsXG4gICAgICAgIC8vIFdoZXRoZXIgdG8gdHJpZ2dlciBcImdsb2JhbFwiIEFqYXggZXZlbnRzXG4gICAgICAgIGdsb2JhbDogdHJ1ZSxcbiAgICAgICAgLy8gVHJhbnNwb3J0XG4gICAgICAgIHhocjogWEhSRmFjdG9yeSxcbiAgICAgICAgLy8gTUlNRSB0eXBlcyBtYXBwaW5nXG4gICAgICAgIGFjY2VwdHM6IHtcbiAgICAgICAgICAgIHNjcmlwdDogJ3RleHQvamF2YXNjcmlwdCwgYXBwbGljYXRpb24vamF2YXNjcmlwdCcsXG4gICAgICAgICAgICBqc29uOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICB4bWw6ICdhcHBsaWNhdGlvbi94bWwsIHRleHQveG1sJyxcbiAgICAgICAgICAgIGh0bWw6ICd0ZXh0L2h0bWwnLFxuICAgICAgICAgICAgdGV4dDogJ3RleHQvcGxhaW4nXG4gICAgICAgIH0sXG4gICAgICAgIC8vIFdoZXRoZXIgdGhlIHJlcXVlc3QgaXMgdG8gYW5vdGhlciBkb21haW5cbiAgICAgICAgY3Jvc3NEb21haW46IGZhbHNlLFxuICAgICAgICAvLyBEZWZhdWx0IHRpbWVvdXRcbiAgICAgICAgdGltZW91dDogMCxcblxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuXG4gICAgICAgIHVybDogJ3JlcXVlc3QuYWpheCdcbiAgICB9O1xufSk7XG4iXX0=