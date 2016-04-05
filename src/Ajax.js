'use strict';

const defaultSettings = require('./defaultSettings');
const url = require('url');

const _ = require('underscore');
const jsonType = 'application/json';
const htmlType = 'text/html';
const blankRE = /^\s*$/;
const scriptTypeRE = /^(?:text|application)\/javascript/i;
const xmlTypeRE = /^(?:text|application)\/xml/i;

const appendQuery = (url, query) => (
    (url + '&' + query).replace(/[&?]{1,2}/, '?')
);

const mimeToDataType = (mime) => (
    mime && (mime === htmlType ? 'html' :
        mime === jsonType ? 'json' :
            scriptTypeRE.test(mime) ? 'script' :
            xmlTypeRE.test(mime) && 'xml') || 'text'
);



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
    let params = [];
    params.add = function(k, v) {
        this.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    };
    serialize(params, obj);

    return params.join('&').replace('%20', '+');
};

const serialize = (params, obj, scope) => {
    let isArray = _.isArray(obj);
    for (let key in obj) {
        let value = obj[key];
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
    let settings = _.extend({}, defaultSettings, options || {});

    ajaxStart(settings);

    if (!settings.url) {
        throw new Error('setting url is undefined');
    }

    settings.url = url.resolve(settings.baseUrl, settings.url);
    settings.url = appendQuery(settings.url, `path=${options.path}`);
    settings.url = appendQuery(settings.url, param(settings.urlParams));

    let dataType = settings.dataType;
    let hasPlaceholder = /=\?/.test(settings.url);
    if (dataType === 'jsonp' || hasPlaceholder) {
        if (!hasPlaceholder) {
            settings.url = appendQuery(settings.url, 'callback=?');
        }
        return ajax.JSONP(settings);
    }

    serializeData(settings);

    let mime = settings.accepts[dataType];
    let baseHeads = {};
    let protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : 'http';
    let xhr = settings.xhr();
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
                        (1,eval)(result);
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

    var async = 'async' in settings ? settings.async : true;
    xhr.open(settings.type, settings.url, async);

    for (let name in settings.headers) {
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
    let context = settings.context;
    if (settings.beforeSend.call(context, xhr, settings) === false
        || triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false) {
        return false;
    }
    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings]);
};

const ajaxSuccess = (data, xhr, settings) => {
    let context = settings.context;
    let status = 'success';
    settings.success.call(context, data, status, xhr);
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data]);
    ajaxComplete(status, xhr, settings);
};

// type: "timeout", "error", "abort", "parseerror"
const ajaxError = (error, type, xhr, settings) => {
    let context = settings.context;
    settings.error.call(context, xhr, type, error);
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error]);
    ajaxComplete(type, xhr, settings);
};

// status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
const ajaxComplete = (status, xhr, settings) => {
    let context = settings.context;
    settings.complete.call(context, xhr, status);
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings]);
    ajaxStop(settings);
};
// hooks end

const rand16Num = (len) => {
    len = len || 0;
    let results = [];
    for (let i = 0; i < len; i++) {
        results.push('0123456789abcdef'.charAt(
            Math.floor(Math.random() * 16))
        );
    }
    return results.join('');
};

const uid = () => [(new Date()).valueOf().toString(), rand16Num(4)].join('');

const guid = () => {
    let curr = (new Date()).valueOf().toString();
    return ['4b534c46', rand16Num(4), '4' + rand16Num(3), rand16Num(4), curr.substring(0, 12)].join('-');
};

const adjustOptions = (path, params, options) => {
    options = options || {};

    let userid = options.userid || '';
    let token = options.token || '';
    let reqId = options.reqId || uid();
    let eventId = options.eventId || guid();
    let secret = options.secret;
    let source = options.source;

    params = JSON.stringify(params || {});

    let data = {reqId, userid, token, path, eventId, params};
    secret && (data.secret = secret);
    source && (data.source = source);

    let urlParams = {reqId};

    let omitNames = ['userid', 'token', 'reqId', 'eventId', 'secret', 'source']
    let otherOptions = _.omit(options, omitNames);

    return _.extend(otherOptions, {path, data, urlParams});
};

class Ajax {
    constructor(globalOptions) {
        this.globalOptions = globalOptions || {};
    }

    request(path, params, options) {
        options = _.extend({}, this.globalOptions, options);
        let ajaxOptions = adjustOptions(path, params, options);

        let p = new Promise((resolve, reject) => {
            ajaxOptions.success = resolve;
            ajaxOptions.error = reject
        });

        ajax.request(ajaxOptions)

        return p;
    }
}

module.exports = Ajax;
