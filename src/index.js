
var fs = require('fs');
var Path = require('path');

var scripts = [
    'slam.js',
    'pokemonfusion.js',
    'petoverflow.js',
    // 'nugme.coffee',//The heroku is down/broken
    'mta.coffee',
    'spot.js',
    'tubeme.js',
    'sonos.js',
    'announceVersion.js',
    'new-jenkins-notifier.js',
    'kegbot.coffee',
    'kegbot-alerts.js',
    'spiderbomb.js',
    'scorekeeper.coffee',
    'shiabomb.js',
    'smokebomb.js',
    'turnup.js',
    'smashingbomb.js',
    'pandabomb.js'
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
