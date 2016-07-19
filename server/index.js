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

            var ajax = new Ajax(options);
            erContext.request = ajax.request.bind(ajax);
        }

        _createClass(AjaxPlugin, [{
            key: 'name',
            get: function get() {
                return 'ajax';
            }
        }]);

        return AjaxPlugin;
    }();

    return AjaxPlugin;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsSUFBSSxPQUFPLE1BQVAsS0FBa0IsVUFBbEIsRUFBOEI7QUFBQyxRQUFJLFNBQVMsUUFBUSxVQUFSLEVBQW9CLE1BQXBCLENBQVQsQ0FBTDtDQUFsQzs7QUFFQSxPQUFPLFVBQVUsT0FBVixFQUFtQjtBQUN0QixpQkFEc0I7O0FBR3RCLFFBQU0sT0FBTyxRQUFRLFFBQVIsQ0FBUCxDQUhnQjs7UUFLaEI7QUFDRiw0QkFBWSxTQUFaLEVBQXVCLE9BQXZCLEVBQWdDOzs7QUFDNUIsZ0JBQUksT0FBTyxJQUFJLElBQUosQ0FBUyxPQUFULENBQVAsQ0FEd0I7QUFFNUIsc0JBQVUsT0FBVixHQUFvQixLQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLElBQWxCLENBQXBCLENBRjRCO1NBQWhDOzs7O2dDQUtZO0FBQ1IsdUJBQU8sTUFBUCxDQURROzs7OztRQVhNOztBQWdCdEIsV0FBTyxVQUFQLENBaEJzQjtDQUFuQixDQUFQIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHt2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUpfVxuXG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBjb25zdCBBamF4ID0gcmVxdWlyZSgnLi9BamF4Jyk7XG5cbiAgICBjbGFzcyBBamF4UGx1Z2luIHtcbiAgICAgICAgY29uc3RydWN0b3IoZXJDb250ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgICAgICBsZXQgYWpheCA9IG5ldyBBamF4KG9wdGlvbnMpO1xuICAgICAgICAgICAgZXJDb250ZXh0LnJlcXVlc3QgPSBhamF4LnJlcXVlc3QuYmluZChhamF4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldCBuYW1lICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnYWpheCc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gQWpheFBsdWdpbjtcbn0pO1xuIl19