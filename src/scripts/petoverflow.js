// Description:
//   Random cat/dog images from Cat/Dog Overflow
//
// Dependencies:
//   underscore
//
// Commands:
//   hubot cat me - Random cat gif from www.catoverflow.com
//   hubot cat bomb (n) - n/5 random cat gifs from www.catoverflow.com
//   hubot dog me - Random dog gif from www.dogoverflow.com
//   hubot dog bomb (n) - n/5 random dog gifs from www.dogoverflow.com
//
// Author:
//   andromedado

var _ = require('underscore');
var util = require('util');

var config = {
    cat : {
        max : 343,
        host : 'catoverflow.com'
    },
    dog : {
        max : 101,
        host : 'dogoverflow.com'
    }
};

module.exports = function(robot) {

    function getSrcs (type, num, callback) {
        num = num || 1;
        var host = config[type].host;
        var max = config[type].max;
        url = util.format('http://%s/api/query?limit=%s&offset=%s', host, num, (Math.ceil(Math.random() * (max - num + 1))));
        robot.http(url).get()(function (err, res, body) {
            if (err) {
                callback(err);
                return;
            }
            var urls = (body + '').replace(/^\s*|\s*$/, '').split('\n');
            urls = _.filter(urls, function (url) {
                return url && url.length && url.length > 0 && /\S/.test(url);
            });
            var urlsToUse = _.map(urls, function (url) {
                if (/\.gif$/i.test(url)) {
                    return url;
                }
                return url + '#.png';
            });
            callback(null, urlsToUse);
        });
    }

    function fetchAndSend (type, num, msg) {
        var i;
        var cb = function (err, srcs) {
            if (err) {
                msg.send(':flushed: ' + err);
            } else {
                _.map(srcs, function (src) {
                    msg.send(src);
                });
            }
        };
        for (i = 0; i < Math.abs(num); i++) {
            getSrcs(type, 1, cb);
        }
    }

    robot.respond(/(cat|dog) bomb( (\d+))?/i, function (msg) {
        var num = Math.min(30, msg.match[3] || 5);
        fetchAndSend(msg.match[1], num, msg);
    });

    robot.respond(/(cat|dog) me/i, function (msg) {
        fetchAndSend(msg.match[1], 1, msg);
    });

    robot.hear(/^nsfw/i, function (msg) {
        fetchAndSend('cat', 6, msg);
    });

};

