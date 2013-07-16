
var robot = require('./mockRobot'),
    templates = require('./spotifyTemplates'),
    message = require('./mockMessage')(robot),
    manager = require('./spotifyResultManager')(robot),
    MetaSpotify = require('./spotifyMetaData')(robot);

function getTrackHandler (message) {
    var userId = message.message.user.id;
    return function handleTracks(err, data) {
        if (err) {
            message.send(':flushed: ' + err);
            return;
        }
        var index = manager.persist(data, 'tracks', userId),
            resultName = manager.nameList(index, 'tracks');
        message.send(['Here\'s the ones I found:', resultName, templates.tracksLines(data, true)].join("\n"));
    }
}

MetaSpotify.findTracks('get lucky', 3, getTrackHandler(message));
MetaSpotify.findTracks('all of the lights', 3, getTrackHandler(message));
message.message.user.id = 5;
MetaSpotify.findTracks('fun times', 3, getTrackHandler(message));

setTimeout(function () {

    var lResult = manager.getLastResultForUser(1);
    console.log('last result for user 1', lResult);
//    if (lResult) {
//        message.send(['the last result was:', templates.tracksLines(lResult, true)].join("\n"));
//    } else {
//        message.send(':flushed: I don\'t know what you\'re talking about');
//    }
}, 2000);

