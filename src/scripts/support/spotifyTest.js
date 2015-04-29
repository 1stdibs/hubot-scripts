
var robot = require('./mockRobot'),
    message = require('./mockMessage')(robot),
    templates = require('./spotifyTemplates'),
    manager = require('./spotifyResultManager')(robot),
    MetaSpotify = require('./spotifyMetaData')(robot);

function determineTemplate (type) {
    switch (type) {
        case 'albums':
            return templates.albumsLines;
        case 'artists':
            return templates.artistsLines;
    }
    return templates.tracksLines;
}

function resultToString (err, data, type, userId, template) {
    if (err) {
        return ':flushed: ' + err;
    }
    var index = manager.persist(data, type, userId);
    return ['Result #' + index, template(data)].join("\n")
}

function getDataHandler (userId, type, callback) {
    var rawTemplate = determineTemplate(type),
        template = function (data) {
            return rawTemplate(data, true);
        };
    return function handleData (err, data) {
        callback(resultToString(err, data, type, userId, template));
    };
}

MetaSpotify.findTracks('get lucky', 3, getDataHandler(message.message.user.id, 'tracks', function (str) {
    message.send(str);
}));
MetaSpotify.findTracks('twin peaks', 3, getDataHandler(message.message.user.id, 'tracks', function (str) {
    message.send(str);
}));
MetaSpotify.findAlbums('all of the lights', 3, getDataHandler(message.message.user.id, 'albums', function (str) {
    message.send(str);
}));
MetaSpotify.findAlbums('paradise', 3, getDataHandler(message.message.user.id, 'albums', function (str) {
    message.send(str);
}));
MetaSpotify.findArtists('fun times', 3, getDataHandler(message.message.user.id, 'artists', function (str) {
    message.send(str);
}));
MetaSpotify.findArtists('lana del rey', 3, getDataHandler(message.message.user.id, 'artists', function (str) {
    message.send(str);
}));

