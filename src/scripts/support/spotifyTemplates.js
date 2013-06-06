
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

module.exports = templates;
