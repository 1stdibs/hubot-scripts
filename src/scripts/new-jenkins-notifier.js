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
var moment = require('moment');

var DeDupeSounds = true;//If True, then, for example, mothra may only place once per "IntervalMinutes"
var IntervalMinutes = 30;
var MaxSoundsPerInterval = 2;//For any given interval, there will be no more than this number of jenkins sounds
//10 - 1 = One Sound per ten minutes
//30 - 2 = For any given half hour, at most two sounds will play
var soundsSoFar = 0;
var deDuper = {};

// Extra requirements for spreadsheet auto-updater
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var doc = new GoogleSpreadsheet('1EJzQgI1JMdjM8CWF5s-4mQOuR_dTGvn7VsoGQbc8wSM');
var sheet;

// if it's not QA, Stage, or Prod, then the spreadsheet doesn't care
var important = /(QA|Stag(e|ing)|Prod)/i;
var sanitize = /(JAVA-)|(service)|(\(.*\))|node|(1st)?dibs|deploy|\s|-|QA|Stag(e|ing)|Prod/ig;

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
        room = 'C02FRPJJ5';
        try {
            data = req.body;
            params = (data && data.parameters) || {};
            logger.build('%s - #%s: %s', data.name, data.build.number, (data.build.status || data.build.phase || '[unknown state]'));
            if (data.build.phase === 'STARTED') {
                //nothing here for now
            }
            if (data.build.phase === 'COMPLETED') {
                // Notify QA when QA builds complete
                if (data.name.match(/.*qa.*/i) && !data.name.match(/.*selenium.*/i) && !data.name.match(/.*godzilla.*/i)) {
                    var qaMsg = data.name + " build #" + data.build.number + " : " + data.build.status + " -- " + data.build.full_url;
                    logger.minorInfo("Notifying QA: %s", qaMsg);
                    robot.messageRoom('C1MH5A8TU', qaMsg);
                }
                // Notify QA on certain custom builds
                if (data.name.match(/.*custom.*/i) || data.name.match(/.*any.*/i) || data.name.match(/.*statement.*/i) || data.name.match(/.*customer.*/i) || data.name.match(/.*nodegraphql.*/i) || data.name.match(/.*cmsTrade.*/i)) {
                    var params = data.build.parameters ? data.build.parameters : {};
                    var serverName = params.SERVER_HOSTNAME ? params.SERVER_HOSTNAME : params.SERVER_NAME + '.intranet.1stdibs.com';
                    var customMsg = data.name + " build #" + data.build.number + " : " + data.build.status + " -- " + data.build.full_url;
                    var customDetails = "↳ built " + params.BRANCH_NAME + " to " + serverName;
                    logger.minorInfo("Custom build: %s", params.SERVER_HOSTNAME);
                    logger.minorInfo("Custom build: %s", params.BRANCH_NAME);
                    robot.messageRoom('C1MH5A8TU', customMsg);
                    robot.messageRoom('C1MH5A8TU', customDetails);
                    // Notify Goods team on imperial custom builds
                 //   if (serverName.match(/.*deathstar.*/i) || serverName.match(/.*goods.*/i) || serverName.match(/.*stardestroyer.*/i)) {
                 //       robot.messageRoom('goods', customMsg);
                 //       robot.messageRoom('goods', customDetails);
                 //   }
                }
                // Notify the release channel when stage or prod get built
                var releaseRoom = 'C24UWKLR0';
                if (data.name.match(/.*stage.*/i) && !data.name.match(/.*selenium.*/i) && !data.name.match(/.*godzilla.*/i)) {
                    var qaMsg = data.name + " build #" + data.build.number + " : " + data.build.status + " -- " + data.build.full_url;
                    logger.minorInfo("Notifying Release Channel: %s", qaMsg);
                    robot.messageRoom(releaseRoom, qaMsg);
                }
                if (data.name.match(/.*prod.*/i) && !data.name.match(/.*selenium.*/i) && !data.name.match(/.*godzilla.*/i) && !data.name.match(/.*everything except.*/i)) {
                    var qaMsg = data.name + " build #" + data.build.number + " : " + data.build.status + " -- " + data.build.full_url;
                    logger.minorInfo("Notifying Release Channel: %s", qaMsg);
                    robot.messageRoom(releaseRoom, qaMsg);
                }
                if (data.name.match(/.*hotfix.*/i)) {
                    var qaMsg = data.name + " build #" + data.build.number + " : " + data.build.status + " -- " + data.build.full_url;
                    logger.minorInfo("Notifying Release Channel: %s", qaMsg);
                    robot.messageRoom(releaseRoom, qaMsg);
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
                        robot.messageRoom('C02FRPJJ5', "Mothra has the upper hand!");
                        robot.messageRoom('C02FRPJJ5', "http://i.imgur.com/CoqJxBx.gif");
                    }
                    if (data.name === 'MechaGodzilla .com (Prod)') {
                        makeSound('mechawins');
                        robot.messageRoom('C02FRPJJ5', "Mecha Godzilla is winning!:poop::poop::poop:");
                        robot.messageRoom('C02FRPJJ5', "http://i.imgur.com/AoeZXir.gif");
                    }
                }
                if (data.build.status === 'SUCCESS') {
                    // Text and audio notifications
                    if (data.name === 'Weekly Production Release') {
                        makeSound('shipit');
                        robot.messageRoom('C02FZMJLL', '1stdibs weekly production release is complete!');
                        robot.messageRoom('C02FZMJLL', 'I hope you know what you\'re doing...');
                    }
                    if (data.name === '1stdibs.com Deploy Production PROD PROD PROD PROD' && params.Hotfix === 'true') {
                        makeSound('shipit');
                        robot.messageRoom('C02FZMJLL', '1stdibs.com hotfix has been released!');
                        robot.messageRoom('C02FZMJLL', 'I hope you know what you\'re doing...');
                    }
                    if (data.name === 'Admin-v2 Deploy (PROD)' && params.Hotfix === 'true') {
                        makeSound('shipit-adminv2');
                        robot.messageRoom('C02FZMJLL', 'Admin v2 hotfix has been released!');
                        robot.messageRoom('C02FZMJLL', 'I hope you know what you\'re doing...');
                    }
                    if (data.name === 'Admin-v1 Deploy (PROD) (RACKSPACE)' && params.Hotfix === 'true') {
                        makeSound('shipit-adminv1');
                        robot.messageRoom('C02FZMJLL', 'Admin v1 hotfix has been released!');
                        robot.messageRoom('C02FZMJLL', 'I hope you know what you\'re doing...');
                    }
                    if (data.name === 'JAVA-InventoryService (Hotfix to Prod)') {
                        makeSound('shipit-inventory');
                        robot.messageRoom('C02FZMJLL', 'Inventory service hotfix has been released!');
                        robot.messageRoom('C02FZMJLL', 'I hope you know what you\'re doing...');
                    }
                    if (data.name === 'JAVA-IdentityService (Hotfix to Prod)') {
                        makeSound('shipit-identity');
                        robot.messageRoom('C02FZMJLL', 'Identity service hotfix has been released!');
                        robot.messageRoom('C02FZMJLL', 'I hope you know what you\'re doing...');
                    }
                    if (data.build && data.build.parameters && data.build.parameters.SERVER_HOSTNAME === 'deathstar.1stdibs.com') {
                        makeSound('deathstar');
                        robot.messageRoom('C02FRPJJ5', 'The Death Star is now fully armed and operational');
                    }
                    if (data.name === 'MechaGodzilla .com (Prod)') {
                        makeSound('mechaloses');
                        robot.messageRoom('C02FRPJJ5', 'Mecha Godzilla has been defeated!:excited_tomato::excited_tomato::excited_tomato:');
                        robot.messageRoom('C02FRPJJ5', "http://i.imgur.com/t8tLizl.gif");
                    }
                    if (data.name === 'Mothra-Ecom (QA)') {
                        makeSound('mothra-qa');
                    }
                    ///////////////////////////////////
                    // Spreadsheet auto-updater logic
                    ///////////////////////////////////
                    var params = data.build.parameters ? data.build.parameters : {};
                    var serverName = params.SERVER_HOSTNAME ? params.SERVER_HOSTNAME : params.SERVER_NAME + '.intranet.1stdibs.com';
                    if (data.name.match(important) || serverName.match(important) ) {
                        var envName = data.name.match(important) ? data.name.match(important)[0] : serverName.match(important)[0];
                        console.log('Matchy thing: ' + envName);
                        console.log('SREADSHEET -- An important build has completed!');
                        var sheet;
                        var simpleBuildName = data.name.replace(sanitize,'');
                        async.series([
                            function setAuth(step) {
                                var creds = require('/etc/pm2/google-generated-creds.json');
                                console.log(creds);
                                doc.useServiceAccountAuth(creds, step);
                                console.log('xxxxxxxx');
                            },
                            function debugLog(step) {
                                console.log('SPREADSHEET -- Debug step executing');
                                step();
                            },
                            function debugWorksheetInfo(step) {
                                console.log('SPREADSHEET -- Debug worksheet info:');
                                doc.getInfo(function (err, info) {
                                    console.log('SREADSHEET -- Loaded doc: ' + info.title + ' by ' + info.author.email);
                                    sheet = info.worksheets[0];
                                    console.log('SREADSHEET -- sheet 1: ' + sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);
                                    step();
                                });
                            },
                            function updateMatchingRows(step) {
                                sheet.getCells({
                                    'min-row': 1,
                                    //'max-row': 1,
                                    'return-empty': true
                                }, function (err, cells) {
                                    //console.log(cells);
                                    for (var i = 0; i < cells.length; i++) {
                                        var cell = cells[i];
                                        if (cell.col === 1 && cell.value.length > 0) {
                                            console.log('SREADSHEET -- Cell R' + cell.row + 'C' + cell.col + ' = ' + cell.value);
                                            //if (cell.value === 'Identity') {
                                            var fullName = cell.value;
                                            var simpleRowName = cell.value.replace(sanitize,'');
                                            console.log('Simplified spreadsheet name: ' + simpleRowName);
                                            console.log('Simplified build name: ' + simpleBuildName);
                                            if (simpleRowName.toLowerCase() === (simpleBuildName.toLowerCase())) {
                                                var releaseStatus = cells[i + 1];
                                                var releaseTime = cells[i + 2];
                                                var localFullName = cell.value;
                                                var newReleaseTime = moment().format('YYYY-M-D HH:mm');
                                                console.log('Old release status: ' + releaseStatus.value);
                                                console.log('New release status: ' + envName);
                                                console.log('Release time: ' + newReleaseTime);
                                                releaseStatus.value = envName;
                                                releaseTime.value = newReleaseTime;
                                                console.log('SPREADSHEET -- Going to update: ' + cell.value + ' to ' + releaseStatus.value);
                                                releaseStatus.save(function () { console.log('SPREADSHEET -- Successfully updated ' + localFullName + ' to ' + releaseStatus.value); });
                                                releaseTime.save(function () { console.log('SPREADSHEET -- Successfully logged release time as ' + releaseTime.value); });
                                            }
                                        }
                                    }
                                    step();
                                });
                            }
                        ]);
                    }
                }
            }
        } catch (error) {
            logger.error(error, req.body);
        }
    });
};

