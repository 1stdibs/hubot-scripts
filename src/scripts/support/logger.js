
var colors = require('colors');
var util = require('util');
var logger = {};
var jenkins = '[Jenkins]'.green;
var build = 'BUILD'.magenta;
var dibsy = '[Dibsy]'.yellow;
var spot = '[Spot]'.yellow;
var _ = require('underscore');

function buildFullUrl(baseUrl, params) {
    params = params || {};
    if (_.keys(params).length == 0) {
        return baseUrl;
    }
    var joiner = (/\?/.test(baseUrl)) ? '&' : '?';
    _.each(params, function (val, key) {
        baseUrl += joiner + key + '=' + encodeURIComponent(val);
        joiner = '&';
    });
    return baseUrl;
}

logger.jenkins = function (what) {
    var args = [].slice.call(arguments);
    if (args.length > 1) {
        what = util.format.apply(util, arguments);
    }
    console.log('%s : %s', jenkins, what);
};

logger.build = function (what) {
    var args = [].slice.call(arguments);
    if (args.length > 1) {
        what = util.format.apply(util, arguments);
    }
    logger.jenkins('%s : %s', build, what);
};

logger.spotRequest = function spotRequest(method, url, params) {
    method = method || "GET";
    url = url || '';
    params = params || {};
    console.log('%s : %s %s', spot, method.toUpperCase(), buildFullUrl(url, params));
};

logger.dibsyInfo = function (what) {
    var args = [].slice.call(arguments);
    if (args.length > 1) {
        what = util.format.apply(util, arguments);
    }
    console.log('%s : %s', dibsy, what);
};

logger.minorDibsyInfo = function (what) {
    var args = [].slice.call(arguments);
    if (args.length > 1) {
        what = util.format.apply(util, arguments);
    }
    logger.minorInfo(util.format(' %s - %s', dibsy, what).reset);
};

logger.minorInfo = function (what) {
    var args = [].slice.call(arguments);
    if (args.length > 1) {
        what = util.format.apply(util, arguments);
    }
    console.log('...%s'.grey, what);
};

logger.requestResolution = function (url, status) {
    logger.minorInfo('request resolved: [%s] : %s'.grey, status, url);
};

logger.error = function (error, info) {
    console.log('ERROR'.red.bold);
    console.log(error);
    if (error.stack) {
        console.log(error.stack);
    }
    if (info) {
        console.log('Additional Info'.yellow);
        console.log(JSON.stringify(info, void 0, ' '));
    }
};

module.exports = logger;

