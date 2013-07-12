
var message = {};

message.send = function (txt) {
    console.log('Dibsy: ' + txt);
};

module.exports = function (robot) {
    message.robot = robot;
    return message;
};
