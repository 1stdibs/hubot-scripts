
var assoc = {},
    dictionary = {};

assoc.setRobot = function (robot) {
    assoc.robot = robot;
    return assoc;
};

assoc.set = function (uri, userName) {
    dictionary[uri] = userName;
};

assoc.get = function (uri) {
    return dictionary[uri];
};

module.exports = assoc.setRobot;

