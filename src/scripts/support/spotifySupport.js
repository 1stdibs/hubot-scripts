
var Support = {},
    MetaData,
    robot,
    url;

function spotRequest(path, method, params, callback) {
    robot.http(url + path).query(params)[method]()(callback);
}

Support.getCurrentTrackUri = function (callback) {
    spotRequest('/currently-playing', 'get', {}, function (err, res, body) {
        callback(err, body);
    });
};

Support.getTrackInfo = function (callback) {
    robot.http()
};

Support.debug = function () {
    Support.getCurrentTrackUri(function (err, uri) {
        if (!err) {
            MetaData.fetchTrackInfo(uri, function (err, track) {
                console.log('track!', track);
            });
        }
    });
    return 'debug';
};

module.exports = function (Robot, URL) {
    robot = Robot;
    MetaData = require('./spotifyMetaData')(Robot);
    url = URL;
    return Support;
};

