'use strict';

var MetaData = {
        uris : {
            lookup : 'http://ws.spotify.com/lookup/1/.json',
            search : {
                artist : 'http://ws.spotify.com/search/1/artist.json',
                album : 'http://ws.spotify.com/search/1/album.json',
                track : 'http://ws.spotify.com/search/1/track.json'
            }
        }
    },
    _ = require('underscore'),
    allData,
    allDataKey = 'spotifyMetaDataAllData',
    backedUp = false,
    backupRate = 20000,//Commit data at most every 20 seconds
    mapping = {},
    robot;

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
                callback('Spotfy Meta Data API returned a ' + resp.statusCode);
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

function getUriInfo (uri, params, callback) {
    var data,
        prefix,
        args = Array.prototype.slice.call(arguments);
    uri = args.shift();
    callback = args.pop();
    params = args.pop() || {};
    if (params.extras) {
        prefix = params.extras;
    }
    params.uri = uri;
    data = getPersistedUriData(uri, prefix);
    if (data) {
        console.log('cache HIT ' + uri);
        callback(void 0, data);
        return;
    }
    console.log('cache MISS ' + uri);
    console.log('fetching', MetaData.uris.lookup, params);
    robot.http(MetaData.uris.lookup).query(params).get()(getJSONResponseParser(function (err, jsonData) {
        if (!err) {
            persistUriData(uri, prefix, data);
        }
        callback(err, jsonData);
    }));
}

function query (type, queryString, callback) {
    var data;
    if (!MetaData.uris.search[type]) {
        callback('Unknown query type ' + type);
        return;
    }
    data = getPersistedQueryResult(queryString, type);
    if (data) {
        console.log('cache HIT', type, queryString);
        callback(void 0, data);
        return;
    }
    console.log('cache MISS', type, queryString);
    robot.http(MetaData.uris.search[type]).query({q : queryString}).get()(getJSONResponseParser(function (err, jsonData) {
        if (!err) {
            persistQueryResult(queryString, type, data);
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
        if (!data || !data.info || !data.info.type) {
            callback('invalid response, no data->info->type');
            return;
        }
        if (!mapping[data.info.type]) {
            callback('don\'t know what to do with ' + data.info.type);
            return;
        }
        key = data.info.type + 's';
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
            objs.push(new mapping[data.info.type](datum));
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

function fetchOne(uri, params, callback) {
    var One,
        args = Array.prototype.slice.call(arguments);
    uri = args.shift();
    callback = args.pop();
    params = args.pop();
    One = uriToClass(uri);
    if (!One) {
        callback('invalid uri');
        return;
    }
    getUriInfo(uri, params, function (err, data) {
        var one;
        if (!err) {
            one = new One(data[data.info.type]);
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
        getUriInfo(this.href, {extras : 'trackdetail'}, function (err, data) {
            self.tracks = [];
            if (!err) {
                if (data[data.info.type].tracks) {
                    data[data.info.type].tracks.forEach(function (track) {
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
        return fetchOne(this.album.href, callback);
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
        getUriInfo(this.href, {extras : 'albumdetail'}, function (err, data) {
            self.albums = [];
            if (!err) {
                if (data[data.info.type].albums) {
                    data[data.info.type].albums.forEach(function (data) {
                        if (data[data.info.type].href) {
                            persistUriData(data[data.info.type].href, data);
                        }
                        self.albums.push(new MetaData.Album(data[data.info.type]));
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
        callback('invalid uri');
    } else {
        fetchOne(albumUri, {extras : 'trackdetail'}, callback);
    }
    return MetaData;
};

MetaData.fetchTrack = function (trackUri, callback) {
    if (!String(trackUri).match(MetaData.Track.uriRegExp)) {
        callback('invalid uri');
    } else {
        fetchOne(trackUri, callback);
    }
    return MetaData;
};

MetaData.fetchArtist = function (artistUri, callback) {
    if (!String(artistUri).match(MetaData.Artist.uriRegExp)) {
        callback('invalid uri');
    } else {
        fetchOne(artistUri, callback);
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
            console.log('commiting metadata to brain');
            robot.brain.set(allDataKey, allData);
            backedUp = true;
        }
    }, backupRate);
    return MetaData;
};
