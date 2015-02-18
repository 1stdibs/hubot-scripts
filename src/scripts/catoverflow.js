// Description:
//   Random cat images from Cat Overflow
//
// Dependencies:
//   underscore
//
// Commands:
//   hubot cat me - Random cat gif from www.catoverflow.com
//   hubot cat bomb (n) - n/5 random cat gifs from www.catoverflow.com
//
// Author:
//   andromedado

var _ = require('underscore');
var util = require('util');
var max = 338;

module.exports = function(robot) {

    function getSrcs (num, callback) {
        num = num || 1;
        url = util.format('http://catoverflow.com/api/query?limit=%s&offset=%s', num, (Math.ceil(Math.random() * (max - num + 1))));
        robot.http(url).get()(function (err, res, body) {
            if (err) {
                callback(err);
                return;
            }
            var urls = (body + '').replace(/^\s*|\s*$/, '').split('\n');
            var urlsToUse = _.map(urls, function (url) {
                return url + '#.png';
            });
            callback(null, urlsToUse);
        });
    }

    function fetchAndSend (num, msg) {
        getSrcs(num, function (err, srcs) {
            if (err) {
                msg.send(':flushed: ' + err);
            } else {
                _.map(srcs, function (src) {
                    msg.send(src);
                });
            }
        })
    }

    robot.respond(/cat bomb( (\d+))?/i, function (msg) {
        var num = Math.min(30, msg.match[2] || 5);
        fetchAndSend(num, msg);
    });

    robot.respond(/cat me/i, function (msg) {
        fetchAndSend(1, msg);
    });

};

