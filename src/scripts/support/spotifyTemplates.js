
var templates = {},
    listIndexBase = 0,
    characters;

characters = {
    title : {
        left : '༺ ',
        right : ' ༻'
    },
    label : {
        left : '★',//༅⫸★☆✱
        right : ':'
    },
    additional : {
        left : '『',//「」『』[]
        right : '』'
    },
    year : {
        left : '[',
        right : ']'
    },
    result : {
        left : '┇',//┇⁜
        right : '┇'
    },
    ordinal : {
        left : '【',
        right : '】'
    },
    duration : {
        left : '〚',//〖〗
        right : '〛'
    }
};

function wrap (str, bounds) {
    return [bounds.left, str, bounds.right].join('');
}

function asTitle(str) {
    return wrap(str, characters.title);
}

function asLabel(str) {
    return wrap(str, characters.label);
}

function asAdditional(str) {
    return wrap(str, characters.additional);
}

function asResult (str) {
    return wrap(str, characters.result);
}

function asOrdinal (str) {
    return wrap(str, characters.ordinal);
}

function asDuration (str) {
    return wrap(str, characters.duration);
}

function asYear (str) {
    return wrap(str, characters.year);
}

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

templates.summarizeQueue = function (tracks) {
    var lines = [asTitle('le Queue')];
    if (!tracks || !tracks.length) {
        lines.push(asAdditional('is empty'));
    } else {
        var i = listIndexBase;
        tracks.forEach(function (track) {
            lines.push(asOrdinal(i) + ' ' + templates.trackLine(track, true));
            i++;
        });
    }
    return lines.join("\n");
};

templates.resultNumber = function (num) {
    return asResult('Result ' + asOrdinal(num));
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
            str.push(asYear(album.released));
        }
    }
    return str.join(' ');
};

templates.artistSummary = function (artist, albums, resultIndex) {
    //todo
};

templates.albumSummary = function (album, resultIndex) {
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
        if (resultIndex !== void 0) {
            lines.push(templates.resultNumber(resultIndex));
        }
        lines.push(templates.tracksLines(album.tracks));
    }
    return lines.join("\n");
};

templates.albumsLines = function (albums, full) {
    var lines = [asTitle('Albums')];
    var i = listIndexBase;
    albums.forEach(function (album) {
        lines.push(asOrdinal(i) + ' ' + templates.albumLine(album, full));
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
    str.push(asDuration(calcLength(track.length)));
    return str.join(' ');
};

templates.tracksLines = function (tracks, full) {
    var lines = [asTitle('Tracks')];
    var i = listIndexBase;
    tracks.forEach(function (track) {
        lines.push(asOrdinal(i) + ' ' + templates.trackLine(track, full));
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
    var i = listIndexBase;
    artists.forEach(function (artist) {
        lines.push(asOrdinal(i) + ' ' + templates.artistLine(artist, full));
        i++;
    });
    return lines.join("\n");
};

module.exports = templates;
