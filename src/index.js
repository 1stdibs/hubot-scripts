
var fs = require('fs');
var Path = require('path');

var scripts = [
    'pokemonfusion.js',
    'petoverflow.js',
    'nugme.coffee',
    'mta.coffee',
    'spot.js',
    'hr.js',
    'announceVersion.js',
    'new-jenkins-notifier.js',
    'kegbot.coffee',
    'kegbot-alerts.js'
];

module.exports = function (robot) {
    var path = Path.resolve(__dirname, 'scripts');
    fs.exists(path, function (exists) {
        if (exists) {
            scripts.forEach(function (file) {
                robot.loadFile(path, file);
            });
        }
    });
};
