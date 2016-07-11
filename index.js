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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFJLE9BQU8sTUFBUCxLQUFrQixVQUFsQixFQUE4QjtBQUFDLFFBQUksU0FBUyxRQUFRLFVBQVIsRUFBb0IsTUFBcEIsQ0FBVCxDQUFMO0NBQWxDOztBQUVBLE9BQU8sVUFBVSxPQUFWLEVBQW1CO0FBQ3RCLGlCQURzQjs7QUFHdEIsUUFBTSxPQUFPLFFBQVEsUUFBUixDQUFQLENBSGdCOztRQUtoQjtBQUNGLDRCQUFZLFNBQVosRUFBdUIsT0FBdkIsRUFBZ0M7OztBQUM1QixnQkFBSSxPQUFPLElBQUksSUFBSixDQUFTLE9BQVQsQ0FBUCxDQUR3QjtBQUU1QixzQkFBVSxPQUFWLEdBQW9CLEtBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsSUFBbEIsQ0FBcEIsQ0FGNEI7U0FBaEM7Ozs7Z0NBS21CO0FBQ2YsdUJBQU8sTUFBUCxDQURlOzs7OztRQVhEOztBQWdCdEIsV0FBTyxVQUFQLENBaEJzQjtDQUFuQixDQUFQIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHt2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUpfVxuXG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBjb25zdCBBamF4ID0gcmVxdWlyZSgnLi9BamF4Jyk7XG5cbiAgICBjbGFzcyBBamF4UGx1Z2luIHtcbiAgICAgICAgY29uc3RydWN0b3IoZXJDb250ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgICAgICBsZXQgYWpheCA9IG5ldyBBamF4KG9wdGlvbnMpO1xuICAgICAgICAgICAgZXJDb250ZXh0LnJlcXVlc3QgPSBhamF4LnJlcXVlc3QuYmluZChhamF4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRpYyBnZXQgbmFtZSAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2FqYXgnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFqYXhQbHVnaW47XG59KTtcbiJdfQ==