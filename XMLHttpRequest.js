'use strict';

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function (require) {
    'use strict';

    var XHR = require('xmlhttprequest');

    return function () {
        return new XHR.XMLHttpRequest();
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9YTUxIdHRwUmVxdWVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLElBQUksT0FBTyxNQUFQLEtBQWtCLFVBQWxCLEVBQThCO0FBQUMsUUFBSSxTQUFTLFFBQVEsVUFBUixFQUFvQixNQUFwQixDQUFULENBQUw7Q0FBbEM7O0FBRUEsT0FBTyxVQUFVLE9BQVYsRUFBbUI7QUFDdEIsaUJBRHNCOztBQUd0QixRQUFNLE1BQU0sUUFBUSxnQkFBUixDQUFOLENBSGdCOztBQUt0QixXQUFPLFlBQVk7QUFDZixlQUFPLElBQUksSUFBSSxjQUFKLEVBQVgsQ0FEZTtLQUFaLENBTGU7Q0FBbkIsQ0FBUCIsImZpbGUiOiJYTUxIdHRwUmVxdWVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmICh0eXBlb2YgZGVmaW5lICE9PSAnZnVuY3Rpb24nKSB7dmFyIGRlZmluZSA9IHJlcXVpcmUoJ2FtZGVmaW5lJykobW9kdWxlKX1cblxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgY29uc3QgWEhSID0gcmVxdWlyZSgneG1saHR0cHJlcXVlc3QnKTtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgWEhSLlhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgfTtcbn0pO1xuIl19