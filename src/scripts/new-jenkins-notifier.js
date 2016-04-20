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
        var build, data, envelope, query, room, params;
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
            params = (data && data.parameters) || {};
            logger.build('%s - #%s: %s', data.name, data.build.number, (data.build.status || data.build.phase || '[unknown state]'));
            if (data.build.phase === 'STARTED') {
                if (data.name.match(/mothra.*qa/i)) {
                    makeSound('mothra-qa');
                }
            }
            if (data.build.phase === 'COMPLETED') {
                // Notify QA when QA builds complete
                if (data.name.match(/.*qa.*/i) && !data.name.match(/.*selenium.*/i) && !data.name.match(/.*godzilla.*/i) && data.name.match(/.*statement.*/i) && data.name.match(/.*customer.*/i) && data.name.match(/.*nodegraphql.*/i) && data.name.match(/.*cmsTrade.*/i)) {
                    var qaMsg = data.name + " build #" + data.build.number + " : " + data.build.status + " -- " + data.build.full_url;
                    logger.minorInfo("Notifying QA: %s", qaMsg);
                    robot.messageRoom('#qa', qaMsg);
                }
                // Notify QA on certain custom builds
                if (data.name.match(/.*custom.*/i) || data.name.match(/.*any.*/i)) {
                    var params = data.build.parameters;
                    var serverName = params.SERVER_HOSTNAME ? params.SERVER_HOSTNAME : params.SERVER_NAME + '.intranet.1stdibs.com';
                    var customMsg = data.name + " build #" + data.build.number + " : " + data.build.status + " -- " + data.build.full_url;
                    var customDetails = "↳ built " + params.BRANCH_NAME + " to " + serverName;
                    logger.minorInfo("Custom build: %s", data.build.parameters.SERVER_HOSTNAME);
                    logger.minorInfo("Custom build: %s", data.build.parameters.BRANCH_NAME);
                    robot.messageRoom('#qa', customMsg);
                    robot.messageRoom('#qa', customDetails);
                    // Notify Goods team on imperial custom builds
                    if (serverName.match(/.*deathstar.*/i) || serverName.match(/.*goods.*/i) || serverName.match(/.*stardestroyer.*/i) || serverName.match(/.*eggplant.*/i)) {
                        robot.messageRoom('goods', customMsg);
                        robot.messageRoom('goods', customDetails);
                    }
                }
                // Notify the release channel when stage or prod get built
                if (data.name.match(/.*stage.*/i) && !data.name.match(/.*selenium.*/i) && !data.name.match(/.*godzilla.*/i) && data.name.match(/.*hotfix.*/i)) {
                    var qaMsg = data.name + " build #" + data.build.number + " : " + data.build.status + " -- " + data.build.full_url;
                    logger.minorInfo("Notifying Relase Channel: %s", qaMsg);
                    robot.messageRoom('#release', qaMsg);
                }
                if (data.name.match(/.*prod.*/i) && !data.name.match(/.*selenium.*/i) && !data.name.match(/.*godzilla.*/i) && !data.name.match(/.*everything except.*/i)) {
                    var qaMsg = data.name + " build #" + data.build.number + " : " + data.build.status + " -- " + data.build.full_url;
                    logger.minorInfo("Notifying Relase Channel: %s", qaMsg);
                    robot.messageRoom('#release', qaMsg);
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
                    if (data.name === 'Weekly Production Release') {
                        makeSound('shipit');
                        robot.messageRoom("#release", "1stdibs weekly production release is complete!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === '1stdibs.com Deploy Production PROD PROD PROD PROD' && params.Hotfix === 'true') {
                        makeSound('shipit');
                        robot.messageRoom("#release", "1stdibs.com hotfix has been released!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'Admin-v2 Deploy (PROD)' && params.Hotfix === 'true') {
                        makeSound('shipit-adminv2');
                        robot.messageRoom("#release", "Admin v2 hotfix has been released!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'Admin-v1 Deploy (PROD) (RACKSPACE)' && params.Hotfix === 'true') {
                        makeSound('shipit-adminv1');
                        robot.messageRoom("#release", "Admin v1 hotfix has been released!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'JAVA-InventoryService (Hotfix to Prod)') {
                        makeSound('shipit-inventory');
                        robot.messageRoom("#release", "Inventory service hotfix has been released!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'JAVA-IdentityService (Hotfix to Prod)') {
                        makeSound('shipit-identity');
                        robot.messageRoom("#release", "Identity service hotfix has been released!");
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

