
var robot = {data : {}};

robot.http = require('scoped-http-client').create;
robot.brain = {
    get : function (key) {
        return robot.data[key];
    },
    set : function (key, val) {
        return robot.data[key] = val;
    }
}

module.exports = robot;
