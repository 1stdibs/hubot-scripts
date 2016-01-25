'use strict';

/*
 * Spotify Metadata API has been deprecated and we have migrated to Spotify's Web API
 * TODO: Rename references to 'Metadata' (vars, comments, files, etc.) at some point...
 *
 * Handy References:
 * @link https://developer.spotify.com/web-api/ (Spotify Web API User Guide)
 * @link https://developer.spotify.com/web-api/migration-guide/ (Migration to Web Api Guide [from Metadata API])
 */
var MetaData = {
        uris : {
            lookup : {
                artist       : 'https://api.spotify.com/v1/artists/{id}',
                artistAlbum  : 'https://api.spotify.com/v1/artists/{id}/albums',
                album        : 'https://api.spotify.com/v1/albums/{id}',
                track        : 'https://api.spotify.com/v1/tracks/{id}'
            },
            search : 'https://api.spotify.com/v1/search'
        }
    },
    _ = require('underscore'),
    allData,
    allDataKey = 'spotifyWebApiAllData',
    backedUp = false,
    backupRate = 20000,//Commit data at most every 20 seconds
    mapping = {},
    robot;
var logger = require('./logger');

/**
 * Get ID from from Spotify URI by stripping out resource identifier e.g. 'spotify:track:'
 * @param {string} uri
 * @returns {string}
 */
function getId(uri) {
    return uri.replace(/^spotify:[a-zA-Z]*:/, '');
}

function persistUriData(uri, prefix, data) {
    var args;
    args = Array.prototype.slice.call(arguments);
    uri = args.shift();
    data = args.pop();
    prefix = args.pop();
    if (prefix) {
        uri = prefix + uri;
    }
    allData[uri] = data;
    logger.minorDibsyInfo('allData now has a %s-y entry for %s', !!data, uri);
    backedUp = false;
}

function getPersistedUriData(uri, prefix) {
    if (prefix) {
        uri = prefix + uri;
    }
    return uri && allData && allData[uri] || void 0;
}

function queryToKey(query, type) {
    return '|' + type + '|' + query;
}

function persistQueryResult(query, type, result) {
    allData.queries[queryToKey(query, type)] = result;
    backedUp = false;
}

function getPersistedQueryResult(query, type) {
    return allData.queries[queryToKey(query, type)] || void 0;
}

function getJSONResponseParser (callback) {
    return function (err, resp, body) {
        var data = void 0;
        if (!err) {
            if (resp && resp.statusCode && resp.statusCode >= 400) {
                callback('Spotify Web API returned a ' + resp.statusCode);
                return;
            }
            try {
                data = JSON.parse(body);
            } catch (e) {
                err = e;
            }
        }
        callback(err, data);
    };
}

/**
 * Get Spotify catalog information for a single album, artist or track.
 * @param {('artist'|'artistAlbum'|'album'|'track')} type
 * @param {string} uri
 * @param {function} callback
 */
function getUriInfo (type, uri, callback) {
    var args = Array.prototype.slice.call(arguments);
    var url;
    var id;
    var data;

    if (!MetaData.uris.lookup[type]) {
        callback('Unknown lookup type ' + type);
        return;
    }

    type = args.shift();
    callback = args.pop();
    uri = args.pop();

    id = getId(uri);
    data = getPersistedUriData(uri);

    if (data) {
        logger.minorDibsyInfo('cache HIT [uri: %s]', uri);
        callback(void 0, data);
        return;
    }

    url = MetaData.uris.lookup[type].replace('{id}', id);

    logger.minorDibsyInfo('cache MISS [uri: %s]', uri);
    logger.minorDibsyInfo('fetching %s %j', url);

    robot.http(url).get()(getJSONResponseParser(function (err, jsonData) {
        if (!err) {
            persistUriData(uri, jsonData);
        }
        callback(err, jsonData);
    }));
}

/**
 * Get Spotify catalog information about artists, albums, tracks or playlists that match a keyword string.
 * @param {('artist'|'album'|'track'|'playlist')} type
 * @param {object} queryString
 * @param {function} callback
 */
function query (type, queryString, callback) {
    var data = getPersistedQueryResult(queryString, type);

    if (data) {
        logger.minorDibsyInfo('cache HIT %s %s', type, queryString);
        callback(void 0, data);
        return;
    }

    logger.minorDibsyInfo('cache MISS %s %s', type, queryString);

    robot.http(MetaData.uris.search).query({type: type, q : queryString}).get()(getJSONResponseParser(function (err, jsonData) {
        if (!err) {
            persistQueryResult(queryString, type, jsonData);
        }
        callback(err, jsonData);
    }));
}

