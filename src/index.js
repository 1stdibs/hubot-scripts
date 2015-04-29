
var fs = require('fs');
var Path = require('path');

var scripts = [
    'pokemonfusion.js',
    'catoverflow.js',
    'nugme.coffee',
    'mta.coffee',
    'spot.js',
    'hr.js',
    'announceVersion.js',
    'new-jenkins-notifier.js'
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
