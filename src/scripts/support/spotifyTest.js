
var robot = require('./mockRobot'),
    templates = require('./spotifyTemplates'),
    message = require('./mockMessage')(robot),
    manager = require('./spotifyResultManager')(robot),
    MetaSpotify = require('./spotifyMetaData')(robot);

function handleTracks(err, data) {
    if (err) {
        message.send(':flushed: ' + err);
        return;
    }
    var index = manager.persist(data, 'tracks'),
        resultName = manager.nameResult(index, 'tracks');
    message.send(['Here\'s the ones I found:', resultName, templates.tracksLines(data, true)].join("\n"));
};

MetaSpotify.findTracks('get lucky', 3, handleTracks);
MetaSpotify.findTracks('all of the lights', 3, handleTracks);
MetaSpotify.findTracks('fun times', 3, handleTracks);

setTimeout(function () {

    var lResult = manager.getLastResult('tracks');
    if (lResult) {
        message.send(['the last result was:', templates.tracksLines(lResult, true)].join("\n"));
    } else {
        message.send(':flushed: I don\'t know what you\'re talking about');
    }
}, 2000);

