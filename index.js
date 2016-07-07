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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFJLE9BQU8sTUFBUCxLQUFrQixVQUFsQixFQUE4QjtBQUFDLFFBQUksU0FBUyxRQUFRLFVBQVIsRUFBb0IsTUFBcEIsQ0FBVCxDQUFMO0NBQWxDOztBQUVBLE9BQU8sVUFBVSxPQUFWLEVBQW1CO0FBQ3RCLGlCQURzQjs7QUFHdEIsUUFBTSxPQUFPLFFBQVEsUUFBUixDQUFQLENBSGdCOztRQUtoQjtBQUNGLDRCQUFZLFNBQVosRUFBdUIsT0FBdkIsRUFBZ0M7OztBQUM1QixnQkFBSSxPQUFPLElBQUksSUFBSixDQUFTLE9BQVQsQ0FBUCxDQUR3QjtBQUU1QixzQkFBVSxPQUFWLEdBQW9CLEtBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsSUFBbEIsQ0FBcEIsQ0FGNEI7U0FBaEM7Ozs7Z0NBS1k7QUFDUix1QkFBTyxNQUFQLENBRFE7Ozs7O1FBWE07O0FBZ0J0QixXQUFPLFVBQVAsQ0FoQnNCO0NBQW5CLENBQVAiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpZiAodHlwZW9mIGRlZmluZSAhPT0gJ2Z1bmN0aW9uJykge3ZhciBkZWZpbmUgPSByZXF1aXJlKCdhbWRlZmluZScpKG1vZHVsZSl9XG5cbmRlZmluZShmdW5jdGlvbiAocmVxdWlyZSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGNvbnN0IEFqYXggPSByZXF1aXJlKCcuL0FqYXgnKTtcblxuICAgIGNsYXNzIEFqYXhQbHVnaW4ge1xuICAgICAgICBjb25zdHJ1Y3RvcihlckNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGxldCBhamF4ID0gbmV3IEFqYXgob3B0aW9ucyk7XG4gICAgICAgICAgICBlckNvbnRleHQucmVxdWVzdCA9IGFqYXgucmVxdWVzdC5iaW5kKGFqYXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IG5hbWUgKCkge1xuICAgICAgICAgICAgcmV0dXJuICdhamF4JztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBBamF4UGx1Z2luO1xufSk7XG4iXX0=