function availableInTheUS (item) {
    if (item) {
        if (item.availablility && item.availability.territories) {
            return !!String(item.availability.territories).match(/US/i);
        }
        if (item.album && item.album.availability && item.album.availability.territories) {
            return !!String(item.album.availability.territories).match(/US/i);
        }
        return true;
    }
    return false;
}

function find(what, queryString, limit, callback) {
    var args = Array.prototype.slice.call(arguments);
    what = args.shift();
    callback = args.pop();
    queryString = args.shift();
    limit = args.shift();
    query(what, queryString, function (err, data) {
        var objs = [], key, use, available;
        if (err) {
            callback(err);
            return;
        }
        if (!mapping[what]) {
            logger.minorDibsyInfo('unknown type in mapping [type: %s]', data.type);
            callback('don\'t know what to do with ' + data.type);
            return;
        }
        key = what + 's';
        if (!data[key]) {
            callback('No ' + key + ' index found in response');
            return;
        }
        available = _.filter(data[key], availableInTheUS);
        if (!available.length) {
            callback('Nothing Found');
            return;
        }
        if (limit) {
            use = available.slice(0, limit);
        } else {
            use = available;
        }
        use.forEach(function (datum) {
            objs.push(new mapping[what](datum));
        });
        callback(err, objs);
    });
}

function uriToClass(uri) {
    var what = String(uri).split(':')[1];
    if (what && mapping[what]) {
        return mapping[what];
    }
    return null;
}

function fetchOne(type, uri, callback) {
    var One;
    var args = Array.prototype.slice.call(arguments);

    type = args.shift();
    callback = args.pop();
    uri = args.pop();
    One = uriToClass(uri);

    if (!One) {
        callback('invalid uri: ' + uri);
        return;
    }
    getUriInfo(type, uri, function (err, data) {
        var one;
        if (!err) {
            one = new One(data[data.type]);
        }
        callback(err, one);
    });
}

MetaData.Album = (function () {
    var Album;

    Album = function album (data) {
        var self;
        if (data instanceof album) {
            return data;
        }
        self = this;
        data = data || {};
        this.popularity = data.popularity;
        this.name = data.name;
        this.released = data.released;
        this.href = data.href;
        this.artists = [];
        if (data.artist && data['artist-id']) {
            this.artists.push({name : data.artist, href : data['artist-id']});
        }
        if (data.artists) {
            data.artists.forEach(function (artist) {
                self.artists.push(artist);
            });
        }
        this.tracks = [];
        if (data.tracks && data.tracks.length) {
            data.track.forEach(function (track) {
                self.tracks.push(track);
            });
        }
    };

    Album.prototype.getArtists = function () {
        var artists = [];
        this.artists.forEach(function (artist) {
            artists.push(new MetaData.Artist(artist));
        });
        return artists;
    };

    Album.prototype.getData = function () {
        return {
            name : this.name,
            released : this.released,
            href : this.href
        };
    };

    Album.prototype.getTracks = function () {
        var tracks = [], self = this;
        if (this.tracks) {
            this.tracks.forEach(function (track) {
                track.album = self.getData();
                tracks.push(new MetaData.Track(track));
            })
        }
        return tracks;
    };

    Album.prototype.inflateTracks = function (callback) {
        var self = this;
        if (this.tracks && this.tracks.length > 0) {
            callback(void 0, this.tracks);
            return this;
        }
        getUriInfo('album', this.href, function (err, data) {
            self.tracks = [];
            if (!err) {
                if (data[data.type].tracks) {
                    data[data.type].tracks.forEach(function (track) {
                        if (track.href) {
                            track.album = self.getData();
                            persistUriData(track.href, {info : {type : 'track'}, track : track});
                        }
                        self.tracks.push(track);
                    });
                } else {
                    err = 'no albums in the response';
                }
            }
            callback(err, self, self.tracks);
        });
        return this;
    };

    mapping.album = Album;

    Album.uriRegExp = /^spotify:album/;

    return Album;
}());

