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
    var url = require('url');

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
            settings.url = url.resolve(settings.baseUrl, settings.url);
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
        var search = url.parse(baseUrl).search || '';

        return url.resolve(baseUrl, 'main.do') + search;
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

                var p = new Promise(function (resolve, reject) {
                    ajaxOptions.success = resolve;
                    ajaxOptions.error = reject;
                });

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
//# sourceMappingURL=data:application/json;base64,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LENBQXRCO0FBQ0Esa0NBQVUsSUFBVjtxQkFMSixDQXBCVTtpQkFBWCxDQVhILENBWDJCOzs7OztRQW5VYjs7QUF3WHRCLFdBQU8sSUFBUCxDQXhYc0I7Q0FBbkIsQ0FBUCIsImZpbGUiOiJBamF4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHt2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUpfVxuXG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSByZXF1aXJlKCcuL2RlZmF1bHRTZXR0aW5ncycpO1xuICAgIGNvbnN0IHVybCA9IHJlcXVpcmUoJ3VybCcpO1xuXG4gICAgY29uc3QgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbiAgICBjb25zdCBzdGF0dXMgPSByZXF1aXJlKCcuL3N0YXR1cycpO1xuICAgIGNvbnN0IGpzb25UeXBlID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgIGNvbnN0IGh0bWxUeXBlID0gJ3RleHQvaHRtbCc7XG4gICAgY29uc3QgYmxhbmtSRSA9IC9eXFxzKiQvO1xuICAgIGNvbnN0IHNjcmlwdFR5cGVSRSA9IC9eKD86dGV4dHxhcHBsaWNhdGlvbilcXC9qYXZhc2NyaXB0L2k7XG4gICAgY29uc3QgeG1sVHlwZVJFID0gL14oPzp0ZXh0fGFwcGxpY2F0aW9uKVxcL3htbC9pO1xuXG4gICAgY29uc3QgYXBwZW5kUXVlcnkgPSAodXJsLCBxdWVyeSkgPT4gKFxuICAgICAgICAodXJsICsgJyYnICsgcXVlcnkpLnJlcGxhY2UoL1smP117MSwyfS8sICc/JylcbiAgICApO1xuXG4gICAgY29uc3QgbWltZVRvRGF0YVR5cGUgPSAobWltZSkgPT4gKFxuICAgICAgICBtaW1lICYmIChtaW1lID09PSBodG1sVHlwZSA/ICdodG1sJyA6XG4gICAgICAgICAgICBtaW1lID09PSBqc29uVHlwZSA/ICdqc29uJyA6XG4gICAgICAgICAgICAgICAgc2NyaXB0VHlwZVJFLnRlc3QobWltZSkgPyAnc2NyaXB0JyA6XG4gICAgICAgICAgICAgICAgeG1sVHlwZVJFLnRlc3QobWltZSkgJiYgJ3htbCcpIHx8ICd0ZXh0J1xuICAgICk7XG5cblxuXG4vLyBzZXJpYWxpemUgcGF5bG9hZCBhbmQgYXBwZW5kIGl0IHRvIHRoZSBVUkwgZm9yIEdFVCByZXF1ZXN0c1xuICAgIGNvbnN0IHNlcmlhbGl6ZURhdGEgPSAob3B0aW9ucykgPT4ge1xuICAgICAgICBpZiAob3B0aW9ucy5kYXRhICYmIHR5cGVvZiBvcHRpb25zLmRhdGEgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBvcHRpb25zLmRhdGEgPSBwYXJhbShvcHRpb25zLmRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmRhdGEgJiYgKCFvcHRpb25zLnR5cGUgfHwgb3B0aW9ucy50eXBlLnRvVXBwZXJDYXNlKCkgPT09ICdHRVQnKSkge1xuICAgICAgICAgICAgb3B0aW9ucy51cmwgPSBhcHBlbmRRdWVyeShvcHRpb25zLnVybCwgb3B0aW9ucy5kYXRhKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBwYXJhbSA9IChvYmopID0+IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gW107XG4gICAgICAgIHBhcmFtcy5hZGQgPSBmdW5jdGlvbihrLCB2KSB7XG4gICAgICAgICAgICB0aGlzLnB1c2goYCR7ZW5jb2RlVVJJQ29tcG9uZW50KGspfT0ke2VuY29kZVVSSUNvbXBvbmVudCh2KX1gKVxuICAgICAgICB9O1xuICAgICAgICBzZXJpYWxpemUocGFyYW1zLCBvYmopO1xuXG4gICAgICAgIHJldHVybiBwYXJhbXMuam9pbignJicpLnJlcGxhY2UoJyUyMCcsICcrJyk7XG4gICAgfTtcblxuICAgIGNvbnN0IHNlcmlhbGl6ZSA9IChwYXJhbXMsIG9iaiwgc2NvcGUpID0+IHtcbiAgICAgICAgY29uc3QgaXNBcnJheSA9IF8uaXNBcnJheShvYmopO1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgICAgICAgaWYgKHNjb3BlKSB7XG4gICAgICAgICAgICAgICAga2V5ID0gaXNBcnJheSA/IHNjb3BlIDogYCR7c2NvcGV9LiR7a2V5fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXNjb3BlICYmIGlzQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMuYWRkKHZhbHVlLm5hbWUsIHZhbHVlLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBzZXJpYWxpemUocGFyYW1zLCB2YWx1ZSwga2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcmFtcy5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgcmVxdWVzdCA9IChvcHRpb25zKSA9PiB7XG4gICAgICAgIGNvbnN0IHNldHRpbmdzID0gXy5leHRlbmQoe30sIGRlZmF1bHRTZXR0aW5ncywgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICAgICAgYWpheFN0YXJ0KHNldHRpbmdzKTtcblxuICAgICAgICBpZiAoIXNldHRpbmdzLnVybCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzZXR0aW5nIHVybCBpcyB1bmRlZmluZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZXR0aW5ncy5iYXNlVXJsKSB7XG4gICAgICAgICAgICBzZXR0aW5ncy51cmwgPSB1cmwucmVzb2x2ZShzZXR0aW5ncy5iYXNlVXJsLCBzZXR0aW5ncy51cmwpO1xuICAgICAgICB9XG4gICAgICAgIHNldHRpbmdzLnVybCA9IGFwcGVuZFF1ZXJ5KHNldHRpbmdzLnVybCwgYHBhdGg9JHtvcHRpb25zLnBhdGh9YCk7XG4gICAgICAgIHNldHRpbmdzLnVybCA9IGFwcGVuZFF1ZXJ5KHNldHRpbmdzLnVybCwgcGFyYW0oc2V0dGluZ3MudXJsUGFyYW1zKSk7XG5cbiAgICAgICAgbGV0IGRhdGFUeXBlID0gc2V0dGluZ3MuZGF0YVR5cGU7XG4gICAgICAgIGNvbnN0IGhhc1BsYWNlaG9sZGVyID0gLz1cXD8vLnRlc3Qoc2V0dGluZ3MudXJsKTtcbiAgICAgICAgaWYgKGRhdGFUeXBlID09PSAnanNvbnAnIHx8IGhhc1BsYWNlaG9sZGVyKSB7XG4gICAgICAgICAgICBpZiAoIWhhc1BsYWNlaG9sZGVyKSB7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MudXJsID0gYXBwZW5kUXVlcnkoc2V0dGluZ3MudXJsLCAnY2FsbGJhY2s9PycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFqYXguSlNPTlAoc2V0dGluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VyaWFsaXplRGF0YShzZXR0aW5ncyk7XG5cbiAgICAgICAgbGV0IG1pbWUgPSBzZXR0aW5ncy5hY2NlcHRzW2RhdGFUeXBlXTtcbiAgICAgICAgY29uc3QgYmFzZUhlYWRzID0ge307XG4gICAgICAgIGNvbnN0IHByb3RvY29sID0gL14oW1xcdy1dKzopXFwvXFwvLy50ZXN0KHNldHRpbmdzLnVybCkgPyBSZWdFeHAuJDEgOiAnaHR0cCc7XG4gICAgICAgIGNvbnN0IHhociA9IHNldHRpbmdzLnhocigpO1xuICAgICAgICB4aHIuc2V0RGlzYWJsZUhlYWRlckNoZWNrICYmIHhoci5zZXREaXNhYmxlSGVhZGVyQ2hlY2sodHJ1ZSk7XG4gICAgICAgIGxldCBhYm9ydFRpbWVvdXQ7XG5cbiAgICAgICAgaWYgKCFzZXR0aW5ncy5jcm9zc0RvbWFpbikge1xuICAgICAgICAgICAgYmFzZUhlYWRzWydYLVJlcXVlc3RlZC1XaXRoJ10gPSAnWE1MSHR0cFJlcXVlc3QnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtaW1lKSB7XG4gICAgICAgICAgICBiYXNlSGVhZHNbJ0FjY2VwdCddID0gbWltZTtcbiAgICAgICAgICAgIGlmIChtaW1lLmluZGV4T2YoJywnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgbWltZSA9IG1pbWUuc3BsaXQoJywnLCAyKVswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHhoci5vdmVycmlkZU1pbWVUeXBlICYmIHhoci5vdmVycmlkZU1pbWVUeXBlKG1pbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZXR0aW5ncy5jb250ZW50VHlwZSB8fCAoc2V0dGluZ3MuZGF0YSAmJiBzZXR0aW5ncy50eXBlLnRvVXBwZXJDYXNlKCkgIT09ICdHZXQnKSkge1xuICAgICAgICAgICAgYmFzZUhlYWRzWydDb250ZW50LVR5cGUnXSA9IChzZXR0aW5ncy5jb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0dGluZ3MuaGVhZGVycyA9IF8uZXh0ZW5kKGJhc2VIZWFkcywgc2V0dGluZ3MuaGVhZGVycyB8fCB7fSk7XG5cbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChhYm9ydFRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgICAgICAgICAgbGV0IGVycm9yID0gZmFsc2VcbiAgICAgICAgICAgICAgICBpZiAoKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHx8IHhoci5zdGF0dXMgPT09IDMwNFxuICAgICAgICAgICAgICAgICAgICB8fCAoeGhyLnN0YXR1cyA9PT0gMCAmJiBwcm90b2NvbCA9PT0gJ2ZpbGU6JykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGUgPSBkYXRhVHlwZSB8fCBtaW1lVG9EYXRhVHlwZSh4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ2NvbnRlbnQtdHlwZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geGhyLnJlc3BvbnNlVGV4dDtcblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFUeXBlID09PSAnc2NyaXB0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgxLCBldmFsKShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGF0YVR5cGUgPT09ICd4bWwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geGhyLnJlc3BvbnNlWE1MO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGF0YVR5cGUgPT09ICdqc29uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGJsYW5rUkUudGVzdChyZXN1bHQpID8gbnVsbCA6IEpTT04ucGFyc2UocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IgPSBlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhamF4RXJyb3IoZXJyb3IsICdwYXJzZXJlcnJvcicsIHhociwgc2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWpheFN1Y2Nlc3MocmVzdWx0LCB4aHIsIHNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYWpheEVycm9yKG51bGwsICdlcnJvcicsIHhociwgc2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBhc3luYyA9ICdhc3luYycgaW4gc2V0dGluZ3MgPyBzZXR0aW5ncy5hc3luYyA6IHRydWU7XG4gICAgICAgIHhoci5vcGVuKHNldHRpbmdzLnR5cGUsIHNldHRpbmdzLnVybCwgYXN5bmMpO1xuXG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBpbiBzZXR0aW5ncy5oZWFkZXJzKSB7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCBzZXR0aW5ncy5oZWFkZXJzW25hbWVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhamF4QmVmb3JlU2VuZCh4aHIsIHNldHRpbmdzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHhoci5hYm9ydCgpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNldHRpbmdzLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICBhYm9ydFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge307XG4gICAgICAgICAgICAgICAgeGhyLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgYWpheEVycm9yKG51bGwsICd0aW1lb3V0JywgeGhyLCBzZXR0aW5ncyk7XG4gICAgICAgICAgICB9LCBzZXR0aW5ncy50aW1lb3V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGF2b2lkIHNlbmRpbmcgZW1wdHkgc3RyaW5nXG4gICAgICAgIHhoci5zZW5kKHNldHRpbmdzLmRhdGEgPyBzZXR0aW5ncy5kYXRhIDogbnVsbCk7XG4gICAgICAgIHJldHVybiB4aHI7XG4gICAgfTtcblxuICAgIGNvbnN0IGFqYXggPSB7fTtcblxuICAgIGFqYXgucmVxdWVzdCA9IHJlcXVlc3Q7XG5cbiAgICBhamF4LmdldCA9ICh1cmwsIHN1Y2Nlc3MpID0+IChcbiAgICAgICAgcmVxdWVzdCh7dXJsLCBzdWNjZXNzfSlcbiAgICApO1xuXG4gICAgYWpheC5wb3N0ID0gKHVybCwgZGF0YSwgc3VjY2VzcywgZGF0YVR5cGUpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBkYXRhVHlwZSA9IGRhdGFUeXBlIHx8IHN1Y2Nlc3M7XG4gICAgICAgICAgICBzdWNjZXNzID0gZGF0YTtcbiAgICAgICAgICAgIGRhdGEgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXF1ZXN0KHtcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgZGF0YVR5cGVcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFqYXguZ2V0SlNPTiA9ICh1cmwsIHN1Y2Nlc3MpID0+IChcbiAgICAgICAgcmVxdWVzdCh7dXJsLCBzdWNjZXNzLCBkYXRhVHlwZTogJ2pzb24nfSlcbiAgICApO1xuXG4vLyBob29rcyBzdGFydFxuICAgIGFqYXguYWN0aXZlID0gMDtcblxuLy8gdHJpZ2dlciBhIGN1c3RvbSBldmVudCBhbmQgcmV0dXJuIGZhbHNlIGlmIGl0IHdhcyBjYW5jZWxsZWRcbiAgICBjb25zdCB0cmlnZ2VyQW5kUmV0dXJuID0gKGNvbnRleHQsIGV2ZW50TmFtZSwgZGF0YSkgPT4ge1xuICAgICAgICAvLyB0b2RvOiBGaXJlIG9mZiBzb21lIGV2ZW50c1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4vLyB0cmlnZ2VyIGFuIEFqYXggXCJnbG9iYWxcIiBldmVudFxuICAgIGNvbnN0IHRyaWdnZXJHbG9iYWwgPSAoc2V0dGluZ3MsIGNvbnRleHQsIGV2ZW50TmFtZSwgZGF0YSkgPT4ge1xuICAgICAgICBpZiAoc2V0dGluZ3MuZ2xvYmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJpZ2dlckFuZFJldHVybihjb250ZXh0IHx8IGdsb2JhbC5kb2N1bWVudCwgZXZlbnROYW1lLCBkYXRhKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBhamF4U3RhcnQgPSAoc2V0dGluZ3MpID0+IHtcbiAgICAgICAgaWYgKHNldHRpbmdzLmdsb2JhbCAmJiBhamF4LmFjdGl2ZSsrID09PSAwKSB7XG4gICAgICAgICAgICB0cmlnZ2VyR2xvYmFsKHNldHRpbmdzLCBudWxsLCAnYWpheFN0YXJ0Jyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgYWpheFN0b3AgPSAoc2V0dGluZ3MpID0+IHtcbiAgICAgICAgaWYgKHNldHRpbmdzLmdsb2JhbCAmJiAhKC0tYWpheC5hY3RpdmUpKSB7XG4gICAgICAgICAgICB0cmlnZ2VyR2xvYmFsKHNldHRpbmdzLCBudWxsLCAnYWpheFN0b3AnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbi8vIHRyaWdnZXJzIGFuIGV4dHJhIGdsb2JhbCBldmVudCBcImFqYXhCZWZvcmVTZW5kXCIgdGhhdCdzIGxpa2UgXCJhamF4U2VuZFwiIGJ1dCBjYW5jZWxhYmxlXG4gICAgY29uc3QgYWpheEJlZm9yZVNlbmQgPSAoeGhyLCBzZXR0aW5ncykgPT4ge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gc2V0dGluZ3MuY29udGV4dDtcbiAgICAgICAgaWYgKHNldHRpbmdzLmJlZm9yZVNlbmQuY2FsbChjb250ZXh0LCB4aHIsIHNldHRpbmdzKSA9PT0gZmFsc2VcbiAgICAgICAgICAgIHx8IHRyaWdnZXJHbG9iYWwoc2V0dGluZ3MsIGNvbnRleHQsICdhamF4QmVmb3JlU2VuZCcsIFt4aHIsIHNldHRpbmdzXSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdHJpZ2dlckdsb2JhbChzZXR0aW5ncywgY29udGV4dCwgJ2FqYXhTZW5kJywgW3hociwgc2V0dGluZ3NdKTtcbiAgICB9O1xuXG4gICAgY29uc3QgYWpheFN1Y2Nlc3MgPSAoZGF0YSwgeGhyLCBzZXR0aW5ncykgPT4ge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gc2V0dGluZ3MuY29udGV4dDtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gJ3N1Y2Nlc3MnO1xuICAgICAgICBzZXR0aW5ncy5zdWNjZXNzLmNhbGwoY29udGV4dCwgZGF0YSwgc3RhdHVzLCB4aHIpO1xuICAgICAgICB0cmlnZ2VyR2xvYmFsKHNldHRpbmdzLCBjb250ZXh0LCAnYWpheFN1Y2Nlc3MnLCBbeGhyLCBzZXR0aW5ncywgZGF0YV0pO1xuICAgICAgICBhamF4Q29tcGxldGUoc3RhdHVzLCB4aHIsIHNldHRpbmdzKTtcbiAgICB9O1xuXG4vLyB0eXBlOiBcInRpbWVvdXRcIiwgXCJlcnJvclwiLCBcImFib3J0XCIsIFwicGFyc2VlcnJvclwiXG4gICAgY29uc3QgYWpheEVycm9yID0gKGVycm9yLCB0eXBlLCB4aHIsIHNldHRpbmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBzZXR0aW5ncy5jb250ZXh0O1xuICAgICAgICBzZXR0aW5ncy5lcnJvci5jYWxsKGNvbnRleHQsIHhociwgdHlwZSwgZXJyb3IpO1xuICAgICAgICB0cmlnZ2VyR2xvYmFsKHNldHRpbmdzLCBjb250ZXh0LCAnYWpheEVycm9yJywgW3hociwgc2V0dGluZ3MsIGVycm9yXSk7XG4gICAgICAgIGFqYXhDb21wbGV0ZSh0eXBlLCB4aHIsIHNldHRpbmdzKTtcbiAgICB9O1xuXG4vLyBzdGF0dXM6IFwic3VjY2Vzc1wiLCBcIm5vdG1vZGlmaWVkXCIsIFwiZXJyb3JcIiwgXCJ0aW1lb3V0XCIsIFwiYWJvcnRcIiwgXCJwYXJzZXJlcnJvclwiXG4gICAgY29uc3QgYWpheENvbXBsZXRlID0gKHN0YXR1cywgeGhyLCBzZXR0aW5ncykgPT4ge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gc2V0dGluZ3MuY29udGV4dDtcbiAgICAgICAgc2V0dGluZ3MuY29tcGxldGUuY2FsbChjb250ZXh0LCB4aHIsIHN0YXR1cyk7XG4gICAgICAgIHRyaWdnZXJHbG9iYWwoc2V0dGluZ3MsIGNvbnRleHQsICdhamF4Q29tcGxldGUnLCBbeGhyLCBzZXR0aW5nc10pO1xuICAgICAgICBhamF4U3RvcChzZXR0aW5ncyk7XG4gICAgfTtcbi8vIGhvb2tzIGVuZFxuXG4gICAgY29uc3QgcmFuZDE2TnVtID0gKGxlbikgPT4ge1xuICAgICAgICBsZW4gPSBsZW4gfHwgMDtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goJzAxMjM0NTY3ODlhYmNkZWYnLmNoYXJBdChcbiAgICAgICAgICAgICAgICBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxNikpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzLmpvaW4oJycpO1xuICAgIH07XG5cbiAgICBjb25zdCB1aWQgPSAoKSA9PiBbKG5ldyBEYXRlKCkpLnZhbHVlT2YoKS50b1N0cmluZygpLCByYW5kMTZOdW0oNCldLmpvaW4oJycpO1xuXG4gICAgY29uc3QgZ3VpZCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgY3VyciA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCkudG9TdHJpbmcoKTtcbiAgICAgICAgcmV0dXJuIFsnNGI1MzRjNDYnLCByYW5kMTZOdW0oNCksICc0JyArIHJhbmQxNk51bSgzKSwgcmFuZDE2TnVtKDQpLCBjdXJyLnN1YnN0cmluZygwLCAxMildLmpvaW4oJy0nKTtcbiAgICB9O1xuXG4gICAgY29uc3QgYWRqdXN0T3B0aW9ucyA9IChwYXRoLCBwYXJhbXMsIG9wdGlvbnMpID0+IHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgY29uc3QgdXNlcmlkID0gb3B0aW9ucy51c2VyaWQgfHwgJyc7XG4gICAgICAgIGNvbnN0IHRva2VuID0gb3B0aW9ucy50b2tlbiB8fCAnJztcbiAgICAgICAgY29uc3QgcmVxSWQgPSBvcHRpb25zLnJlcUlkIHx8IHVpZCgpO1xuICAgICAgICBjb25zdCBldmVudElkID0gb3B0aW9ucy5ldmVudElkIHx8IGd1aWQoKTtcbiAgICAgICAgY29uc3Qgc2VjcmV0ID0gb3B0aW9ucy5zZWNyZXQ7XG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IG9wdGlvbnMuc291cmNlO1xuXG4gICAgICAgIHBhcmFtcyA9IEpTT04uc3RyaW5naWZ5KHBhcmFtcyB8fCB7fSk7XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IHtyZXFJZCwgdXNlcmlkLCB0b2tlbiwgcGF0aCwgZXZlbnRJZCwgcGFyYW1zfTtcbiAgICAgICAgc2VjcmV0ICYmIChkYXRhLnNlY3JldCA9IHNlY3JldCk7XG4gICAgICAgIHNvdXJjZSAmJiAoZGF0YS5zb3VyY2UgPSBzb3VyY2UpO1xuXG4gICAgICAgIGNvbnN0IHVybFBhcmFtcyA9IHtyZXFJZH07XG5cbiAgICAgICAgY29uc3Qgb21pdE5hbWVzID0gWyd1c2VyaWQnLCAndG9rZW4nLCAncmVxSWQnLCAnZXZlbnRJZCcsICdzZWNyZXQnLCAnc291cmNlJ11cbiAgICAgICAgY29uc3Qgb3RoZXJPcHRpb25zID0gXy5vbWl0KG9wdGlvbnMsIG9taXROYW1lcyk7XG5cbiAgICAgICAgcmV0dXJuIF8uZXh0ZW5kKG90aGVyT3B0aW9ucywge3BhdGgsIGRhdGEsIHVybFBhcmFtc30pO1xuICAgIH07XG5cbiAgICBjb25zdCBnZXRSZWRpcmVjdFVybCA9IChiYXNlVXJsKSA9PiB7XG4gICAgICAgIGlmIChiYXNlVXJsID09IG51bGwpIHtcbiAgICAgICAgICAgIGJhc2VVcmwgPSBnbG9iYWwubG9jYXRpb24uaHJlZjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZWFyY2ggPSB1cmwucGFyc2UoYmFzZVVybCkuc2VhcmNoIHx8ICcnO1xuXG4gICAgICAgIHJldHVybiB1cmwucmVzb2x2ZShiYXNlVXJsLCAnbWFpbi5kbycpICsgc2VhcmNoO1xuICAgIH07XG5cbiAgICBjbGFzcyBBamF4IHtcbiAgICAgICAgY29uc3RydWN0b3IoZ2xvYmFsT3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5nbG9iYWxPcHRpb25zID0gZ2xvYmFsT3B0aW9ucyB8fCB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3QocGF0aCwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gXy5leHRlbmQoe30sIHRoaXMuZ2xvYmFsT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBhamF4T3B0aW9ucyA9IGFkanVzdE9wdGlvbnMocGF0aCwgcGFyYW1zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgY29uc3QgcCA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBhamF4T3B0aW9ucy5zdWNjZXNzID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgICBhamF4T3B0aW9ucy5lcnJvciA9IHJlamVjdFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGFqYXgucmVxdWVzdChhamF4T3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHJldHVybiBwLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5piv6L2s5ZCR6KGM5Li677yM55u05o6l6L2s5ZCR77yM5pW05L2T6L2s5Li6cmVqZWN0XG4gICAgICAgICAgICAgICAgaWYgKF8uaXNPYmplY3QocmVzcG9uc2UpICYmIHJlc3BvbnNlLnJlZGlyZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLlJFUV9DT0RFLlJFRElSRUNULFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzYzogc3RhdHVzLlJFUV9DT0RFX0RFU0MuUkVESVJFQ1QsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWRpcmVjdHVybDogcmVzcG9uc2UucmVkaXJlY3R1cmwgfHwgZ2V0UmVkaXJlY3RVcmwob3B0aW9ucy5iYXNlVXJsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICB9LCAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBodHRwU3RhdHVzID0gZXJyb3Iuc3RhdHVzO1xuXG4gICAgICAgICAgICAgICAgaWYgKGh0dHBTdGF0dXMgPT09IDQwOCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1cy5SRVFfQ09ERS5USU1FT1VULFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzYzogc3RhdHVzLlJFUV9DT0RFX0RFU0MuVElNRU9VVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGh0dHBTdGF0dXMgPCAyMDAgfHwgKGh0dHBTdGF0dXMgPj0gMzAwICYmIGh0dHBTdGF0dXMgIT09IDMwNCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cge1xuICAgICAgICAgICAgICAgICAgICAgICAgaHR0cFN0YXR1czogaHR0cFN0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLlJFUV9DT0RFLlJFUVVFU1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjOiBzdGF0dXMuUkVRX0NPREVfREVTQy5SRVFVRVNUX0VSUk9SLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aHJvdyB7XG4gICAgICAgICAgICAgICAgICAgIGh0dHBTdGF0dXM6IGh0dHBTdGF0dXMsXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLlJFUV9DT0RFLlJFUVVFU1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgIGRlc2M6IHN0YXR1cy5SRVFfQ09ERV9ERVNDLlJFUVVFU1RfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBKU09OLnN0cmluZ2lmeShlcnJvci5lcnJvciksXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiBudWxsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFqYXg7XG59KTtcbiJdfQ==