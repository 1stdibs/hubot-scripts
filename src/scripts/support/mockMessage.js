
var message = {};

message.send = function (txt) {
    console.log('Dibsy: ' + txt);
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
