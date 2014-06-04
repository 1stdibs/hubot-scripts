
var say = {};
var canSay = true;
var spotRequest = require('./spotRequest');

say.canSay = function () {
    return canSay;
};

function sayIt (what, message) {
    if (!say.canSay()) {
        message.send('...');
        return;
    }
    var params = {
        what: what
    };
    return spotRequest(message, '/say', 'put', params, function (err, res, body) {
        return message.send(what);
    });
}

say.attachToRobot = function (robot) {
    robot.respond(/say (.*)/i, function (message) {
        return sayIt(message.match[1], message);
    });
    robot.respond(/(please )?be quiet/i, function (message) {
        if (say.canSay()) {
            canSay = false;
            setTimeout(function () {
                canSay = true;
            }, message.match[1] ? 120000 : 60000);
        }
    });
};

module.exports = say;

