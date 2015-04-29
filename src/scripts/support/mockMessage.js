
var message = {};
var logger = require('./logger');

message.send = function (txt) {
    logger.dibsyInfo(txt);
};

message.message = {
    user : {
        id : 1
    }
};

module.exports = function (robot) {
    message.robot = robot;
    return message;
};
