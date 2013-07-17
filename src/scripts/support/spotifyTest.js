
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
        var index = manager.persist(data, 'tracks', userId);
        message.send(['Here\'s the tracks I found:', index, templates.tracksLines(data, true)].join("\n"));
    }
}

function getAlbumHandler (message) {
    var userId = message.message.user.id;
    return function handleAlbums(err, data) {
        if (err) {
            message.send(':flushed: ' + err);
            return;
        }
        var index = manager.persist(data, 'albums', userId);
        message.send(['Here\'s the albums I found:', index, templates.albumsLines(data, true)].join("\n"));
    }
}

function getArtistHandler (message) {
    var userId = message.message.user.id;
    return function handleTracks(err, data) {
        if (err) {
            message.send(':flushed: ' + err);
            return;
        }
        var index = manager.persist(data, 'artists', userId);
        message.send(['Here\'s the artists I found:', index, templates.artistsLines(data, true)].join("\n"));
    }
}

MetaSpotify.findTracks('get lucky', 3, getTrackHandler(message));
MetaSpotify.findAlbums('all of the lights', 3, getAlbumHandler(message));
MetaSpotify.findArtists('fun times', 3, getArtistHandler(message));

setTimeout(function () {

    var lResult = manager.getLastResultMetaDataForUser(1, 'artists');
    console.log('last info for user 1', lResult);
//    if (lResult) {
//        message.send(['the last result was:', templates.tracksLines(lResult, true)].join("\n"));
//    } else {
//        message.send(':flushed: I don\'t know what you\'re talking about');
//    }
}, 2000);

