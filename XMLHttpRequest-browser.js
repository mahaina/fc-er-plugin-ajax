'use strict';

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function (require) {
    'use strict';

    return function () {
        return global.XMLHttpRequest ? new global.XMLHttpRequest() : new global.ActiveXObject('Microsoft.XMLHTTP');
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9YTUxIdHRwUmVxdWVzdC1icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSSxPQUFPLE1BQVAsS0FBa0IsVUFBbEIsRUFBOEI7QUFBQyxRQUFJLFNBQVMsUUFBUSxVQUFSLEVBQW9CLE1BQXBCLENBQVQsQ0FBTDtDQUFsQzs7QUFFQSxPQUFPLFVBQVUsT0FBVixFQUFtQjtBQUN0QixpQkFEc0I7O0FBR3RCLFdBQU8sWUFBWTtBQUNmLGVBQU8sT0FBTyxjQUFQLEdBQ0QsSUFBSSxPQUFPLGNBQVAsRUFESCxHQUVELElBQUksT0FBTyxhQUFQLENBQXFCLG1CQUF6QixDQUZDLENBRFE7S0FBWixDQUhlO0NBQW5CLENBQVAiLCJmaWxlIjoiWE1MSHR0cFJlcXVlc3QtYnJvd3Nlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmICh0eXBlb2YgZGVmaW5lICE9PSAnZnVuY3Rpb24nKSB7dmFyIGRlZmluZSA9IHJlcXVpcmUoJ2FtZGVmaW5lJykobW9kdWxlKX1cblxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5YTUxIdHRwUmVxdWVzdFxuICAgICAgICAgICAgPyBuZXcgZ2xvYmFsLlhNTEh0dHBSZXF1ZXN0KClcbiAgICAgICAgICAgIDogbmV3IGdsb2JhbC5BY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MSFRUUCcpO1xuICAgIH07XG59KTtcbiJdfQ==