if (typeof define !== 'function') {var define = require('amdefine')(module)}

define(function (require) {
    'use strict';

    const defaultSettings = require('./defaultSettings');

    const _ = require('underscore');
    const status = require('./status');
    const jsonType = 'application/json';
    const htmlType = 'text/html';
    const blankRE = /^\s*$/;
    const scriptTypeRE = /^(?:text|application)\/javascript/i;
    const xmlTypeRE = /^(?:text|application)\/xml/i;
    const Deferred = require('fc-er/Deferred');

    const appendQuery = (url, query) => (
        (url + '&' + query).replace(/[&?]{1,2}/, '?')
    );

    const mimeToDataType = (mime) => (
        mime && (mime === htmlType ? 'html' :
            mime === jsonType ? 'json' :
                scriptTypeRE.test(mime) ? 'script' :
                xmlTypeRE.test(mime) && 'xml') || 'text'
    );

    const stripTailPathPartition = (path) => {
        const tailSlashIndex = path.lastIndexOf('/');
        if (tailSlashIndex === -1) {
            return null;
        }
        return path.substring(0, tailSlashIndex);
    };

    const sanityPath = (url) => {
        const hashSeparatorIndex = url.lastIndexOf('#');
        if (hashSeparatorIndex >= 0) {
            url = url.substring(0, hashSeparatorIndex);
        }
        const searchSeparatorIndex = url.lastIndexOf('?');
        if (searchSeparatorIndex >= 0) {
            url = url.substring(0, searchSeparatorIndex);
        }

        const lastSlashIndex = url.lastIndexOf('/');
        if (lastSlashIndex >= 0) {
            url = url.substring(0, lastSlashIndex);
        }

        return url;
    };

    const urlResolve = (source, relative) => {
        const orginalSource = source;
        source = sanityPath(source);

        const match = source.match(/(https?:\/\/)?(.*)/);
        const protocol = (match && match[1]) || '';
        let path = (match && match[2]) || '';

        const relativeArr = relative.split('/')
        for (let i = 0, len = relativeArr.length; i < len; i++) {
            switch (relativeArr[i]) {
                case '..':
                    if ((path = stripTailPathPartition(path)) == null) {
                        return orginalSource;
                    }
                    break;
                case '.':
                    break;
                default:
                    path = `${path}/${relativeArr[i]}`;
                    break;
            }
        }
        return `${protocol}${path}`;
    };

// serialize payload and append it to the URL for GET requests
    const serializeData = (options) => {
        if (options.data && typeof options.data === 'object') {
            options.data = param(options.data);
        }
        if (options.data && (!options.type || options.type.toUpperCase() === 'GET')) {
            options.url = appendQuery(options.url, options.data);
        }
    };

    const param = (obj) => {
        const params = [];
        params.add = function(k, v) {
            this.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        };
        serialize(params, obj);

        return params.join('&').replace('%20', '+');
    };

    const serialize = (params, obj, scope) => {
        const isArray = _.isArray(obj);
        for (let key in obj) {
            const value = obj[key];
            if (scope) {
                key = isArray ? scope : `${scope}.${key}`;
            }
            if (!scope && isArray) {
                params.add(value.name, value.value);
            }
            else if (typeof value === 'object') {
                serialize(params, value, key);
            }
            else {
                params.add(key, value);
            }
        }
    };

    const request = (options) => {
        const settings = _.extend({}, defaultSettings, options || {});

        ajaxStart(settings);

        if (!settings.url) {
            throw new Error('setting url is undefined');
        }

        if (settings.baseUrl) {
            settings.url = urlResolve(settings.baseUrl, settings.url);
        }
        settings.url = appendQuery(settings.url, `path=${options.path}`);
        settings.url = appendQuery(settings.url, param(settings.urlParams));

        let dataType = settings.dataType;
        const hasPlaceholder = /=\?/.test(settings.url);
        if (dataType === 'jsonp' || hasPlaceholder) {
            if (!hasPlaceholder) {
                settings.url = appendQuery(settings.url, 'callback=?');
            }
            return ajax.JSONP(settings);
        }

        serializeData(settings);

        let mime = settings.accepts[dataType];
        const baseHeads = {};
        const protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : 'http';
        const xhr = settings.xhr();
        xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
        let abortTimeout;

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
        if (settings.contentType || (settings.data && settings.type.toUpperCase() !== 'Get')) {
            baseHeads['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded');
        }
        settings.headers = _.extend(baseHeads, settings.headers || {});

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                clearTimeout(abortTimeout);
                let result;
                let error = false
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304
                    || (xhr.status === 0 && protocol === 'file:')) {
                    dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'));
                    result = xhr.responseText;

                    try {
                        if (dataType === 'script') {
                            (1, eval)(result);
                        }
                        else if (dataType === 'xml') {
                            result = xhr.responseXML;
                        }
                        else if (dataType === 'json') {
                            result = blankRE.test(result) ? null : JSON.parse(result);
                        }
                    }
                    catch (e) {
                        error = e;
                    }

                    if (error) {
                        ajaxError(error, 'parsererror', xhr, settings);
                    }
                    else {
                        ajaxSuccess(result, xhr, settings);
                    }
                }
                else {
                    ajaxError(null, 'error', xhr, settings);
                }
            }
        };

        const async = 'async' in settings ? settings.async : true;
        xhr.open(settings.type, settings.url, async);

        for (const name in settings.headers) {
            xhr.setRequestHeader(name, settings.headers[name]);
        }

        if (ajaxBeforeSend(xhr, settings) === false) {
            xhr.abort();
            return false;
        }

        if (settings.timeout > 0) {
            abortTimeout = setTimeout(() => {
                xhr.onreadystatechange = () => {};
                xhr.abort();
                ajaxError(null, 'timeout', xhr, settings);
            }, settings.timeout);
        }

        // avoid sending empty string
        xhr.send(settings.data ? settings.data : null);
        return xhr;
    };

    const ajax = {};

    ajax.request = request;

    ajax.get = (url, success) => (
        request({url, success})
    );

    ajax.post = (url, data, success, dataType) => {
        if (typeof data === 'function') {
            dataType = dataType || success;
            success = data;
            data = null;
        }
        return request({
            type: 'POST',
            url,
            data,
            success,
            dataType
        });
    };

    ajax.getJSON = (url, success) => (
        request({url, success, dataType: 'json'})
    );

