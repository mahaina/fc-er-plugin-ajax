'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function (require) {
    'use strict';

    var Ajax = require('./Ajax');

    var AjaxPlugin = function () {
        function AjaxPlugin(erContext, options) {
            _classCallCheck(this, AjaxPlugin);

            this.name = 'ajax';

            var ajax = new Ajax(options);
            erContext.request = ajax.request.bind(ajax);
        }

        _createClass(AjaxPlugin, null, [{
            key: 'name',
            get: function get() {
                return 'ajax';
            }
        }]);

        return AjaxPlugin;
    }();

    return AjaxPlugin;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFJLE9BQU8sTUFBUCxLQUFrQixVQUFsQixFQUE4QjtBQUFDLFFBQUksU0FBUyxRQUFRLFVBQVIsRUFBb0IsTUFBcEIsQ0FBVCxDQUFMO0NBQWxDOztBQUVBLE9BQU8sVUFBVSxPQUFWLEVBQW1CO0FBQ3RCLGlCQURzQjs7QUFHdEIsUUFBTSxPQUFPLFFBQVEsUUFBUixDQUFQLENBSGdCOztRQUtoQjtBQUNGLDRCQUFZLFNBQVosRUFBdUIsT0FBdkIsRUFBZ0M7OztBQUM1QixpQkFBSyxJQUFMLEdBQVksTUFBWixDQUQ0Qjs7QUFHNUIsZ0JBQUksT0FBTyxJQUFJLElBQUosQ0FBUyxPQUFULENBQVAsQ0FId0I7QUFJNUIsc0JBQVUsT0FBVixHQUFvQixLQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLElBQWxCLENBQXBCLENBSjRCO1NBQWhDOzs7O2dDQU9tQjtBQUNmLHVCQUFPLE1BQVAsQ0FEZTs7Ozs7UUFiRDs7QUFrQnRCLFdBQU8sVUFBUCxDQWxCc0I7Q0FBbkIsQ0FBUCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmICh0eXBlb2YgZGVmaW5lICE9PSAnZnVuY3Rpb24nKSB7dmFyIGRlZmluZSA9IHJlcXVpcmUoJ2FtZGVmaW5lJykobW9kdWxlKX1cblxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgY29uc3QgQWpheCA9IHJlcXVpcmUoJy4vQWpheCcpO1xuXG4gICAgY2xhc3MgQWpheFBsdWdpbiB7XG4gICAgICAgIGNvbnN0cnVjdG9yKGVyQ29udGV4dCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gJ2FqYXgnO1xuXG4gICAgICAgICAgICBsZXQgYWpheCA9IG5ldyBBamF4KG9wdGlvbnMpO1xuICAgICAgICAgICAgZXJDb250ZXh0LnJlcXVlc3QgPSBhamF4LnJlcXVlc3QuYmluZChhamF4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRpYyBnZXQgbmFtZSAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2FqYXgnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFqYXhQbHVnaW47XG59KTtcbiJdfQ==