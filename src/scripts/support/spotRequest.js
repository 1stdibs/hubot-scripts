
var URL = "" + process.env.HUBOT_SPOT_URL;

module.exports = function (message, path, action, options, callback) {
    return message.http("" + URL + path).query(options)[action]()(function (err, res, body) {
        return callback(err, res, body);
    });
};

