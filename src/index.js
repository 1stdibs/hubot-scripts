
var fs = require('fs'),
    Path = require('path'),
    scripts;

scripts = [
    'pokeblender.js',
    'mta.coffee',
    "redis-brain.coffee", "tweet.coffee", "shipit.coffee", "brewerydb.coffee", "applause.coffee", "ambush.coffee", "dealwithit.coffee", "decide.coffee", "futurama.coffee", "fortune.coffee", "hashing.coffee", "github-activity.coffee", "github-commit-link.coffee", "github-commits.coffee", "github-pulls.coffee", "http-say.coffee", "isup.coffee", "jenkins-notifier.coffee", "phpdoc.coffee", "scotch.coffee", "sudo.coffee", "swanson.coffee", "wikipedia.coffee", "wunderground.coffee", "xkcd.coffee", 'spot.coffee'
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
