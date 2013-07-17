'use strict';
/**
 * You know about the robot,
 * but make no assumptions about a `message`
 */

var Support = {},
    templates = require('./spotifyTemplates'),
    MetaData,
    manager,
    robot,
    url;

function spotRequest(path, method, params, callback) {
    robot.http(url + path).query(params)[method]()(callback);
}

function getCurrentTrackUri (callback) {
    spotRequest('/currently-playing', 'get', {}, function (err, res, body) {
        callback(err, body);
    });
}

function determineTemplate (type) {
    switch (type) {
        case 'albums':
            return templates.albumsLines;
        case 'artists':
            return templates.artistsLines;
    }
    return templates.tracksLines;
}

function resultToString (data, type, userId, template) {
    var index = manager.persist(data, type, userId);
    return ['Result #' + index, template(data)].join("\n")
}

function getDataHandler (userId, type, callback) {
    var rawTemplate = determineTemplate(type),
        template = function (data) {
            return rawTemplate(data, true);
        };
    return function handleData (err, data) {
        if (err) {
            callback(err);
            return;
        }
        callback(err, resultToString(data, type, userId, template));
    };
}

Support.debug = function () {
    return 'debug';
};

Support.playUri = function (uri, callback) {
    spotRequest('/play-uri', 'post', {'uri' : uri}, function (err, res, body) {
        callback(err, body);
    });
};

Support.findTracks = function (query, userId, limit, callback) {
    MetaData.findTracks(query, limit, getDataHandler(userId, 'tracks', callback));
};

Support.findAlbums = function (query, userId, limit, callback) {
    MetaData.findAlbums(query, limit, getDataHandler(userId, 'albums', callback));
};

Support.findArtists = function (query, userId, limit, callback) {
    MetaData.findArtists(query, limit, getDataHandler(userId, 'artists', callback));
};

module.exports = function (Robot, URL) {
    robot = Robot;
    url = URL;
    MetaData = require('./spotifyMetaData')(Robot);
    manager = require('./spotifyResultManager')(Robot);
    return Support;
};

