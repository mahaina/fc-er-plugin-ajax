'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function (require) {
    'use strict';

    var defaultSettings = require('./defaultSettings');

    var _ = require('underscore');
    var status = require('./status');
    var jsonType = 'application/json';
    var htmlType = 'text/html';
    var blankRE = /^\s*$/;
    var scriptTypeRE = /^(?:text|application)\/javascript/i;
    var xmlTypeRE = /^(?:text|application)\/xml/i;
    var Deferred = require('fc-er/Deferred');

    var appendQuery = function appendQuery(url, query) {
        return (url + '&' + query).replace(/[&?]{1,2}/, '?');
    };

    var mimeToDataType = function mimeToDataType(mime) {
        return mime && (mime === htmlType ? 'html' : mime === jsonType ? 'json' : scriptTypeRE.test(mime) ? 'script' : xmlTypeRE.test(mime) && 'xml') || 'text';
    };

    var stripTailPathPartition = function stripTailPathPartition(path) {
        var tailSlashIndex = path.lastIndexOf('/');
        if (tailSlashIndex === -1) {
            return null;
        }
        return path.substring(0, tailSlashIndex);
    };

    var sanityPath = function sanityPath(url) {
        var hashSeparatorIndex = url.lastIndexOf('#');
        if (hashSeparatorIndex >= 0) {
            url = url.substring(0, hashSeparatorIndex);
        }
        var searchSeparatorIndex = url.lastIndexOf('?');
        if (searchSeparatorIndex >= 0) {
            url = url.substring(0, searchSeparatorIndex);
        }

        var lastSlashIndex = url.lastIndexOf('/');
        if (lastSlashIndex >= 0) {
            url = url.substring(0, lastSlashIndex);
        }

        return url;
    };

    var urlResolve = function urlResolve(source, relative) {
        var orginalSource = source;
        source = sanityPath(source);

        var match = source.match(/(https?:\/\/)?(.*)/);
        var protocol = match && match[1] || '';
        var path = match && match[2] || '';

        var relativeArr = relative.split('/');
        for (var i = 0, len = relativeArr.length; i < len; i++) {
            switch (relativeArr[i]) {
                case '..':
                    if ((path = stripTailPathPartition(path)) == null) {
                        return orginalSource;
                    }
                    break;
                case '.':
                    break;
                default:
                    path = path + '/' + relativeArr[i];
                    break;
            }
        }
        return '' + protocol + path;
    };

    // serialize payload and append it to the URL for GET requests
    var serializeData = function serializeData(options) {
        if (options.data && _typeof(options.data) === 'object') {
            options.data = param(options.data);
        }
        if (options.data && (!options.type || options.type.toUpperCase() === 'GET')) {
            options.url = appendQuery(options.url, options.data);
        }
    };

    var param = function param(obj) {
        var params = [];
        params.add = function (k, v) {
            this.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
        };
        serialize(params, obj);

        return params.join('&').replace('%20', '+');
    };

    var serialize = function serialize(params, obj, scope) {
        var isArray = _.isArray(obj);
        for (var key in obj) {
            var value = obj[key];
            if (scope) {
                key = isArray ? scope : scope + '.' + key;
            }
            if (!scope && isArray) {
                params.add(value.name, value.value);
            } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
                serialize(params, value, key);
            } else {
                params.add(key, value);
            }
        }
    };

    var request = function request(options) {
        var settings = _.extend({}, defaultSettings, options || {});

        ajaxStart(settings);

        if (!settings.url) {
            throw new Error('setting url is undefined');
        }

        if (settings.baseUrl) {
            settings.url = urlResolve(settings.baseUrl, settings.url);
        }
        settings.url = appendQuery(settings.url, 'path=' + options.path);
        settings.url = appendQuery(settings.url, param(settings.urlParams));

        var dataType = settings.dataType;
        var hasPlaceholder = /=\?/.test(settings.url);
        if (dataType === 'jsonp' || hasPlaceholder) {
            if (!hasPlaceholder) {
                settings.url = appendQuery(settings.url, 'callback=?');
            }
            return ajax.JSONP(settings);
        }

        serializeData(settings);

        var mime = settings.accepts[dataType];
        var baseHeads = {};
        var protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : 'http';
        var xhr = settings.xhr();
        xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
        var abortTimeout = void 0;

        if (!settings.crossDomain) {
            baseHeads['X-Requested-With'] = 'XMLHttpRequest';
        }
        if (mime) {
            baseHeads['Accept'] = mime;
            if (mime.indexOf(',') > -1) {
                mime = mime.split(',', 2)[0];
            }
            xhr.overrideMimeType && xhr.overrideMimeType(mime);
        }
        if (settings.contentType || settings.data && settings.type.toUpperCase() !== 'Get') {
            baseHeads['Content-Type'] = settings.contentType || 'application/x-www-form-urlencoded';
        }
        settings.headers = _.extend(baseHeads, settings.headers || {});

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                clearTimeout(abortTimeout);
                var result = void 0;
                var error = false;
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304 || xhr.status === 0 && protocol === 'file:') {
                    dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'));
                    result = xhr.responseText;

                    try {
                        if (dataType === 'script') {
                            (1, eval)(result);
                        } else if (dataType === 'xml') {
                            result = xhr.responseXML;
                        } else if (dataType === 'json') {
                            result = blankRE.test(result) ? null : JSON.parse(result);
                        }
                    } catch (e) {
                        error = e;
                    }

                    if (error) {
                        ajaxError(error, 'parsererror', xhr, settings);
                    } else {
                        ajaxSuccess(result, xhr, settings);
                    }
                } else {
                    ajaxError(null, 'error', xhr, settings);
                }
            }
        };

        var async = 'async' in settings ? settings.async : true;
        xhr.open(settings.type, settings.url, async);

        for (var name in settings.headers) {
            xhr.setRequestHeader(name, settings.headers[name]);
        }

        if (ajaxBeforeSend(xhr, settings) === false) {
            xhr.abort();
            return false;
        }

        if (settings.timeout > 0) {
            abortTimeout = setTimeout(function () {
                xhr.onreadystatechange = function () {};
                xhr.abort();
                ajaxError(null, 'timeout', xhr, settings);
            }, settings.timeout);
        }

        // avoid sending empty string
        xhr.send(settings.data ? settings.data : null);
        return xhr;
    };

    var ajax = {};

    ajax.request = request;

    ajax.get = function (url, success) {
        return request({ url: url, success: success });
    };

    ajax.post = function (url, data, success, dataType) {
        if (typeof data === 'function') {
            dataType = dataType || success;
            success = data;
            data = null;
        }
        return request({
            type: 'POST',
            url: url,
            data: data,
            success: success,
            dataType: dataType
        });
    };

    ajax.getJSON = function (url, success) {
        return request({ url: url, success: success, dataType: 'json' });
    };

    // hooks start
    ajax.active = 0;

    // trigger a custom event and return false if it was cancelled
    var triggerAndReturn = function triggerAndReturn(context, eventName, data) {
        // todo: Fire off some events
        return true;
    };

    // trigger an Ajax "global" event
    var triggerGlobal = function triggerGlobal(settings, context, eventName, data) {
        if (settings.global) {
            return triggerAndReturn(context || global.document, eventName, data);
        }
    };

    var ajaxStart = function ajaxStart(settings) {
        if (settings.global && ajax.active++ === 0) {
            triggerGlobal(settings, null, 'ajaxStart');
        }
    };

    var ajaxStop = function ajaxStop(settings) {
        if (settings.global && ! --ajax.active) {
            triggerGlobal(settings, null, 'ajaxStop');
        }
    };

    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    var ajaxBeforeSend = function ajaxBeforeSend(xhr, settings) {
        var context = settings.context;
        if (settings.beforeSend.call(context, xhr, settings) === false || triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false) {
            return false;
        }
        triggerGlobal(settings, context, 'ajaxSend', [xhr, settings]);
    };

    var ajaxSuccess = function ajaxSuccess(data, xhr, settings) {
        var context = settings.context;
        var status = 'success';
        settings.success.call(context, data, status, xhr);
        triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data]);
        ajaxComplete(status, xhr, settings);
    };

    // type: "timeout", "error", "abort", "parseerror"
    var ajaxError = function ajaxError(error, type, xhr, settings) {
        var context = settings.context;
        settings.error.call(context, xhr, type, error);
        triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error]);
        ajaxComplete(type, xhr, settings);
    };

    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    var ajaxComplete = function ajaxComplete(status, xhr, settings) {
        var context = settings.context;
        settings.complete.call(context, xhr, status);
        triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings]);
        ajaxStop(settings);
    };
    // hooks end

    var rand16Num = function rand16Num(len) {
        len = len || 0;
        var results = [];
        for (var i = 0; i < len; i++) {
            results.push('0123456789abcdef'.charAt(Math.floor(Math.random() * 16)));
        }
        return results.join('');
    };

    var uid = function uid() {
        return [new Date().valueOf().toString(), rand16Num(4)].join('');
    };

    var guid = function guid() {
        var curr = new Date().valueOf().toString();
        return ['4b534c46', rand16Num(4), '4' + rand16Num(3), rand16Num(4), curr.substring(0, 12)].join('-');
    };

    var adjustOptions = function adjustOptions(path, params, options) {
        options = options || {};

        var userid = options.userid || '';
        var token = options.token || '';
        var reqId = options.reqId || uid();
        var eventId = options.eventId || guid();
        var secret = options.secret;
        var source = options.source;

        params = JSON.stringify(params || {});

        var data = { reqId: reqId, userid: userid, token: token, path: path, eventId: eventId, params: params };
        secret && (data.secret = secret);
        source && (data.source = source);

        var urlParams = { reqId: reqId };

        var omitNames = ['userid', 'token', 'reqId', 'eventId', 'secret', 'source'];
        var otherOptions = _.omit(options, omitNames);

        return _.extend(otherOptions, { path: path, data: data, urlParams: urlParams });
    };

    var getRedirectUrl = function getRedirectUrl(baseUrl) {
        if (baseUrl == null) {
            baseUrl = global.location.href;
        }

        var querySeparatorIndex = baseUrl.indexOf('?');
        var search = querySeparatorIndex === -1 ? '' : baseUrl.substring(querySeparatorIndex);

        return urlResolve(baseUrl, 'main.do') + search;
    };

    var Ajax = function () {
        function Ajax(globalOptions) {
            _classCallCheck(this, Ajax);

            this.globalOptions = globalOptions || {};
        }

        _createClass(Ajax, [{
            key: 'request',
            value: function request(path, params, options) {
                options = _.extend({}, this.globalOptions, options);
                var ajaxOptions = adjustOptions(path, params, options);

                var d = new Deferred();
                ajaxOptions.success = d.resolver.resolve;
                ajaxOptions.error = d.resolver.reject;

                var p = d.promise;

                ajax.request(ajaxOptions);

                return p.then(function (response) {
                    // 如果是转向行为，直接转向，整体转为reject
                    if (_.isObject(response) && response.redirect) {
                        throw {
                            status: status.REQ_CODE.REDIRECT,
                            desc: status.REQ_CODE_DESC.REDIRECT,
                            redirecturl: response.redirecturl || getRedirectUrl(options.baseUrl),
                            response: response
                        };
                    }
                    return response;
                }, function (error) {
                    var httpStatus = error.status;

                    if (httpStatus === 408) {
                        throw {
                            status: status.REQ_CODE.TIMEOUT,
                            desc: status.REQ_CODE_DESC.TIMEOUT,
                            response: null
                        };
                    }

                    if (httpStatus < 200 || httpStatus >= 300 && httpStatus !== 304) {
                        throw {
                            httpStatus: httpStatus,
                            status: status.REQ_CODE.REQUEST_ERROR,
                            desc: status.REQ_CODE_DESC.REQUEST_ERROR,
                            response: null
                        };
                    }

                    throw {
                        httpStatus: httpStatus,
                        status: status.REQ_CODE.REQUEST_ERROR,
                        desc: status.REQ_CODE_DESC.REQUEST_ERROR,
                        error: JSON.stringify(error.error),
                        response: null
                    };
                });
            }
        }]);

        return Ajax;
    }();

    return Ajax;
});
//# sourceMappingURL=data:application/json;base64,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LElBQXdCLGVBQWUsUUFBUSxPQUFSLENBQXZDO0FBQ2Isc0NBQVUsUUFBVjt5QkFKSixDQUQyQztxQkFBL0M7QUFRQSwyQkFBTyxRQUFQLENBVndCO2lCQUFkLEVBV1gsVUFBQyxLQUFELEVBQVc7QUFDVix3QkFBTSxhQUFhLE1BQU0sTUFBTixDQURUOztBQUdWLHdCQUFJLGVBQWUsR0FBZixFQUFvQjtBQUNwQiw4QkFBTTtBQUNGLG9DQUFRLE9BQU8sUUFBUCxDQUFnQixPQUFoQjtBQUNSLGtDQUFNLE9BQU8sYUFBUCxDQUFxQixPQUFyQjtBQUNOLHNDQUFVLElBQVY7eUJBSEosQ0FEb0I7cUJBQXhCOztBQVFBLHdCQUFJLGFBQWEsR0FBYixJQUFxQixjQUFjLEdBQWQsSUFBcUIsZUFBZSxHQUFmLEVBQXFCO0FBQy9ELDhCQUFNO0FBQ0Ysd0NBQVksVUFBWjtBQUNBLG9DQUFRLE9BQU8sUUFBUCxDQUFnQixhQUFoQjtBQUNSLGtDQUFNLE9BQU8sYUFBUCxDQUFxQixhQUFyQjtBQUNOLHNDQUFVLElBQVY7eUJBSkosQ0FEK0Q7cUJBQW5FOztBQVNBLDBCQUFNO0FBQ0Ysb0NBQVksVUFBWjtBQUNBLGdDQUFRLE9BQU8sUUFBUCxDQUFnQixhQUFoQjtBQUNSLDhCQUFNLE9BQU8sYUFBUCxDQUFxQixhQUFyQjtBQUNOLCtCQUFPLEtBQUssU0FBTCxDQUFlLE1BQU0sS0FBTixDQUF0QjtBQUNBLGtDQUFVLElBQVY7cUJBTEosQ0FwQlU7aUJBQVgsQ0FYSCxDQVoyQjs7Ozs7UUF2WGI7O0FBNmF0QixXQUFPLElBQVAsQ0E3YXNCO0NBQW5CLENBQVAiLCJmaWxlIjoiQWpheC5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmICh0eXBlb2YgZGVmaW5lICE9PSAnZnVuY3Rpb24nKSB7dmFyIGRlZmluZSA9IHJlcXVpcmUoJ2FtZGVmaW5lJykobW9kdWxlKX1cblxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgY29uc3QgZGVmYXVsdFNldHRpbmdzID0gcmVxdWlyZSgnLi9kZWZhdWx0U2V0dGluZ3MnKTtcblxuICAgIGNvbnN0IF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG4gICAgY29uc3Qgc3RhdHVzID0gcmVxdWlyZSgnLi9zdGF0dXMnKTtcbiAgICBjb25zdCBqc29uVHlwZSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICBjb25zdCBodG1sVHlwZSA9ICd0ZXh0L2h0bWwnO1xuICAgIGNvbnN0IGJsYW5rUkUgPSAvXlxccyokLztcbiAgICBjb25zdCBzY3JpcHRUeXBlUkUgPSAvXig/OnRleHR8YXBwbGljYXRpb24pXFwvamF2YXNjcmlwdC9pO1xuICAgIGNvbnN0IHhtbFR5cGVSRSA9IC9eKD86dGV4dHxhcHBsaWNhdGlvbilcXC94bWwvaTtcbiAgICBjb25zdCBEZWZlcnJlZCA9IHJlcXVpcmUoJ2ZjLWVyL0RlZmVycmVkJyk7XG5cbiAgICBjb25zdCBhcHBlbmRRdWVyeSA9ICh1cmwsIHF1ZXJ5KSA9PiAoXG4gICAgICAgICh1cmwgKyAnJicgKyBxdWVyeSkucmVwbGFjZSgvWyY/XXsxLDJ9LywgJz8nKVxuICAgICk7XG5cbiAgICBjb25zdCBtaW1lVG9EYXRhVHlwZSA9IChtaW1lKSA9PiAoXG4gICAgICAgIG1pbWUgJiYgKG1pbWUgPT09IGh0bWxUeXBlID8gJ2h0bWwnIDpcbiAgICAgICAgICAgIG1pbWUgPT09IGpzb25UeXBlID8gJ2pzb24nIDpcbiAgICAgICAgICAgICAgICBzY3JpcHRUeXBlUkUudGVzdChtaW1lKSA/ICdzY3JpcHQnIDpcbiAgICAgICAgICAgICAgICB4bWxUeXBlUkUudGVzdChtaW1lKSAmJiAneG1sJykgfHwgJ3RleHQnXG4gICAgKTtcblxuICAgIGNvbnN0IHN0cmlwVGFpbFBhdGhQYXJ0aXRpb24gPSAocGF0aCkgPT4ge1xuICAgICAgICBjb25zdCB0YWlsU2xhc2hJbmRleCA9IHBhdGgubGFzdEluZGV4T2YoJy8nKTtcbiAgICAgICAgaWYgKHRhaWxTbGFzaEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGguc3Vic3RyaW5nKDAsIHRhaWxTbGFzaEluZGV4KTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc2FuaXR5UGF0aCA9ICh1cmwpID0+IHtcbiAgICAgICAgY29uc3QgaGFzaFNlcGFyYXRvckluZGV4ID0gdXJsLmxhc3RJbmRleE9mKCcjJyk7XG4gICAgICAgIGlmIChoYXNoU2VwYXJhdG9ySW5kZXggPj0gMCkge1xuICAgICAgICAgICAgdXJsID0gdXJsLnN1YnN0cmluZygwLCBoYXNoU2VwYXJhdG9ySW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNlYXJjaFNlcGFyYXRvckluZGV4ID0gdXJsLmxhc3RJbmRleE9mKCc/Jyk7XG4gICAgICAgIGlmIChzZWFyY2hTZXBhcmF0b3JJbmRleCA+PSAwKSB7XG4gICAgICAgICAgICB1cmwgPSB1cmwuc3Vic3RyaW5nKDAsIHNlYXJjaFNlcGFyYXRvckluZGV4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxhc3RTbGFzaEluZGV4ID0gdXJsLmxhc3RJbmRleE9mKCcvJyk7XG4gICAgICAgIGlmIChsYXN0U2xhc2hJbmRleCA+PSAwKSB7XG4gICAgICAgICAgICB1cmwgPSB1cmwuc3Vic3RyaW5nKDAsIGxhc3RTbGFzaEluZGV4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfTtcblxuICAgIGNvbnN0IHVybFJlc29sdmUgPSAoc291cmNlLCByZWxhdGl2ZSkgPT4ge1xuICAgICAgICBjb25zdCBvcmdpbmFsU291cmNlID0gc291cmNlO1xuICAgICAgICBzb3VyY2UgPSBzYW5pdHlQYXRoKHNvdXJjZSk7XG5cbiAgICAgICAgY29uc3QgbWF0Y2ggPSBzb3VyY2UubWF0Y2goLyhodHRwcz86XFwvXFwvKT8oLiopLyk7XG4gICAgICAgIGNvbnN0IHByb3RvY29sID0gKG1hdGNoICYmIG1hdGNoWzFdKSB8fCAnJztcbiAgICAgICAgbGV0IHBhdGggPSAobWF0Y2ggJiYgbWF0Y2hbMl0pIHx8ICcnO1xuXG4gICAgICAgIGNvbnN0IHJlbGF0aXZlQXJyID0gcmVsYXRpdmUuc3BsaXQoJy8nKVxuICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gcmVsYXRpdmVBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHN3aXRjaCAocmVsYXRpdmVBcnJbaV0pIHtcbiAgICAgICAgICAgICAgICBjYXNlICcuLic6XG4gICAgICAgICAgICAgICAgICAgIGlmICgocGF0aCA9IHN0cmlwVGFpbFBhdGhQYXJ0aXRpb24ocGF0aCkpID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvcmdpbmFsU291cmNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJy4nOlxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBwYXRoID0gYCR7cGF0aH0vJHtyZWxhdGl2ZUFycltpXX1gO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7cHJvdG9jb2x9JHtwYXRofWA7XG4gICAgfTtcblxuLy8gc2VyaWFsaXplIHBheWxvYWQgYW5kIGFwcGVuZCBpdCB0byB0aGUgVVJMIGZvciBHRVQgcmVxdWVzdHNcbiAgICBjb25zdCBzZXJpYWxpemVEYXRhID0gKG9wdGlvbnMpID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbnMuZGF0YSAmJiB0eXBlb2Ygb3B0aW9ucy5kYXRhID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgb3B0aW9ucy5kYXRhID0gcGFyYW0ob3B0aW9ucy5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5kYXRhICYmICghb3B0aW9ucy50eXBlIHx8IG9wdGlvbnMudHlwZS50b1VwcGVyQ2FzZSgpID09PSAnR0VUJykpIHtcbiAgICAgICAgICAgIG9wdGlvbnMudXJsID0gYXBwZW5kUXVlcnkob3B0aW9ucy51cmwsIG9wdGlvbnMuZGF0YSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgcGFyYW0gPSAob2JqKSA9PiB7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IFtdO1xuICAgICAgICBwYXJhbXMuYWRkID0gZnVuY3Rpb24oaywgdikge1xuICAgICAgICAgICAgdGhpcy5wdXNoKGAke2VuY29kZVVSSUNvbXBvbmVudChrKX09JHtlbmNvZGVVUklDb21wb25lbnQodil9YClcbiAgICAgICAgfTtcbiAgICAgICAgc2VyaWFsaXplKHBhcmFtcywgb2JqKTtcblxuICAgICAgICByZXR1cm4gcGFyYW1zLmpvaW4oJyYnKS5yZXBsYWNlKCclMjAnLCAnKycpO1xuICAgIH07XG5cbiAgICBjb25zdCBzZXJpYWxpemUgPSAocGFyYW1zLCBvYmosIHNjb3BlKSA9PiB7XG4gICAgICAgIGNvbnN0IGlzQXJyYXkgPSBfLmlzQXJyYXkob2JqKTtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIG9iaikge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgICAgIGlmIChzY29wZSkge1xuICAgICAgICAgICAgICAgIGtleSA9IGlzQXJyYXkgPyBzY29wZSA6IGAke3Njb3BlfS4ke2tleX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzY29wZSAmJiBpc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zLmFkZCh2YWx1ZS5uYW1lLCB2YWx1ZS52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgc2VyaWFsaXplKHBhcmFtcywgdmFsdWUsIGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMuYWRkKGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHJlcXVlc3QgPSAob3B0aW9ucykgPT4ge1xuICAgICAgICBjb25zdCBzZXR0aW5ncyA9IF8uZXh0ZW5kKHt9LCBkZWZhdWx0U2V0dGluZ3MsIG9wdGlvbnMgfHwge30pO1xuXG4gICAgICAgIGFqYXhTdGFydChzZXR0aW5ncyk7XG5cbiAgICAgICAgaWYgKCFzZXR0aW5ncy51cmwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2V0dGluZyB1cmwgaXMgdW5kZWZpbmVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2V0dGluZ3MuYmFzZVVybCkge1xuICAgICAgICAgICAgc2V0dGluZ3MudXJsID0gdXJsUmVzb2x2ZShzZXR0aW5ncy5iYXNlVXJsLCBzZXR0aW5ncy51cmwpO1xuICAgICAgICB9XG4gICAgICAgIHNldHRpbmdzLnVybCA9IGFwcGVuZFF1ZXJ5KHNldHRpbmdzLnVybCwgYHBhdGg9JHtvcHRpb25zLnBhdGh9YCk7XG4gICAgICAgIHNldHRpbmdzLnVybCA9IGFwcGVuZFF1ZXJ5KHNldHRpbmdzLnVybCwgcGFyYW0oc2V0dGluZ3MudXJsUGFyYW1zKSk7XG5cbiAgICAgICAgbGV0IGRhdGFUeXBlID0gc2V0dGluZ3MuZGF0YVR5cGU7XG4gICAgICAgIGNvbnN0IGhhc1BsYWNlaG9sZGVyID0gLz1cXD8vLnRlc3Qoc2V0dGluZ3MudXJsKTtcbiAgICAgICAgaWYgKGRhdGFUeXBlID09PSAnanNvbnAnIHx8IGhhc1BsYWNlaG9sZGVyKSB7XG4gICAgICAgICAgICBpZiAoIWhhc1BsYWNlaG9sZGVyKSB7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MudXJsID0gYXBwZW5kUXVlcnkoc2V0dGluZ3MudXJsLCAnY2FsbGJhY2s9PycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFqYXguSlNPTlAoc2V0dGluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VyaWFsaXplRGF0YShzZXR0aW5ncyk7XG5cbiAgICAgICAgbGV0IG1pbWUgPSBzZXR0aW5ncy5hY2NlcHRzW2RhdGFUeXBlXTtcbiAgICAgICAgY29uc3QgYmFzZUhlYWRzID0ge307XG4gICAgICAgIGNvbnN0IHByb3RvY29sID0gL14oW1xcdy1dKzopXFwvXFwvLy50ZXN0KHNldHRpbmdzLnVybCkgPyBSZWdFeHAuJDEgOiAnaHR0cCc7XG4gICAgICAgIGNvbnN0IHhociA9IHNldHRpbmdzLnhocigpO1xuICAgICAgICB4aHIuc2V0RGlzYWJsZUhlYWRlckNoZWNrICYmIHhoci5zZXREaXNhYmxlSGVhZGVyQ2hlY2sodHJ1ZSk7XG4gICAgICAgIGxldCBhYm9ydFRpbWVvdXQ7XG5cbiAgICAgICAgaWYgKCFzZXR0aW5ncy5jcm9zc0RvbWFpbikge1xuICAgICAgICAgICAgYmFzZUhlYWRzWydYLVJlcXVlc3RlZC1XaXRoJ10gPSAnWE1MSHR0cFJlcXVlc3QnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtaW1lKSB7XG4gICAgICAgICAgICBiYXNlSGVhZHNbJ0FjY2VwdCddID0gbWltZTtcbiAgICAgICAgICAgIGlmIChtaW1lLmluZGV4T2YoJywnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgbWltZSA9IG1pbWUuc3BsaXQoJywnLCAyKVswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHhoci5vdmVycmlkZU1pbWVUeXBlICYmIHhoci5vdmVycmlkZU1pbWVUeXBlKG1pbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZXR0aW5ncy5jb250ZW50VHlwZSB8fCAoc2V0dGluZ3MuZGF0YSAmJiBzZXR0aW5ncy50eXBlLnRvVXBwZXJDYXNlKCkgIT09ICdHZXQnKSkge1xuICAgICAgICAgICAgYmFzZUhlYWRzWydDb250ZW50LVR5cGUnXSA9IChzZXR0aW5ncy5jb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0dGluZ3MuaGVhZGVycyA9IF8uZXh0ZW5kKGJhc2VIZWFkcywgc2V0dGluZ3MuaGVhZGVycyB8fCB7fSk7XG5cbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChhYm9ydFRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgICAgICAgICAgbGV0IGVycm9yID0gZmFsc2VcbiAgICAgICAgICAgICAgICBpZiAoKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHx8IHhoci5zdGF0dXMgPT09IDMwNFxuICAgICAgICAgICAgICAgICAgICB8fCAoeGhyLnN0YXR1cyA9PT0gMCAmJiBwcm90b2NvbCA9PT0gJ2ZpbGU6JykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGUgPSBkYXRhVHlwZSB8fCBtaW1lVG9EYXRhVHlwZSh4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ2NvbnRlbnQtdHlwZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geGhyLnJlc3BvbnNlVGV4dDtcblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFUeXBlID09PSAnc2NyaXB0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgxLCBldmFsKShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGF0YVR5cGUgPT09ICd4bWwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geGhyLnJlc3BvbnNlWE1MO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGF0YVR5cGUgPT09ICdqc29uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGJsYW5rUkUudGVzdChyZXN1bHQpID8gbnVsbCA6IEpTT04ucGFyc2UocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IgPSBlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhamF4RXJyb3IoZXJyb3IsICdwYXJzZXJlcnJvcicsIHhociwgc2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWpheFN1Y2Nlc3MocmVzdWx0LCB4aHIsIHNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYWpheEVycm9yKG51bGwsICdlcnJvcicsIHhociwgc2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBhc3luYyA9ICdhc3luYycgaW4gc2V0dGluZ3MgPyBzZXR0aW5ncy5hc3luYyA6IHRydWU7XG4gICAgICAgIHhoci5vcGVuKHNldHRpbmdzLnR5cGUsIHNldHRpbmdzLnVybCwgYXN5bmMpO1xuXG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBpbiBzZXR0aW5ncy5oZWFkZXJzKSB7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCBzZXR0aW5ncy5oZWFkZXJzW25hbWVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhamF4QmVmb3JlU2VuZCh4aHIsIHNldHRpbmdzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHhoci5hYm9ydCgpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNldHRpbmdzLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICBhYm9ydFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge307XG4gICAgICAgICAgICAgICAgeGhyLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgYWpheEVycm9yKG51bGwsICd0aW1lb3V0JywgeGhyLCBzZXR0aW5ncyk7XG4gICAgICAgICAgICB9LCBzZXR0aW5ncy50aW1lb3V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGF2b2lkIHNlbmRpbmcgZW1wdHkgc3RyaW5nXG4gICAgICAgIHhoci5zZW5kKHNldHRpbmdzLmRhdGEgPyBzZXR0aW5ncy5kYXRhIDogbnVsbCk7XG4gICAgICAgIHJldHVybiB4aHI7XG4gICAgfTtcblxuICAgIGNvbnN0IGFqYXggPSB7fTtcblxuICAgIGFqYXgucmVxdWVzdCA9IHJlcXVlc3Q7XG5cbiAgICBhamF4LmdldCA9ICh1cmwsIHN1Y2Nlc3MpID0+IChcbiAgICAgICAgcmVxdWVzdCh7dXJsLCBzdWNjZXNzfSlcbiAgICApO1xuXG4gICAgYWpheC5wb3N0ID0gKHVybCwgZGF0YSwgc3VjY2VzcywgZGF0YVR5cGUpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBkYXRhVHlwZSA9IGRhdGFUeXBlIHx8IHN1Y2Nlc3M7XG4gICAgICAgICAgICBzdWNjZXNzID0gZGF0YTtcbiAgICAgICAgICAgIGRhdGEgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXF1ZXN0KHtcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgZGF0YVR5cGVcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFqYXguZ2V0SlNPTiA9ICh1cmwsIHN1Y2Nlc3MpID0+IChcbiAgICAgICAgcmVxdWVzdCh7dXJsLCBzdWNjZXNzLCBkYXRhVHlwZTogJ2pzb24nfSlcbiAgICApO1xuXG4vLyBob29rcyBzdGFydFxuICAgIGFqYXguYWN0aXZlID0gMDtcblxuLy8gdHJpZ2dlciBhIGN1c3RvbSBldmVudCBhbmQgcmV0dXJuIGZhbHNlIGlmIGl0IHdhcyBjYW5jZWxsZWRcbiAgICBjb25zdCB0cmlnZ2VyQW5kUmV0dXJuID0gKGNvbnRleHQsIGV2ZW50TmFtZSwgZGF0YSkgPT4ge1xuICAgICAgICAvLyB0b2RvOiBGaXJlIG9mZiBzb21lIGV2ZW50c1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4vLyB0cmlnZ2VyIGFuIEFqYXggXCJnbG9iYWxcIiBldmVudFxuICAgIGNvbnN0IHRyaWdnZXJHbG9iYWwgPSAoc2V0dGluZ3MsIGNvbnRleHQsIGV2ZW50TmFtZSwgZGF0YSkgPT4ge1xuICAgICAgICBpZiAoc2V0dGluZ3MuZ2xvYmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJpZ2dlckFuZFJldHVybihjb250ZXh0IHx8IGdsb2JhbC5kb2N1bWVudCwgZXZlbnROYW1lLCBkYXRhKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBhamF4U3RhcnQgPSAoc2V0dGluZ3MpID0+IHtcbiAgICAgICAgaWYgKHNldHRpbmdzLmdsb2JhbCAmJiBhamF4LmFjdGl2ZSsrID09PSAwKSB7XG4gICAgICAgICAgICB0cmlnZ2VyR2xvYmFsKHNldHRpbmdzLCBudWxsLCAnYWpheFN0YXJ0Jyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgYWpheFN0b3AgPSAoc2V0dGluZ3MpID0+IHtcbiAgICAgICAgaWYgKHNldHRpbmdzLmdsb2JhbCAmJiAhKC0tYWpheC5hY3RpdmUpKSB7XG4gICAgICAgICAgICB0cmlnZ2VyR2xvYmFsKHNldHRpbmdzLCBudWxsLCAnYWpheFN0b3AnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbi8vIHRyaWdnZXJzIGFuIGV4dHJhIGdsb2JhbCBldmVudCBcImFqYXhCZWZvcmVTZW5kXCIgdGhhdCdzIGxpa2UgXCJhamF4U2VuZFwiIGJ1dCBjYW5jZWxhYmxlXG4gICAgY29uc3QgYWpheEJlZm9yZVNlbmQgPSAoeGhyLCBzZXR0aW5ncykgPT4ge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gc2V0dGluZ3MuY29udGV4dDtcbiAgICAgICAgaWYgKHNldHRpbmdzLmJlZm9yZVNlbmQuY2FsbChjb250ZXh0LCB4aHIsIHNldHRpbmdzKSA9PT0gZmFsc2VcbiAgICAgICAgICAgIHx8IHRyaWdnZXJHbG9iYWwoc2V0dGluZ3MsIGNvbnRleHQsICdhamF4QmVmb3JlU2VuZCcsIFt4aHIsIHNldHRpbmdzXSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdHJpZ2dlckdsb2JhbChzZXR0aW5ncywgY29udGV4dCwgJ2FqYXhTZW5kJywgW3hociwgc2V0dGluZ3NdKTtcbiAgICB9O1xuXG4gICAgY29uc3QgYWpheFN1Y2Nlc3MgPSAoZGF0YSwgeGhyLCBzZXR0aW5ncykgPT4ge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gc2V0dGluZ3MuY29udGV4dDtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gJ3N1Y2Nlc3MnO1xuICAgICAgICBzZXR0aW5ncy5zdWNjZXNzLmNhbGwoY29udGV4dCwgZGF0YSwgc3RhdHVzLCB4aHIpO1xuICAgICAgICB0cmlnZ2VyR2xvYmFsKHNldHRpbmdzLCBjb250ZXh0LCAnYWpheFN1Y2Nlc3MnLCBbeGhyLCBzZXR0aW5ncywgZGF0YV0pO1xuICAgICAgICBhamF4Q29tcGxldGUoc3RhdHVzLCB4aHIsIHNldHRpbmdzKTtcbiAgICB9O1xuXG4vLyB0eXBlOiBcInRpbWVvdXRcIiwgXCJlcnJvclwiLCBcImFib3J0XCIsIFwicGFyc2VlcnJvclwiXG4gICAgY29uc3QgYWpheEVycm9yID0gKGVycm9yLCB0eXBlLCB4aHIsIHNldHRpbmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBzZXR0aW5ncy5jb250ZXh0O1xuICAgICAgICBzZXR0aW5ncy5lcnJvci5jYWxsKGNvbnRleHQsIHhociwgdHlwZSwgZXJyb3IpO1xuICAgICAgICB0cmlnZ2VyR2xvYmFsKHNldHRpbmdzLCBjb250ZXh0LCAnYWpheEVycm9yJywgW3hociwgc2V0dGluZ3MsIGVycm9yXSk7XG4gICAgICAgIGFqYXhDb21wbGV0ZSh0eXBlLCB4aHIsIHNldHRpbmdzKTtcbiAgICB9O1xuXG4vLyBzdGF0dXM6IFwic3VjY2Vzc1wiLCBcIm5vdG1vZGlmaWVkXCIsIFwiZXJyb3JcIiwgXCJ0aW1lb3V0XCIsIFwiYWJvcnRcIiwgXCJwYXJzZXJlcnJvclwiXG4gICAgY29uc3QgYWpheENvbXBsZXRlID0gKHN0YXR1cywgeGhyLCBzZXR0aW5ncykgPT4ge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gc2V0dGluZ3MuY29udGV4dDtcbiAgICAgICAgc2V0dGluZ3MuY29tcGxldGUuY2FsbChjb250ZXh0LCB4aHIsIHN0YXR1cyk7XG4gICAgICAgIHRyaWdnZXJHbG9iYWwoc2V0dGluZ3MsIGNvbnRleHQsICdhamF4Q29tcGxldGUnLCBbeGhyLCBzZXR0aW5nc10pO1xuICAgICAgICBhamF4U3RvcChzZXR0aW5ncyk7XG4gICAgfTtcbi8vIGhvb2tzIGVuZFxuXG4gICAgY29uc3QgcmFuZDE2TnVtID0gKGxlbikgPT4ge1xuICAgICAgICBsZW4gPSBsZW4gfHwgMDtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goJzAxMjM0NTY3ODlhYmNkZWYnLmNoYXJBdChcbiAgICAgICAgICAgICAgICBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxNikpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzLmpvaW4oJycpO1xuICAgIH07XG5cbiAgICBjb25zdCB1aWQgPSAoKSA9PiBbKG5ldyBEYXRlKCkpLnZhbHVlT2YoKS50b1N0cmluZygpLCByYW5kMTZOdW0oNCldLmpvaW4oJycpO1xuXG4gICAgY29uc3QgZ3VpZCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgY3VyciA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCkudG9TdHJpbmcoKTtcbiAgICAgICAgcmV0dXJuIFsnNGI1MzRjNDYnLCByYW5kMTZOdW0oNCksICc0JyArIHJhbmQxNk51bSgzKSwgcmFuZDE2TnVtKDQpLCBjdXJyLnN1YnN0cmluZygwLCAxMildLmpvaW4oJy0nKTtcbiAgICB9O1xuXG4gICAgY29uc3QgYWRqdXN0T3B0aW9ucyA9IChwYXRoLCBwYXJhbXMsIG9wdGlvbnMpID0+IHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgY29uc3QgdXNlcmlkID0gb3B0aW9ucy51c2VyaWQgfHwgJyc7XG4gICAgICAgIGNvbnN0IHRva2VuID0gb3B0aW9ucy50b2tlbiB8fCAnJztcbiAgICAgICAgY29uc3QgcmVxSWQgPSBvcHRpb25zLnJlcUlkIHx8IHVpZCgpO1xuICAgICAgICBjb25zdCBldmVudElkID0gb3B0aW9ucy5ldmVudElkIHx8IGd1aWQoKTtcbiAgICAgICAgY29uc3Qgc2VjcmV0ID0gb3B0aW9ucy5zZWNyZXQ7XG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IG9wdGlvbnMuc291cmNlO1xuXG4gICAgICAgIHBhcmFtcyA9IEpTT04uc3RyaW5naWZ5KHBhcmFtcyB8fCB7fSk7XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IHtyZXFJZCwgdXNlcmlkLCB0b2tlbiwgcGF0aCwgZXZlbnRJZCwgcGFyYW1zfTtcbiAgICAgICAgc2VjcmV0ICYmIChkYXRhLnNlY3JldCA9IHNlY3JldCk7XG4gICAgICAgIHNvdXJjZSAmJiAoZGF0YS5zb3VyY2UgPSBzb3VyY2UpO1xuXG4gICAgICAgIGNvbnN0IHVybFBhcmFtcyA9IHtyZXFJZH07XG5cbiAgICAgICAgY29uc3Qgb21pdE5hbWVzID0gWyd1c2VyaWQnLCAndG9rZW4nLCAncmVxSWQnLCAnZXZlbnRJZCcsICdzZWNyZXQnLCAnc291cmNlJ11cbiAgICAgICAgY29uc3Qgb3RoZXJPcHRpb25zID0gXy5vbWl0KG9wdGlvbnMsIG9taXROYW1lcyk7XG5cbiAgICAgICAgcmV0dXJuIF8uZXh0ZW5kKG90aGVyT3B0aW9ucywge3BhdGgsIGRhdGEsIHVybFBhcmFtc30pO1xuICAgIH07XG5cbiAgICBjb25zdCBnZXRSZWRpcmVjdFVybCA9IChiYXNlVXJsKSA9PiB7XG4gICAgICAgIGlmIChiYXNlVXJsID09IG51bGwpIHtcbiAgICAgICAgICAgIGJhc2VVcmwgPSBnbG9iYWwubG9jYXRpb24uaHJlZjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHF1ZXJ5U2VwYXJhdG9ySW5kZXggPSBiYXNlVXJsLmluZGV4T2YoJz8nKTtcbiAgICAgICAgY29uc3Qgc2VhcmNoID0gcXVlcnlTZXBhcmF0b3JJbmRleCA9PT0gLTEgPyAnJyA6IGJhc2VVcmwuc3Vic3RyaW5nKHF1ZXJ5U2VwYXJhdG9ySW5kZXgpO1xuXG4gICAgICAgIHJldHVybiB1cmxSZXNvbHZlKGJhc2VVcmwsICdtYWluLmRvJykgKyBzZWFyY2g7XG4gICAgfTtcblxuICAgIGNsYXNzIEFqYXgge1xuICAgICAgICBjb25zdHJ1Y3RvcihnbG9iYWxPcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmdsb2JhbE9wdGlvbnMgPSBnbG9iYWxPcHRpb25zIHx8IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdChwYXRoLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7fSwgdGhpcy5nbG9iYWxPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGFqYXhPcHRpb25zID0gYWRqdXN0T3B0aW9ucyhwYXRoLCBwYXJhbXMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICBjb25zdCBkID0gbmV3IERlZmVycmVkKCk7XG4gICAgICAgICAgICBhamF4T3B0aW9ucy5zdWNjZXNzID0gZC5yZXNvbHZlci5yZXNvbHZlO1xuICAgICAgICAgICAgYWpheE9wdGlvbnMuZXJyb3IgPSBkLnJlc29sdmVyLnJlamVjdDtcblxuICAgICAgICAgICAgY29uc3QgcCA9IGQucHJvbWlzZTtcblxuICAgICAgICAgICAgYWpheC5yZXF1ZXN0KGFqYXhPcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIHAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmmK/ovazlkJHooYzkuLrvvIznm7TmjqXovazlkJHvvIzmlbTkvZPovazkuLpyZWplY3RcbiAgICAgICAgICAgICAgICBpZiAoXy5pc09iamVjdChyZXNwb25zZSkgJiYgcmVzcG9uc2UucmVkaXJlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBzdGF0dXMuUkVRX0NPREUuUkVESVJFQ1QsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjOiBzdGF0dXMuUkVRX0NPREVfREVTQy5SRURJUkVDVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0dXJsOiByZXNwb25zZS5yZWRpcmVjdHVybCB8fCBnZXRSZWRpcmVjdFVybChvcHRpb25zLmJhc2VVcmwpLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgICAgIH0sIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGh0dHBTdGF0dXMgPSBlcnJvci5zdGF0dXM7XG5cbiAgICAgICAgICAgICAgICBpZiAoaHR0cFN0YXR1cyA9PT0gNDA4KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLlJFUV9DT0RFLlRJTUVPVVQsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjOiBzdGF0dXMuUkVRX0NPREVfREVTQy5USU1FT1VULFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaHR0cFN0YXR1cyA8IDIwMCB8fCAoaHR0cFN0YXR1cyA+PSAzMDAgJiYgaHR0cFN0YXR1cyAhPT0gMzA0KSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyB7XG4gICAgICAgICAgICAgICAgICAgICAgICBodHRwU3RhdHVzOiBodHRwU3RhdHVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBzdGF0dXMuUkVRX0NPREUuUkVRVUVTVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2M6IHN0YXR1cy5SRVFfQ09ERV9ERVNDLlJFUVVFU1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZTogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IHtcbiAgICAgICAgICAgICAgICAgICAgaHR0cFN0YXR1czogaHR0cFN0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBzdGF0dXMuUkVRX0NPREUuUkVRVUVTVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgZGVzYzogc3RhdHVzLlJFUV9DT0RFX0RFU0MuUkVRVUVTVF9FUlJPUixcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IEpTT04uc3RyaW5naWZ5KGVycm9yLmVycm9yKSxcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IG51bGxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gQWpheDtcbn0pO1xuIl19