// hooks start
    ajax.active = 0;

// trigger a custom event and return false if it was cancelled
    const triggerAndReturn = (context, eventName, data) => {
        // todo: Fire off some events
        return true;
    };

// trigger an Ajax "global" event
    const triggerGlobal = (settings, context, eventName, data) => {
        if (settings.global) {
            return triggerAndReturn(context || global.document, eventName, data);
        }
    };

    const ajaxStart = (settings) => {
        if (settings.global && ajax.active++ === 0) {
            triggerGlobal(settings, null, 'ajaxStart');
        }
    };

    const ajaxStop = (settings) => {
        if (settings.global && !(--ajax.active)) {
            triggerGlobal(settings, null, 'ajaxStop');
        }
    };

// triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    const ajaxBeforeSend = (xhr, settings) => {
        const context = settings.context;
        if (settings.beforeSend.call(context, xhr, settings) === false
            || triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false) {
            return false;
        }
        triggerGlobal(settings, context, 'ajaxSend', [xhr, settings]);
    };

    const ajaxSuccess = (data, xhr, settings) => {
        const context = settings.context;
        const status = 'success';
        settings.success.call(context, data, status, xhr);
        triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data]);
        ajaxComplete(status, xhr, settings);
    };

// type: "timeout", "error", "abort", "parseerror"
    const ajaxError = (error, type, xhr, settings) => {
        const context = settings.context;
        settings.error.call(context, xhr, type, error);
        triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error]);
        ajaxComplete(type, xhr, settings);
    };

// status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    const ajaxComplete = (status, xhr, settings) => {
        const context = settings.context;
        settings.complete.call(context, xhr, status);
        triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings]);
        ajaxStop(settings);
    };
// hooks end

    const rand16Num = (len) => {
        len = len || 0;
        const results = [];
        for (let i = 0; i < len; i++) {
            results.push('0123456789abcdef'.charAt(
                Math.floor(Math.random() * 16))
            );
        }
        return results.join('');
    };

    const uid = () => [(new Date()).valueOf().toString(), rand16Num(4)].join('');

    const guid = () => {
        const curr = (new Date()).valueOf().toString();
        return ['4b534c46', rand16Num(4), '4' + rand16Num(3), rand16Num(4), curr.substring(0, 12)].join('-');
    };

    const adjustOptions = (path, params, options) => {
        options = options || {};

        const userid = options.userid || '';
        const token = options.token || '';
        const reqId = options.reqId || uid();
        const eventId = options.eventId || guid();
        const secret = options.secret;
        const source = options.source;

        params = JSON.stringify(params || {});

        const data = {reqId, userid, token, path, eventId, params};
        secret && (data.secret = secret);
        source && (data.source = source);

        const urlParams = {reqId};

        const omitNames = ['userid', 'token', 'reqId', 'eventId', 'secret', 'source']
        const otherOptions = _.omit(options, omitNames);

        return _.extend(otherOptions, {path, data, urlParams});
    };

    const getRedirectUrl = (baseUrl) => {
        if (baseUrl == null) {
            baseUrl = global.location.href;
        }

        const querySeparatorIndex = baseUrl.indexOf('?');
        const search = querySeparatorIndex === -1 ? '' : baseUrl.substring(querySeparatorIndex);

        return urlResolve(baseUrl, 'main.do') + search;
    };

    class Ajax {
        constructor(globalOptions) {
            this.globalOptions = globalOptions || {};
        }

        request(path, params, options) {
            options = _.extend({}, this.globalOptions, options);
            const ajaxOptions = adjustOptions(path, params, options);

            const d = new Deferred();
            ajaxOptions.success = d.resolver.resolve;
            ajaxOptions.error = d.resolver.reject;

            const p = d.promise;

            ajax.request(ajaxOptions);

            return p.then((response) => {
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
            }, (error) => {
                const httpStatus = error.status;

                if (httpStatus === 408) {
                    throw {
                        status: status.REQ_CODE.TIMEOUT,
                        desc: status.REQ_CODE_DESC.TIMEOUT,
                        response: null
                    };
                }

                if (httpStatus < 200 || (httpStatus >= 300 && httpStatus !== 304)) {
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
    }

    return Ajax;
});
