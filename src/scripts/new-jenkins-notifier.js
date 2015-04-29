// Notifies about Jenkins build errors via Jenkins Notification Plugin
//
// Dependencies:
//   "url": ""
//   "querystring": ""
//   "colors" : ""
//
// Configuration:
//   Just put this url <HUBOT_URL>:<PORT>/hubot/jenkins-notify?room=<room> to your Jenkins
//   Notification config. See here: https://wiki.jenkins-ci.org/display/JENKINS/Notification+Plugin
//
// Commands:
//   None
//
// URLS:
//   POST /hubot/jenkins-notify?room=<room>[&type=<type>]
//
// Authors:
//   spajus, cmckendry, andromedado, JasonSmiley

var url = require('url');
var querystring = require('querystring');
var http = require('http');
var colors = require('colors');
var util = require('util');

var DeDupeSounds = true;//If True, then, for example, mothra may only place once per "IntervalMinutes"
var IntervalMinutes = 30;
var MaxSoundsPerInterval = 2;//For any given interval, there will be no more than this number of jenkins sounds
//10 - 1 = One Sound per ten minutes
//30 - 2 = For any given half hour, at most two sounds will play
var soundsSoFar = 0;
var deDuper = {};

var logger = (function () {
    var logger = require('./support/logger');
    logger.buildSound = function (what) {
        var args = [].slice.call(arguments);
        if (args.length > 1) {
            what = util.format.apply(util, arguments);
        }
        var str = util.format('[%d/%d Build Sounds]'.cyan, soundsSoFar, MaxSoundsPerInterval);
        console.log('%s : %s', str, what);
        if (DeDupeSounds) {
            logger.minorInfo(JSON.stringify(deDuper));
        }
    };
    return logger;
}());

function makeSound (urlOfSound) {
    if (!(/http/.test(urlOfSound))) {
        urlOfSound = 'http://xserve:5051/' + urlOfSound;
    }

    if (soundsSoFar >= MaxSoundsPerInterval) {
        logger.buildSound('No available slots for %s', urlOfSound);
        return;
    }
    if (DeDupeSounds && deDuper[urlOfSound]) {
        logger.buildSound('Enforcing de-dupe for %s', urlOfSound);
        return;
    }
    deDuper[urlOfSound] = new Date();
    soundsSoFar += 1;
    logger.buildSound('Slot taken by %s', urlOfSound);
    setTimeout(function () {
        soundsSoFar -= 1;
        deDuper[urlOfSound] = void 0;
        logger.buildSound('Slot opened up!');
    }, IntervalMinutes * 60 * 1000);

    http.get(urlOfSound, function(res) {
        return logger.requestResolution(urlOfSound, res.statusCode);
    });
}

module.exports = function(robot) {

    var foo = {};

    return robot.router.post("/hubot/jenkins-notify", function(req, res) {
        var build, data, envelope, query, room;
        foo.failing = foo.failing || [];
        query = querystring.parse(url.parse(req.url).query);
        res.end('');
        envelope = {};
        envelope.user = {};
        if (query.room) {
            envelope.room = query.room;
        }
        if (query.type) {
            envelope.user.type = query.type;
        }
        room = 'dev';
        try {
            data = req.body;
            logger.build('%s - #%s: %s', data.name, data.build.number, (data.build.status || data.build.phase || '[unknown state]'));
            if (data.build.phase === 'STARTED') {
                if (data.name.match(/mothra.*qa/i)) {
                    makeSound('mothra-qa');
                }
            }
            if (data.build.phase === 'COMPLETED') {
                if (data.name.match(/.*qa.*/i) && !data.name.match(/.*selenium.*/i)) {
                    var qaMsg = data.name + " build #" + data.build.number + " : " + data.build.status + " -- " + data.build.full_url;
                    logger.minorInfo("Notifying QA: %s", qaMsg);
                    robot.messageRoom('#qa', qaMsg);
                }
                if (data.build.status === 'FAILURE') {
                    if (foo.failing.indexOf(data.name) >= 0) {
                        build = "is still";
                    } else {
                        build = "started";
                    }
                    robot.messageRoom(room, "" + data.name + " build #" + data.build.number + " " + build + " failing (" + (encodeURI(data.build.full_url)) + ")");
                    if (foo.failing.indexOf(data.name) < 0) {
                        foo.failing.push(data.name);
                    }
                    if (data.name.match(/mothra.*qa/i)) {
                        robot.messageRoom('#dev', "Mothra has the upper hand!");
                        robot.messageRoom('#dev', "http://i.imgur.com/CoqJxBx.gif");
                    }
                    if (data.name === 'MechaGodzilla .com (Prod)') {
                        makeSound('mechawins');
                        robot.messageRoom('#dev', "Mecha Godzilla is winning!:poop::poop::poop:");
                        robot.messageRoom('#dev', "http://i.imgur.com/AoeZXir.gif");
                    }
                }
                if (data.build.status === 'SUCCESS') {
                    if (data.name === '1stdibs.com Deploy Production PROD PROD PROD PROD') {
                        makeSound('shipit');
                        robot.messageRoom("#release", "1stdibs.com hotfix has been release!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'Admin-v2 Deploy (PROD)') {
                        makeSound('shipit-adminv2');
                        robot.messageRoom("#release", "Admin v2 hotfix has been release!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'Admin-v1 Deploy (PROD) (RACKSPACE)') {
                        makeSound('shipit-adminv1');
                        robot.messageRoom("#release", "Admin v1 hotfix has been release!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'JAVA-InventoryService (Prod)') {
                        makeSound('shipit-inventory');
                        robot.messageRoom("#release", "Inventory service hotfix has been release!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'JAVA-IdentityService (Prod)') {
                        makeSound('shipit-identity');
                        robot.messageRoom("#release", "Identity service hotfix has been release!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.build && data.build.parameters && data.build.parameters.SERVER_HOSTNAME === 'deathstar.1stdibs.com') {
                        makeSound('deathstar');
                        robot.messageRoom("#dev", "The Death Star is now fully armed and operational");
                    }
                    if (data.name === 'MechaGodzilla .com (Prod)') {
                        makeSound('mechaloses');
                        robot.messageRoom('#dev', "Mecha Godzilla has been defeated!:excited_tomato::excited_tomato::excited_tomato:");
                        robot.messageRoom('#dev', "http://i.imgur.com/t8tLizl.gif");
                    }
                }
            }
        } catch (error) {
            logger.error(error, req.body);
        }
    });
};

