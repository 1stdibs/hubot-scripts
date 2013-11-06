'use strict';
/**
 * You know about the robot,
 * but make no assumptions about a `message`
 */

var Support = {},
    Queue,
    templates = require('./spotifyTemplates'),
    trackUriRE = /^spotify:track:[a-z\d]+$/i,
    currentResultReferenceRE = /^\[?(#|:)?(\d+)\]?$/,
    specificResultReferenceRE = /^\[?(\d+)\]?\[?(#|:)(\d+)\]?/,
    MetaData,
    manager,
    robot,
    url;

function spotRequest(path, method, params, callback) {
    console.log('SPOT:' + method, url + path, params);
    robot.http(url + path).query(params)[method]()(callback);
}

function getCurrentTrackUri (callback) {
    spotRequest('/currently-playing', 'get', {}, function (err, res, body) {
        var uri;
        if (!err) {
            uri = String(body).replace(/^\s+/, '').replace(/\s+$/, '');
        }
        callback(err, uri);
    });
}

function determineTemplate (type) {
    switch (type) {
        case manager.types.ALBUMS:
            return templates.albumsLines;
        case manager.types.ARTISTS:
            return templates.artistsLines;
    }
    return templates.tracksLines;
}

function resultToString (data, type, userId, template) {
    var index = manager.persist(data, type, userId);
    return [templates.resultNumber(index), template(data)].join("\n");
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

Support.purgeLists = function () {
    manager.purge();
};

Support.purgeMusicDataCache = function () {
    MetaData.clearCache();
};

function getInflatedAlbumHandler(callback, userId) {
    return function handleInflatedAlbum (err, album) {
        var index, tracks;
        if (!err) {
            tracks = album.getTracks();
            if (tracks.length) {
                index = manager.persist(tracks, manager.types.TRACKS, userId);
            }
        }
        callback(err, album, index);
    }
}

Support.translateToAlbum = function (str, userId, callback) {
    var resultNum, listItem, results,
        data, album, metaData, track,
        inflatedAlbumHandler = getInflatedAlbumHandler(callback, userId);
    if (str.match(currentResultReferenceRE)) {
        listItem = RegExp.$2;
        metaData = manager.getRelevantMetaData(void 0, userId, listItem);
        if (!metaData) {
            callback('Nothing found matching ' + str);
            return;
        }
        if (metaData.type === manager.types.ARTISTS) {
            callback('That\'s an artist list; use a track or album list');
            return;
        }
        if (metaData.type === manager.types.TRACKS) {
            track = new MetaData.Track(manager.getResult(metaData.index)[listItem]);
            track.getInflatedAlbum(inflatedAlbumHandler);
            return;
        }
        album = new MetaData.Album(manager.getResult(metaData.index)[listItem]);
        album.inflateTracks(inflatedAlbumHandler);
        return;
    }
    if (str.match(specificResultReferenceRE)) {
        resultNum = RegExp.$1;
        listItem = RegExp.$3;
        data = manager.getResultMetaData(resultNum);
        if (data.type === manager.types.ARTISTS) {
            callback('That\'s an artist list; use a track or album list');
            return;
        }
        results = manager.getResult(resultNum);
        if (!results || !results[listItem]) {
            callback('Item ' + listItem + ' not found for Result #' + resultNum);
            return;
        }
        if (data.type === manager.types.TRACKS) {
            track = new MetaData.Track(results[listItem]);
            track.getInflatedAlbum(inflatedAlbumHandler);
            return;
        }
        album = new MetaData.Album(results[listItem]);
        album.inflateTracks(inflatedAlbumHandler);
        return;
    }
    MetaData.findAlbums(str, 1, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        album = new MetaData.Album(data[0]);
        album.inflateTracks(inflatedAlbumHandler);
    });
};

Support.translateToTrack = function (str, userId, callback) {
    var resultNum, listItem, results, data;
    if (str.match(currentResultReferenceRE)) {
        listItem = RegExp.$2;
        results = manager.getRelevantResult(manager.types.TRACKS, userId, listItem);
        if (!results || !results.length) {
            callback('Nothing found matching ' + str);
            return;
        }
        callback(null, new MetaData.Track(results[listItem]));
        return;
    }
    if (str.match(specificResultReferenceRE)) {
        resultNum = RegExp.$1;
        listItem = RegExp.$3;
        data = manager.getResultMetaData(resultNum);
        if (data.type !== manager.types.TRACKS) {
            callback(templates.resultNumber(resultNum) + ' is not a track result list');
            return;
        }
        results = manager.getResult(resultNum);
        if (!results || !results[listItem]) {
            callback('Item ' + listItem + ' not found for ' + templates.resultNumber(resultNum));
            return;
        }
        callback(null, new MetaData.Track(results[listItem]));
        return;
    }
    if (str.match(trackUriRE)) {
        MetaData.fetchTrack(str, function (err, Track) {
            if (err) {
                Track = new MetaData.Track({href : str});
            }
            callback(null, Track);
        });
        return;
    }
    MetaData.findTracks(str, 1, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, new MetaData.Track(data[0]));
    });
};

Support.translateToArtist = function (str, userId, callback) {
    var resultNum, listItem, results, data, datum, artists, metaData, track;
    if (str.match(currentResultReferenceRE)) {
        listItem = RegExp.$2;
        metaData = manager.getRelevantMetaData(void 0, userId, listItem);
        if (!metaData) {
            callback('Nothing found matching ' + str);
            return;
        }
        if (metaData.type === manager.types.ARTISTS) {
            callback(null, new MetaData.Artist(manager.getResult(metaData.index)[listItem]));
            return;
        }
        if (metaData.type === manager.types.TRACKS) {
            datum = new MetaData.Track(manager.getResult(metaData.index)[listItem]);
        } else {
            datum = new MetaData.Album(manager.getResult(metaData.index)[listItem]);
        }
        artists = datum.getArtists();
        if (!artists.length) {
            callback('It doesn\'t have an artist... :S');
            return;
        }
        callback(null, new MetaData.Artist(artists[0]));
        return;
    }
    if (str.match(specificResultReferenceRE)) {
        resultNum = RegExp.$1;
        listItem = RegExp.$3;
        data = manager.getResultMetaData(resultNum);
        results = manager.getResult(resultNum);
        if (!results || !results[listItem]) {
            callback('Item ' + listItem + ' not found for ' + templates.resultNumber(resultNum));
            return;
        }
        datum = results[listItem];
        if (data.type === manager.types.ALBUMS) {
            if (!datum.getArtists) {
                datum = new MetaData.Album(datum);
            }
            artists = datum.getArtists();
            if (!artists.length) {
                callback('Album has no artists :S');
                return;
            }
            callback(null, new MetaData.Artist(artists[0]));
            return;
        }
        if (data.type === manager.types.TRACKS) {
            if (!datum.getArtists) {
                datum = new MetaData.Track(datum);
            }
            artists = datum.getArtists();
            if (!artists.length) {
                callback('Track has no artists :S');
                return;
            }
            callback(null, artists[0]);
            return;
        }
        callback(null, new MetaData.Artist(results[listItem]));
        return;
    }
    if (str.match(/\s*this artist\s*$/)) {
        Support.getCurrentArtist(callback);
        return;
    }
    MetaData.findArtists(str, 1, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, new MetaData.Artist(data[0]));
    });
};

