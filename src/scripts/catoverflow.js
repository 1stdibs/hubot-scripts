// Description:
//   Random cat images from Cat Overflow
//
// Dependencies:
//   None
//
// Commands:
//   hubot cat me
//   hubot cat bomb (n)
//
// Author:
//   andromedado

var max = 210;

module.exports = function(robot) {

    function getSrc (callback) {
        robot.http('http://catoverflow.com/api/query?limit=1&offset=' + (Math.ceil(Math.random() * max))).get()(function (err, res, body) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, [String(body).replace(/^\s+/, '').replace(/\s+$/, ''), '.png'].join('#'));
        });
    }

    function getIt (msg) {
        getSrc(function (err, src) {
            if (err) {
                msg.send(':flushed: ' + err);
            } else {
                msg.send(src);
            }
        })
    }

    robot.respond(/cat bomb( (\d+))?/i, function (msg) {
        var num = Math.min(30, msg.match[2] || 5);
        while (num--) {
            getIt(msg);
        }
    });

    robot.respond(/cat me/i, function (msg) {
        getIt(msg);
    });

};

