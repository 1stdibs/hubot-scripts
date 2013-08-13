// Description:
//   Random cat images from THECATAPI
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

module.exports = function(robot) {

    function getSrc (callback) {
        robot.http('http://thecatapi.com/api/images/get').head(function (err, req) {
            if (err) {
                callback(err);
                return;
            }
            req.addListener('response', function (res) {
                callback(null, res.headers.location);
            });
        })();
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