Support.getCurrentTrack = function (callback) {
    getCurrentTrackUri(function (err, uri) {
        if (err) {
            callback(err);
            return;
        }
        MetaData.fetchTrack(uri, callback);
    });
};

Support.getCurrentArtist = function (callback) {
    Support.getCurrentTrack(function (err, track) {
        var artists;
        if (err) {
            callback(err);
            return;
        }
        artists = track.getArtists();
        if (artists && artists.length) {
            callback(null, artists[0]);
            return;
        }
        callback('This track doesn\'t have artists...');
    });
};

Support.getCurrentAlbum = function (callback) {
    Support.getCurrentTrack(function (err, track) {
        var album;
        if (err) {
            callback(err);
            return;
        }
        track.getInflatedAlbum(callback);
    });
};

Support.debug = function () {
    return 'debug';
};

Support.playUri = function (uri, callback) {
    spotRequest('/play-uri', 'post', {'uri' : uri}, function (err, res, body) {
        callback(err, body);
    });
};

Support.playTrack = function (track, callback) {
    return Support.playUri(track.href, callback);
};

Support.findTracks = function (query, userId, limit, callback) {
    var handler = getDataHandler(userId, manager.types.TRACKS, callback),
        aQuery;
    if (query.match(/^\s*by\s+(.+)/)) {
        aQuery = RegExp.$1;
        Support.translateToArtist(aQuery, userId, function (err, artist) {
            if (err) {
                callback(err);
                return;
            }
            MetaData.findTracksByArtist(artist, limit, handler);
        });
        return;
    }
    MetaData.findTracks(query, limit, handler);
};

Support.findAlbums = function (query, userId, limit, callback) {
    var handler = getDataHandler(userId, manager.types.ALBUMS, callback);
    if (query.match(/^\s*by\s+(.+)/)) {
        Support.translateToArtist(RegExp.$1, userId, function (err, artist) {
            if (err) {
                callback(err);
                return;
            }
            artist.inflateAlbums(function (err, albums) {
                if (!err) {
                    albums = albums.slice(0, limit);
                }
                handler(err, albums);
            });
        });
        return;
    }
    MetaData.findAlbums(query, limit, handler);
};

Support.findArtists = function (query, userId, limit, callback) {
    MetaData.findArtists(query, limit, getDataHandler(userId, manager.types.ARTISTS, callback));
};

module.exports = function (Robot, URL) {
    robot = Robot;
    url = URL;
    Queue = require('./spotifyQueue')(robot, URL);
    MetaData = require('./spotifyMetaData')(Robot);
    manager = require('./spotifyResultManager')(Robot);
    return Support;
};

