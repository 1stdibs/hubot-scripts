// Notifies about Beer
//
// Dependencies:
//   "url": ""
//   "querystring": ""
//   "colors" : ""
//
// Commands:
//   None
//
// URLS:
//   POST /hubot/kegbot-alerts
//
// Authors:
//   spajus, cmckendry, andromedado, JasonSmiley

var url = require('url');
var querystring = require('querystring');
var http = require('http');
var colors = require('colors');
var util = require('util');

module.exports = function(robot) {


    return robot.router.post("/hubot/kegbot-alerts", function(req, res) {
        var build, data, envelope, query, room;
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
        try {
            data = req.body.data;
            switch (data.kind) {
                case 'session_started':
                    console.log(data);
                    robot.messageRoom('#general', ':beers: Session Started! :beers:');
                    break;
                case 'session_joined':
                    console.log(data);
                    robot.messageRoom('#general', 'Session Joined');
                    break;
                case 'keg_tapped':
                    console.log(data);
                    robot.messageRoom('#general', ':dizzy_face: Keg Tapped! :boom:');
                    break;
                case 'keg_ended':
                    console.log(data);
                    robot.messageRoom('#general', ':exclamation: Keg Ended :exclamation:');
                    break;
                case 'drink_poured':
                    var who = data.user.display_name;
                    if (who === 'guest') {
                        who = 'Someone';
                    }
                    var drankMl = parseFloat(data.drink.volume_ml);
                    var drankOz = drankMl * 0.033814;
                    var drinkName = data.keg.beverage.name;
                    var msg = who + ' poured ' + (drankOz.toFixed(1)) + 'oz of ' + drinkName;
                    console.log("Someone drank " + data.drink.volume_ml);
                    console.log("There's " + data.keg.volume_ml_remain + " left");
                    robot.messageRoom('#general', msg);
                    break;
            }
        } catch (error) {
            console.log(error);
        }
    });
};

