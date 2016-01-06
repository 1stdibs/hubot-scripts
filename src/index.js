
var fs = require('fs');
var Path = require('path');

var scripts = [
    'slam.js',
    'pokemonfusion.js',
    'petoverflow.js',
    'nugme.coffee',
    'mta.coffee',
    'spot.js',
    'tubeme.js',
    'sonos.js',
    'announceVersion.js',
    'new-jenkins-notifier.js',
    'kegbot.coffee',
    'kegbot-alerts.js',
    'scorekeeper.coffee'
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
