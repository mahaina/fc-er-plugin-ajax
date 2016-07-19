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
                var Deferred = require('fc-er/Deferred');
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
//# sourceMappingURL=data:application/json;base64,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SUFBd0IsZUFBZSxRQUFRLE9BQVIsQ0FBdkM7QUFDYixzQ0FBVSxRQUFWO3lCQUpKLENBRDJDO3FCQUEvQztBQVFBLDJCQUFPLFFBQVAsQ0FWd0I7aUJBQWQsRUFXWCxVQUFDLEtBQUQsRUFBVztBQUNWLHdCQUFNLGFBQWEsTUFBTSxNQUFOLENBRFQ7O0FBR1Ysd0JBQUksZUFBZSxHQUFmLEVBQW9CO0FBQ3BCLDhCQUFNO0FBQ0Ysb0NBQVEsT0FBTyxRQUFQLENBQWdCLE9BQWhCO0FBQ1Isa0NBQU0sT0FBTyxhQUFQLENBQXFCLE9BQXJCO0FBQ04sc0NBQVUsSUFBVjt5QkFISixDQURvQjtxQkFBeEI7O0FBUUEsd0JBQUksYUFBYSxHQUFiLElBQXFCLGNBQWMsR0FBZCxJQUFxQixlQUFlLEdBQWYsRUFBcUI7QUFDL0QsOEJBQU07QUFDRix3Q0FBWSxVQUFaO0FBQ0Esb0NBQVEsT0FBTyxRQUFQLENBQWdCLGFBQWhCO0FBQ1Isa0NBQU0sT0FBTyxhQUFQLENBQXFCLGFBQXJCO0FBQ04sc0NBQVUsSUFBVjt5QkFKSixDQUQrRDtxQkFBbkU7O0FBU0EsMEJBQU07QUFDRixvQ0FBWSxVQUFaO0FBQ0EsZ0NBQVEsT0FBTyxRQUFQLENBQWdCLGFBQWhCO0FBQ1IsOEJBQU0sT0FBTyxhQUFQLENBQXFCLGFBQXJCO0FBQ04sK0JBQU8sS0FBSyxTQUFMLENBQWUsTUFBTSxLQUFOLENBQXRCO0FBQ0Esa0NBQVUsSUFBVjtxQkFMSixDQXBCVTtpQkFBWCxDQVhILENBYjJCOzs7OztRQXRYYjs7QUE2YXRCLFdBQU8sSUFBUCxDQTdhc0I7Q0FBbkIsQ0FBUCIsImZpbGUiOiJBamF4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHt2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUpfVxuXG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSByZXF1aXJlKCcuL2RlZmF1bHRTZXR0aW5ncycpO1xuXG4gICAgY29uc3QgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbiAgICBjb25zdCBzdGF0dXMgPSByZXF1aXJlKCcuL3N0YXR1cycpO1xuICAgIGNvbnN0IGpzb25UeXBlID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgIGNvbnN0IGh0bWxUeXBlID0gJ3RleHQvaHRtbCc7XG4gICAgY29uc3QgYmxhbmtSRSA9IC9eXFxzKiQvO1xuICAgIGNvbnN0IHNjcmlwdFR5cGVSRSA9IC9eKD86dGV4dHxhcHBsaWNhdGlvbilcXC9qYXZhc2NyaXB0L2k7XG4gICAgY29uc3QgeG1sVHlwZVJFID0gL14oPzp0ZXh0fGFwcGxpY2F0aW9uKVxcL3htbC9pO1xuXG4gICAgY29uc3QgYXBwZW5kUXVlcnkgPSAodXJsLCBxdWVyeSkgPT4gKFxuICAgICAgICAodXJsICsgJyYnICsgcXVlcnkpLnJlcGxhY2UoL1smP117MSwyfS8sICc/JylcbiAgICApO1xuXG4gICAgY29uc3QgbWltZVRvRGF0YVR5cGUgPSAobWltZSkgPT4gKFxuICAgICAgICBtaW1lICYmIChtaW1lID09PSBodG1sVHlwZSA/ICdodG1sJyA6XG4gICAgICAgICAgICBtaW1lID09PSBqc29uVHlwZSA/ICdqc29uJyA6XG4gICAgICAgICAgICAgICAgc2NyaXB0VHlwZVJFLnRlc3QobWltZSkgPyAnc2NyaXB0JyA6XG4gICAgICAgICAgICAgICAgeG1sVHlwZVJFLnRlc3QobWltZSkgJiYgJ3htbCcpIHx8ICd0ZXh0J1xuICAgICk7XG5cbiAgICBjb25zdCBzdHJpcFRhaWxQYXRoUGFydGl0aW9uID0gKHBhdGgpID0+IHtcbiAgICAgICAgY29uc3QgdGFpbFNsYXNoSW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKCcvJyk7XG4gICAgICAgIGlmICh0YWlsU2xhc2hJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXRoLnN1YnN0cmluZygwLCB0YWlsU2xhc2hJbmRleCk7XG4gICAgfTtcblxuICAgIGNvbnN0IHNhbml0eVBhdGggPSAodXJsKSA9PiB7XG4gICAgICAgIGNvbnN0IGhhc2hTZXBhcmF0b3JJbmRleCA9IHVybC5sYXN0SW5kZXhPZignIycpO1xuICAgICAgICBpZiAoaGFzaFNlcGFyYXRvckluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHVybCA9IHVybC5zdWJzdHJpbmcoMCwgaGFzaFNlcGFyYXRvckluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZWFyY2hTZXBhcmF0b3JJbmRleCA9IHVybC5sYXN0SW5kZXhPZignPycpO1xuICAgICAgICBpZiAoc2VhcmNoU2VwYXJhdG9ySW5kZXggPj0gMCkge1xuICAgICAgICAgICAgdXJsID0gdXJsLnN1YnN0cmluZygwLCBzZWFyY2hTZXBhcmF0b3JJbmRleCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXN0U2xhc2hJbmRleCA9IHVybC5sYXN0SW5kZXhPZignLycpO1xuICAgICAgICBpZiAobGFzdFNsYXNoSW5kZXggPj0gMCkge1xuICAgICAgICAgICAgdXJsID0gdXJsLnN1YnN0cmluZygwLCBsYXN0U2xhc2hJbmRleCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH07XG5cbiAgICBjb25zdCB1cmxSZXNvbHZlID0gKHNvdXJjZSwgcmVsYXRpdmUpID0+IHtcbiAgICAgICAgY29uc3Qgb3JnaW5hbFNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgc291cmNlID0gc2FuaXR5UGF0aChzb3VyY2UpO1xuXG4gICAgICAgIGNvbnN0IG1hdGNoID0gc291cmNlLm1hdGNoKC8oaHR0cHM/OlxcL1xcLyk/KC4qKS8pO1xuICAgICAgICBjb25zdCBwcm90b2NvbCA9IChtYXRjaCAmJiBtYXRjaFsxXSkgfHwgJyc7XG4gICAgICAgIGxldCBwYXRoID0gKG1hdGNoICYmIG1hdGNoWzJdKSB8fCAnJztcblxuICAgICAgICBjb25zdCByZWxhdGl2ZUFyciA9IHJlbGF0aXZlLnNwbGl0KCcvJylcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHJlbGF0aXZlQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHJlbGF0aXZlQXJyW2ldKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnLi4nOlxuICAgICAgICAgICAgICAgICAgICBpZiAoKHBhdGggPSBzdHJpcFRhaWxQYXRoUGFydGl0aW9uKHBhdGgpKSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3JnaW5hbFNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICcuJzpcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IGAke3BhdGh9LyR7cmVsYXRpdmVBcnJbaV19YDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGAke3Byb3RvY29sfSR7cGF0aH1gO1xuICAgIH07XG5cbi8vIHNlcmlhbGl6ZSBwYXlsb2FkIGFuZCBhcHBlbmQgaXQgdG8gdGhlIFVSTCBmb3IgR0VUIHJlcXVlc3RzXG4gICAgY29uc3Qgc2VyaWFsaXplRGF0YSA9IChvcHRpb25zKSA9PiB7XG4gICAgICAgIGlmIChvcHRpb25zLmRhdGEgJiYgdHlwZW9mIG9wdGlvbnMuZGF0YSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZGF0YSA9IHBhcmFtKG9wdGlvbnMuZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuZGF0YSAmJiAoIW9wdGlvbnMudHlwZSB8fCBvcHRpb25zLnR5cGUudG9VcHBlckNhc2UoKSA9PT0gJ0dFVCcpKSB7XG4gICAgICAgICAgICBvcHRpb25zLnVybCA9IGFwcGVuZFF1ZXJ5KG9wdGlvbnMudXJsLCBvcHRpb25zLmRhdGEpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHBhcmFtID0gKG9iaikgPT4ge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBbXTtcbiAgICAgICAgcGFyYW1zLmFkZCA9IGZ1bmN0aW9uKGssIHYpIHtcbiAgICAgICAgICAgIHRoaXMucHVzaChgJHtlbmNvZGVVUklDb21wb25lbnQoayl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHYpfWApXG4gICAgICAgIH07XG4gICAgICAgIHNlcmlhbGl6ZShwYXJhbXMsIG9iaik7XG5cbiAgICAgICAgcmV0dXJuIHBhcmFtcy5qb2luKCcmJykucmVwbGFjZSgnJTIwJywgJysnKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc2VyaWFsaXplID0gKHBhcmFtcywgb2JqLCBzY29wZSkgPT4ge1xuICAgICAgICBjb25zdCBpc0FycmF5ID0gXy5pc0FycmF5KG9iaik7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XG4gICAgICAgICAgICBpZiAoc2NvcGUpIHtcbiAgICAgICAgICAgICAgICBrZXkgPSBpc0FycmF5ID8gc2NvcGUgOiBgJHtzY29wZX0uJHtrZXl9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc2NvcGUgJiYgaXNBcnJheSkge1xuICAgICAgICAgICAgICAgIHBhcmFtcy5hZGQodmFsdWUubmFtZSwgdmFsdWUudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHNlcmlhbGl6ZShwYXJhbXMsIHZhbHVlLCBrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zLmFkZChrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCByZXF1ZXN0ID0gKG9wdGlvbnMpID0+IHtcbiAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBfLmV4dGVuZCh7fSwgZGVmYXVsdFNldHRpbmdzLCBvcHRpb25zIHx8IHt9KTtcblxuICAgICAgICBhamF4U3RhcnQoc2V0dGluZ3MpO1xuXG4gICAgICAgIGlmICghc2V0dGluZ3MudXJsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldHRpbmcgdXJsIGlzIHVuZGVmaW5lZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNldHRpbmdzLmJhc2VVcmwpIHtcbiAgICAgICAgICAgIHNldHRpbmdzLnVybCA9IHVybFJlc29sdmUoc2V0dGluZ3MuYmFzZVVybCwgc2V0dGluZ3MudXJsKTtcbiAgICAgICAgfVxuICAgICAgICBzZXR0aW5ncy51cmwgPSBhcHBlbmRRdWVyeShzZXR0aW5ncy51cmwsIGBwYXRoPSR7b3B0aW9ucy5wYXRofWApO1xuICAgICAgICBzZXR0aW5ncy51cmwgPSBhcHBlbmRRdWVyeShzZXR0aW5ncy51cmwsIHBhcmFtKHNldHRpbmdzLnVybFBhcmFtcykpO1xuXG4gICAgICAgIGxldCBkYXRhVHlwZSA9IHNldHRpbmdzLmRhdGFUeXBlO1xuICAgICAgICBjb25zdCBoYXNQbGFjZWhvbGRlciA9IC89XFw/Ly50ZXN0KHNldHRpbmdzLnVybCk7XG4gICAgICAgIGlmIChkYXRhVHlwZSA9PT0gJ2pzb25wJyB8fCBoYXNQbGFjZWhvbGRlcikge1xuICAgICAgICAgICAgaWYgKCFoYXNQbGFjZWhvbGRlcikge1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLnVybCA9IGFwcGVuZFF1ZXJ5KHNldHRpbmdzLnVybCwgJ2NhbGxiYWNrPT8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhamF4LkpTT05QKHNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlcmlhbGl6ZURhdGEoc2V0dGluZ3MpO1xuXG4gICAgICAgIGxldCBtaW1lID0gc2V0dGluZ3MuYWNjZXB0c1tkYXRhVHlwZV07XG4gICAgICAgIGNvbnN0IGJhc2VIZWFkcyA9IHt9O1xuICAgICAgICBjb25zdCBwcm90b2NvbCA9IC9eKFtcXHctXSs6KVxcL1xcLy8udGVzdChzZXR0aW5ncy51cmwpID8gUmVnRXhwLiQxIDogJ2h0dHAnO1xuICAgICAgICBjb25zdCB4aHIgPSBzZXR0aW5ncy54aHIoKTtcbiAgICAgICAgeGhyLnNldERpc2FibGVIZWFkZXJDaGVjayAmJiB4aHIuc2V0RGlzYWJsZUhlYWRlckNoZWNrKHRydWUpO1xuICAgICAgICBsZXQgYWJvcnRUaW1lb3V0O1xuXG4gICAgICAgIGlmICghc2V0dGluZ3MuY3Jvc3NEb21haW4pIHtcbiAgICAgICAgICAgIGJhc2VIZWFkc1snWC1SZXF1ZXN0ZWQtV2l0aCddID0gJ1hNTEh0dHBSZXF1ZXN0JztcbiAgICAgICAgfVxuICAgICAgICBpZiAobWltZSkge1xuICAgICAgICAgICAgYmFzZUhlYWRzWydBY2NlcHQnXSA9IG1pbWU7XG4gICAgICAgICAgICBpZiAobWltZS5pbmRleE9mKCcsJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIG1pbWUgPSBtaW1lLnNwbGl0KCcsJywgMilbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4aHIub3ZlcnJpZGVNaW1lVHlwZSAmJiB4aHIub3ZlcnJpZGVNaW1lVHlwZShtaW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2V0dGluZ3MuY29udGVudFR5cGUgfHwgKHNldHRpbmdzLmRhdGEgJiYgc2V0dGluZ3MudHlwZS50b1VwcGVyQ2FzZSgpICE9PSAnR2V0JykpIHtcbiAgICAgICAgICAgIGJhc2VIZWFkc1snQ29udGVudC1UeXBlJ10gPSAoc2V0dGluZ3MuY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHNldHRpbmdzLmhlYWRlcnMgPSBfLmV4dGVuZChiYXNlSGVhZHMsIHNldHRpbmdzLmhlYWRlcnMgfHwge30pO1xuXG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoYWJvcnRUaW1lb3V0KTtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICAgICAgICAgIGxldCBlcnJvciA9IGZhbHNlXG4gICAgICAgICAgICAgICAgaWYgKCh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSB8fCB4aHIuc3RhdHVzID09PSAzMDRcbiAgICAgICAgICAgICAgICAgICAgfHwgKHhoci5zdGF0dXMgPT09IDAgJiYgcHJvdG9jb2wgPT09ICdmaWxlOicpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlID0gZGF0YVR5cGUgfHwgbWltZVRvRGF0YVR5cGUoeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdjb250ZW50LXR5cGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHhoci5yZXNwb25zZVRleHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhVHlwZSA9PT0gJ3NjcmlwdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoMSwgZXZhbCkocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRhdGFUeXBlID09PSAneG1sJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHhoci5yZXNwb25zZVhNTDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRhdGFUeXBlID09PSAnanNvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBibGFua1JFLnRlc3QocmVzdWx0KSA/IG51bGwgOiBKU09OLnBhcnNlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yID0gZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWpheEVycm9yKGVycm9yLCAncGFyc2VyZXJyb3InLCB4aHIsIHNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFqYXhTdWNjZXNzKHJlc3VsdCwgeGhyLCBzZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFqYXhFcnJvcihudWxsLCAnZXJyb3InLCB4aHIsIHNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgYXN5bmMgPSAnYXN5bmMnIGluIHNldHRpbmdzID8gc2V0dGluZ3MuYXN5bmMgOiB0cnVlO1xuICAgICAgICB4aHIub3BlbihzZXR0aW5ncy50eXBlLCBzZXR0aW5ncy51cmwsIGFzeW5jKTtcblxuICAgICAgICBmb3IgKGNvbnN0IG5hbWUgaW4gc2V0dGluZ3MuaGVhZGVycykge1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIobmFtZSwgc2V0dGluZ3MuaGVhZGVyc1tuYW1lXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWpheEJlZm9yZVNlbmQoeGhyLCBzZXR0aW5ncykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB4aHIuYWJvcnQoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZXR0aW5ncy50aW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgYWJvcnRUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHt9O1xuICAgICAgICAgICAgICAgIHhoci5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIGFqYXhFcnJvcihudWxsLCAndGltZW91dCcsIHhociwgc2V0dGluZ3MpO1xuICAgICAgICAgICAgfSwgc2V0dGluZ3MudGltZW91dCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhdm9pZCBzZW5kaW5nIGVtcHR5IHN0cmluZ1xuICAgICAgICB4aHIuc2VuZChzZXR0aW5ncy5kYXRhID8gc2V0dGluZ3MuZGF0YSA6IG51bGwpO1xuICAgICAgICByZXR1cm4geGhyO1xuICAgIH07XG5cbiAgICBjb25zdCBhamF4ID0ge307XG5cbiAgICBhamF4LnJlcXVlc3QgPSByZXF1ZXN0O1xuXG4gICAgYWpheC5nZXQgPSAodXJsLCBzdWNjZXNzKSA9PiAoXG4gICAgICAgIHJlcXVlc3Qoe3VybCwgc3VjY2Vzc30pXG4gICAgKTtcblxuICAgIGFqYXgucG9zdCA9ICh1cmwsIGRhdGEsIHN1Y2Nlc3MsIGRhdGFUeXBlKSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgZGF0YVR5cGUgPSBkYXRhVHlwZSB8fCBzdWNjZXNzO1xuICAgICAgICAgICAgc3VjY2VzcyA9IGRhdGE7XG4gICAgICAgICAgICBkYXRhID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVxdWVzdCh7XG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgIGRhdGFUeXBlXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhamF4LmdldEpTT04gPSAodXJsLCBzdWNjZXNzKSA9PiAoXG4gICAgICAgIHJlcXVlc3Qoe3VybCwgc3VjY2VzcywgZGF0YVR5cGU6ICdqc29uJ30pXG4gICAgKTtcblxuLy8gaG9va3Mgc3RhcnRcbiAgICBhamF4LmFjdGl2ZSA9IDA7XG5cbi8vIHRyaWdnZXIgYSBjdXN0b20gZXZlbnQgYW5kIHJldHVybiBmYWxzZSBpZiBpdCB3YXMgY2FuY2VsbGVkXG4gICAgY29uc3QgdHJpZ2dlckFuZFJldHVybiA9IChjb250ZXh0LCBldmVudE5hbWUsIGRhdGEpID0+IHtcbiAgICAgICAgLy8gdG9kbzogRmlyZSBvZmYgc29tZSBldmVudHNcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuLy8gdHJpZ2dlciBhbiBBamF4IFwiZ2xvYmFsXCIgZXZlbnRcbiAgICBjb25zdCB0cmlnZ2VyR2xvYmFsID0gKHNldHRpbmdzLCBjb250ZXh0LCBldmVudE5hbWUsIGRhdGEpID0+IHtcbiAgICAgICAgaWYgKHNldHRpbmdzLmdsb2JhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRyaWdnZXJBbmRSZXR1cm4oY29udGV4dCB8fCBnbG9iYWwuZG9jdW1lbnQsIGV2ZW50TmFtZSwgZGF0YSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgYWpheFN0YXJ0ID0gKHNldHRpbmdzKSA9PiB7XG4gICAgICAgIGlmIChzZXR0aW5ncy5nbG9iYWwgJiYgYWpheC5hY3RpdmUrKyA9PT0gMCkge1xuICAgICAgICAgICAgdHJpZ2dlckdsb2JhbChzZXR0aW5ncywgbnVsbCwgJ2FqYXhTdGFydCcpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IGFqYXhTdG9wID0gKHNldHRpbmdzKSA9PiB7XG4gICAgICAgIGlmIChzZXR0aW5ncy5nbG9iYWwgJiYgISgtLWFqYXguYWN0aXZlKSkge1xuICAgICAgICAgICAgdHJpZ2dlckdsb2JhbChzZXR0aW5ncywgbnVsbCwgJ2FqYXhTdG9wJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyB0cmlnZ2VycyBhbiBleHRyYSBnbG9iYWwgZXZlbnQgXCJhamF4QmVmb3JlU2VuZFwiIHRoYXQncyBsaWtlIFwiYWpheFNlbmRcIiBidXQgY2FuY2VsYWJsZVxuICAgIGNvbnN0IGFqYXhCZWZvcmVTZW5kID0gKHhociwgc2V0dGluZ3MpID0+IHtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHNldHRpbmdzLmNvbnRleHQ7XG4gICAgICAgIGlmIChzZXR0aW5ncy5iZWZvcmVTZW5kLmNhbGwoY29udGV4dCwgeGhyLCBzZXR0aW5ncykgPT09IGZhbHNlXG4gICAgICAgICAgICB8fCB0cmlnZ2VyR2xvYmFsKHNldHRpbmdzLCBjb250ZXh0LCAnYWpheEJlZm9yZVNlbmQnLCBbeGhyLCBzZXR0aW5nc10pID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRyaWdnZXJHbG9iYWwoc2V0dGluZ3MsIGNvbnRleHQsICdhamF4U2VuZCcsIFt4aHIsIHNldHRpbmdzXSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGFqYXhTdWNjZXNzID0gKGRhdGEsIHhociwgc2V0dGluZ3MpID0+IHtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHNldHRpbmdzLmNvbnRleHQ7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9ICdzdWNjZXNzJztcbiAgICAgICAgc2V0dGluZ3Muc3VjY2Vzcy5jYWxsKGNvbnRleHQsIGRhdGEsIHN0YXR1cywgeGhyKTtcbiAgICAgICAgdHJpZ2dlckdsb2JhbChzZXR0aW5ncywgY29udGV4dCwgJ2FqYXhTdWNjZXNzJywgW3hociwgc2V0dGluZ3MsIGRhdGFdKTtcbiAgICAgICAgYWpheENvbXBsZXRlKHN0YXR1cywgeGhyLCBzZXR0aW5ncyk7XG4gICAgfTtcblxuLy8gdHlwZTogXCJ0aW1lb3V0XCIsIFwiZXJyb3JcIiwgXCJhYm9ydFwiLCBcInBhcnNlZXJyb3JcIlxuICAgIGNvbnN0IGFqYXhFcnJvciA9IChlcnJvciwgdHlwZSwgeGhyLCBzZXR0aW5ncykgPT4ge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gc2V0dGluZ3MuY29udGV4dDtcbiAgICAgICAgc2V0dGluZ3MuZXJyb3IuY2FsbChjb250ZXh0LCB4aHIsIHR5cGUsIGVycm9yKTtcbiAgICAgICAgdHJpZ2dlckdsb2JhbChzZXR0aW5ncywgY29udGV4dCwgJ2FqYXhFcnJvcicsIFt4aHIsIHNldHRpbmdzLCBlcnJvcl0pO1xuICAgICAgICBhamF4Q29tcGxldGUodHlwZSwgeGhyLCBzZXR0aW5ncyk7XG4gICAgfTtcblxuLy8gc3RhdHVzOiBcInN1Y2Nlc3NcIiwgXCJub3Rtb2RpZmllZFwiLCBcImVycm9yXCIsIFwidGltZW91dFwiLCBcImFib3J0XCIsIFwicGFyc2VyZXJyb3JcIlxuICAgIGNvbnN0IGFqYXhDb21wbGV0ZSA9IChzdGF0dXMsIHhociwgc2V0dGluZ3MpID0+IHtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHNldHRpbmdzLmNvbnRleHQ7XG4gICAgICAgIHNldHRpbmdzLmNvbXBsZXRlLmNhbGwoY29udGV4dCwgeGhyLCBzdGF0dXMpO1xuICAgICAgICB0cmlnZ2VyR2xvYmFsKHNldHRpbmdzLCBjb250ZXh0LCAnYWpheENvbXBsZXRlJywgW3hociwgc2V0dGluZ3NdKTtcbiAgICAgICAgYWpheFN0b3Aoc2V0dGluZ3MpO1xuICAgIH07XG4vLyBob29rcyBlbmRcblxuICAgIGNvbnN0IHJhbmQxNk51bSA9IChsZW4pID0+IHtcbiAgICAgICAgbGVuID0gbGVuIHx8IDA7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKCcwMTIzNDU2Nzg5YWJjZGVmJy5jaGFyQXQoXG4gICAgICAgICAgICAgICAgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTYpKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0cy5qb2luKCcnKTtcbiAgICB9O1xuXG4gICAgY29uc3QgdWlkID0gKCkgPT4gWyhuZXcgRGF0ZSgpKS52YWx1ZU9mKCkudG9TdHJpbmcoKSwgcmFuZDE2TnVtKDQpXS5qb2luKCcnKTtcblxuICAgIGNvbnN0IGd1aWQgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnIgPSAobmV3IERhdGUoKSkudmFsdWVPZigpLnRvU3RyaW5nKCk7XG4gICAgICAgIHJldHVybiBbJzRiNTM0YzQ2JywgcmFuZDE2TnVtKDQpLCAnNCcgKyByYW5kMTZOdW0oMyksIHJhbmQxNk51bSg0KSwgY3Vyci5zdWJzdHJpbmcoMCwgMTIpXS5qb2luKCctJyk7XG4gICAgfTtcblxuICAgIGNvbnN0IGFkanVzdE9wdGlvbnMgPSAocGF0aCwgcGFyYW1zLCBvcHRpb25zKSA9PiB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIGNvbnN0IHVzZXJpZCA9IG9wdGlvbnMudXNlcmlkIHx8ICcnO1xuICAgICAgICBjb25zdCB0b2tlbiA9IG9wdGlvbnMudG9rZW4gfHwgJyc7XG4gICAgICAgIGNvbnN0IHJlcUlkID0gb3B0aW9ucy5yZXFJZCB8fCB1aWQoKTtcbiAgICAgICAgY29uc3QgZXZlbnRJZCA9IG9wdGlvbnMuZXZlbnRJZCB8fCBndWlkKCk7XG4gICAgICAgIGNvbnN0IHNlY3JldCA9IG9wdGlvbnMuc2VjcmV0O1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBvcHRpb25zLnNvdXJjZTtcblxuICAgICAgICBwYXJhbXMgPSBKU09OLnN0cmluZ2lmeShwYXJhbXMgfHwge30pO1xuXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7cmVxSWQsIHVzZXJpZCwgdG9rZW4sIHBhdGgsIGV2ZW50SWQsIHBhcmFtc307XG4gICAgICAgIHNlY3JldCAmJiAoZGF0YS5zZWNyZXQgPSBzZWNyZXQpO1xuICAgICAgICBzb3VyY2UgJiYgKGRhdGEuc291cmNlID0gc291cmNlKTtcblxuICAgICAgICBjb25zdCB1cmxQYXJhbXMgPSB7cmVxSWR9O1xuXG4gICAgICAgIGNvbnN0IG9taXROYW1lcyA9IFsndXNlcmlkJywgJ3Rva2VuJywgJ3JlcUlkJywgJ2V2ZW50SWQnLCAnc2VjcmV0JywgJ3NvdXJjZSddXG4gICAgICAgIGNvbnN0IG90aGVyT3B0aW9ucyA9IF8ub21pdChvcHRpb25zLCBvbWl0TmFtZXMpO1xuXG4gICAgICAgIHJldHVybiBfLmV4dGVuZChvdGhlck9wdGlvbnMsIHtwYXRoLCBkYXRhLCB1cmxQYXJhbXN9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgZ2V0UmVkaXJlY3RVcmwgPSAoYmFzZVVybCkgPT4ge1xuICAgICAgICBpZiAoYmFzZVVybCA9PSBudWxsKSB7XG4gICAgICAgICAgICBiYXNlVXJsID0gZ2xvYmFsLmxvY2F0aW9uLmhyZWY7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBxdWVyeVNlcGFyYXRvckluZGV4ID0gYmFzZVVybC5pbmRleE9mKCc/Jyk7XG4gICAgICAgIGNvbnN0IHNlYXJjaCA9IHF1ZXJ5U2VwYXJhdG9ySW5kZXggPT09IC0xID8gJycgOiBiYXNlVXJsLnN1YnN0cmluZyhxdWVyeVNlcGFyYXRvckluZGV4KTtcblxuICAgICAgICByZXR1cm4gdXJsUmVzb2x2ZShiYXNlVXJsLCAnbWFpbi5kbycpICsgc2VhcmNoO1xuICAgIH07XG5cbiAgICBjbGFzcyBBamF4IHtcbiAgICAgICAgY29uc3RydWN0b3IoZ2xvYmFsT3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5nbG9iYWxPcHRpb25zID0gZ2xvYmFsT3B0aW9ucyB8fCB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3QocGF0aCwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBEZWZlcnJlZCA9IHJlcXVpcmUoJ2ZjLWVyL0RlZmVycmVkJyk7XG4gICAgICAgICAgICBvcHRpb25zID0gXy5leHRlbmQoe30sIHRoaXMuZ2xvYmFsT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBhamF4T3B0aW9ucyA9IGFkanVzdE9wdGlvbnMocGF0aCwgcGFyYW1zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgY29uc3QgZCA9IG5ldyBEZWZlcnJlZCgpO1xuICAgICAgICAgICAgYWpheE9wdGlvbnMuc3VjY2VzcyA9IGQucmVzb2x2ZXIucmVzb2x2ZTtcbiAgICAgICAgICAgIGFqYXhPcHRpb25zLmVycm9yID0gZC5yZXNvbHZlci5yZWplY3Q7XG5cbiAgICAgICAgICAgIGNvbnN0IHAgPSBkLnByb21pc2U7XG5cbiAgICAgICAgICAgIGFqYXgucmVxdWVzdChhamF4T3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHJldHVybiBwLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5piv6L2s5ZCR6KGM5Li677yM55u05o6l6L2s5ZCR77yM5pW05L2T6L2s5Li6cmVqZWN0XG4gICAgICAgICAgICAgICAgaWYgKF8uaXNPYmplY3QocmVzcG9uc2UpICYmIHJlc3BvbnNlLnJlZGlyZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLlJFUV9DT0RFLlJFRElSRUNULFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzYzogc3RhdHVzLlJFUV9DT0RFX0RFU0MuUkVESVJFQ1QsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWRpcmVjdHVybDogcmVzcG9uc2UucmVkaXJlY3R1cmwgfHwgZ2V0UmVkaXJlY3RVcmwob3B0aW9ucy5iYXNlVXJsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICB9LCAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBodHRwU3RhdHVzID0gZXJyb3Iuc3RhdHVzO1xuXG4gICAgICAgICAgICAgICAgaWYgKGh0dHBTdGF0dXMgPT09IDQwOCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1cy5SRVFfQ09ERS5USU1FT1VULFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzYzogc3RhdHVzLlJFUV9DT0RFX0RFU0MuVElNRU9VVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGh0dHBTdGF0dXMgPCAyMDAgfHwgKGh0dHBTdGF0dXMgPj0gMzAwICYmIGh0dHBTdGF0dXMgIT09IDMwNCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cge1xuICAgICAgICAgICAgICAgICAgICAgICAgaHR0cFN0YXR1czogaHR0cFN0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLlJFUV9DT0RFLlJFUVVFU1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjOiBzdGF0dXMuUkVRX0NPREVfREVTQy5SRVFVRVNUX0VSUk9SLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aHJvdyB7XG4gICAgICAgICAgICAgICAgICAgIGh0dHBTdGF0dXM6IGh0dHBTdGF0dXMsXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLlJFUV9DT0RFLlJFUVVFU1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgIGRlc2M6IHN0YXR1cy5SRVFfQ09ERV9ERVNDLlJFUVVFU1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBKU09OLnN0cmluZ2lmeShlcnJvci5lcnJvciksXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiBudWxsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFqYXg7XG59KTtcbiJdfQ==