MetaData.Track = (function () {
    var Track;

    Track = function track (data) {
        var self;
        if (data instanceof track) {
            return data;
        }
        self = this;
        data = data || {};
        this.album = data.album || {};
        this.name = data.name;
        this.popularity = data.popularity;
        this.length = data.length;
        this.href = data.href;
        this.artists = [];
        if (data.artists && data.artists.length) {
            data.artists.forEach(function (artist) {
                self.artists.push(artist);
            });
        }
        this.trackNumber = data['track-number'];
    };

    Track.prototype.hasArtist = function (artist) {
        var hasIt = false;
        this.artists.forEach(function (art) {
            hasIt = hasIt || art && art.href && art.href == artist.href;
        });
        return hasIt;
    };

    Track.prototype.getArtists = function () {
        var artists = [];
        this.artists.forEach(function (artist) {
            artists.push(new MetaData.Artist(artist));
        });
        return artists;
    };

    Track.prototype.getAlbum = function (callback) {
        if (!this.album || !this.album.href) {
            callback('no album info to fetch with!');
            return this;
        }
        return fetchOne('album', this.album.href, callback);
    };

    Track.prototype.getInflatedAlbum = function (callback) {
        this.getAlbum(function (err, album) {
            if (err) {
                callback(err);
                return;
            }
            album.inflateTracks(function (err, album, tracks) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, album);
            });
        });
    };

    Track.uriRegExp = /^spotify:track/;

    mapping.track = Track;

    return Track;
}());

MetaData.Artist = (function (){
    var Artist;

    Artist = function artist (data) {
        if (data instanceof artist) {
            return data;
        }
        data = data || {};
        this.name = data.name;
        this.href = data.href;
        this.popularity = data.popularity;
    };

    Artist.prototype.inflateAlbums = function (callback) {
        var self = this;
        if (this.albums && this.albums.length) {
            callback(void 0, this.albums);
            return this;
        }
        getUriInfo('artistAlbum', this.href, function (err, data) {
            self.albums = [];
            if (!err) {
                if (data[data.type].albums) {
                    data[data.type].albums.forEach(function (data) {
                        if (data[data.type].href) {
                            persistUriData(data[data.type].href, data);
                        }
                        self.albums.push(new MetaData.Album(data[data.type]));
                    });
                } else {
                    err = 'no albums in the response';
                }
            }
            callback(err, self.albums);
        });
        return this;
    };

    Artist.uriRegExp = /^spotify:artist/;

    mapping.artist = Artist;

    return Artist;
}());

MetaData.fetchAlbum = function (albumUri, callback) {
    if (!String(albumUri).match(MetaData.Album.uriRegExp)) {
        callback('invalid uri: ' + albumUri);
    } else {
        fetchOne('album', albumUri, callback);
    }
    return MetaData;
};

MetaData.fetchTrack = function (trackUri, callback) {
    if (!String(trackUri).match(MetaData.Track.uriRegExp)) {
        callback('invalid uri: ' + trackUri);
    } else {
        fetchOne('track', trackUri, callback);
    }
    return MetaData;
};

MetaData.fetchArtist = function (artistUri, callback) {
    if (!String(artistUri).match(MetaData.Artist.uriRegExp)) {
        callback('invalid uri: ' + artistUri);
    } else {
        fetchOne('artist', artistUri, callback);
    }
    return MetaData;
};

MetaData.findAlbums = function (query, limit, callback) {
    find.apply(this, ['album'].concat(Array.prototype.slice.call(arguments)));
    return MetaData;
};

MetaData.findArtists = function (query, limit, callback) {
    find.apply(this, ['artist'].concat(Array.prototype.slice.call(arguments)));
    return MetaData;
};

MetaData.findTracks = function (query, limit, callback) {
    find.apply(this, ['track'].concat(Array.prototype.slice.call(arguments)));
    return MetaData;
};

MetaData.findTracksByArtist = function (artist, limit, callback) {
    find('track', artist.name, function (err, tracks) {
        if (!err) {
            tracks = _.filter(tracks, function (track) {
                return track.hasArtist(artist);
            });
            if (limit) {
                tracks = tracks.slice(0, limit);
            }
        }
        callback(err, tracks);
    });
};

MetaData.clearCache = function () {
    allData = {};
    backedUp = false;
};

module.exports = function (Robot) {
    robot = Robot;
    allData = robot.brain.get(allDataKey) || {};
    allData.queries = allData.queries || {};
    setInterval(function () {
        if (robot && !backedUp) {
            logger.minorDibsyInfo('commiting web api to brain');
            robot.brain.set(allDataKey, allData);
            backedUp = true;
        }
    }, backupRate);
    return MetaData;
};
