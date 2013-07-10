
var MetaData = {
        uris : {
            lookup : 'http://ws.spotify.com/lookup/1/.json'
        }
    },
    robot;

MetaData.fetchTrackInfo = function (trackUri, callback) {
    robot.http(MetaData.uris.lookup).query({uri : trackUri}).get()(function () {
        console.log(Array.prototype.slice.call(arguments));
    });
};

module.exports = function (Robot) {
    robot = Robot;
    return MetaData;
};
