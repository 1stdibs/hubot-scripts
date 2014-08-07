
var URL = "" + process.env.HUBOT_SPOT_URL;
var util = require('util');
var timeout = 5000;

module.exports = function (message, path, action, options, callback) {
    var resolved = false;
    setTimeout(function () {
        if (!resolved) {
            callback(util.format('Request took longer than %s seconds to resolve...', (timeout / 1000).toFixed(2)));
        }
    }, timeout);
    return message.http("" + URL + path).query(options)[action]()(function (err, res, body) {
        resolved = true;
        return callback(err, res, body);
    });
};

