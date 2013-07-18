
var templates = {};

function calcLength (seconds) {
    iSeconds = parseInt(seconds, 10);
    if (iSeconds < 60) {
        return (Math.round(iSeconds * 10) / 10) + ' seconds'
    }
    rSeconds = iSeconds % 60;
    if (rSeconds < 10) {
        rSeconds = '0' + rSeconds;
    }
    return Math.floor(iSeconds / 60) + ':' + rSeconds
}

function parse (track) {
    var data = {}, i;
    data.trackName = track.name;
    if (track.artists) {
        data.artists = [];
        for (i in track.artists) {
            data.artists.push(track.artists[i].name);
        }
    }
    if (track.album) {
        if (track.album.name) {
            data.albumName = track.album.name;
        }
        if (track.album.released) {
            data.albumYear = track.album.released;
        }
    }
    data.length = calcLength(track.length);
    return data;
}

function asTitle(str) {
    return '༺ ' + str + ' ༻';
}

function asLabel(str) {
    return '༅' + str + ':';
}

function asAdditional(str) {
    return '[' + str + ']';
}

templates.trackSingleLine = function (track) {
    var str = [], data = parse(track);
    str.push(data.trackName);
    if (data.artists) {
        str.push('by: ' + data.artists.join(', '));
    }
    if (data.albumName) {
        str.push('[' + data.albumName + (data.albumYear ? ' ' + data.albumYear : '') + ']');
    }
    str.push(data.length);
    return str.join(' ');
};

templates.albumLine = function (album, full) {
    var str = [asLabel('Album')];
    str.push(album.name);
    if (full && album.artists.length) {
        str.push(asAdditional(templates.artistsLine(album.artists)));
    }
    if (full && album.tracks.length) {
        str.push(asAdditional('Tracks: ' + album.tracks.length));
    }
    if (album.released) {
        if (full) {
            str.push(asAdditional('Released: ' + album.released));
        } else {
            str.push(asAdditional(album.released));
        }
    }
    return str.join(' ');
};

templates.albumSummary = function (album) {
    var lines = [asTitle('Album: ' + album.name)];
    if (album.artists && album.artists.length) {
        album.artists.forEach(function (artist) {
            lines.push(templates.artistLine(artist));
        });
    }
    if (album.released) {
        lines.push(asLabel('Released') + ' ' + album.released);
    }
    if (album.tracks && album.tracks.length) {
        lines.push(templates.tracksLines(album.tracks));
    }
    return lines.join("\n");
};

templates.albumsLines = function (albums, full) {
    var lines = [asTitle('Albums')];
    var i = 0;
    albums.forEach(function (album) {
        lines.push('#' + i + ' ' + templates.albumLine(album, full));
        i++;
    });
    return lines.join("\n");
};

templates.trackLine = function (track, full) {
    var str = [asLabel('Track')];
    str.push(track.name);
    if (full && track.artists.length) {
        str.push(asAdditional(templates.artistsLine(track.artists)));
    }
    if (full && track.album) {
        str.push(asAdditional(templates.albumLine(track.album)));
    }
    str.push(asAdditional(calcLength(track.length)));
    return str.join(' ');
};

templates.tracksLines = function (tracks, full) {
    var lines = [asTitle('Tracks')];
    var i = 0;
    tracks.forEach(function (track) {
        lines.push('#' + i + ' ' + templates.trackLine(track, full));
        i++;
    });
    return lines.join("\n");
};

templates.artistsLine = function (artists, full) {
    var plural = artists.length > 1,
        ones,
        str = [asLabel('Artist' + (plural ? 's' : ''))];
    ones = [];
    artists.forEach(function (artist) {
        ones.push(artist.name);
    });
    str.push(ones.join(', '));
    return str.join(' ');
};

templates.artistLine = function (artist, full) {
    var str = [asLabel('Artist')];
    str.push(artist.name);
    if (full && artist.albums && artist.albums.length) {
        str.push(asAdditional('Albums: ' + artist.albums.length));
    }
    return str.join(' ');
};

templates.artistsLines = function (artists, full) {
    var lines = [asTitle('Artists')];
    var i = 0;
    artists.forEach(function (artist) {
        lines.push('#' + i + ' ' + templates.artistLine(artist, full));
        i++;
    });
    return lines.join("\n");
};

module.exports = templates;
