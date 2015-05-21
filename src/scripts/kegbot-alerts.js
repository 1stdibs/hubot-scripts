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
            var who = data.user.display_name;
            var drankMl = parseFloat(data.drink.volume_ml);
            var drankOz = drankMl * 0.033814;
            var drinkName = data.keg.beverage.name;
            var msg = who + ' drank ' + (drankOz.toFixed(1)) + 'oz of ' + drinkName;
            console.log(data);
            console.log("Someone drank " + data.drink.volume_ml);
            console.log("There's " + data.keg.volume_ml_remain + " left");
            robot.messageRoom('#general', msg);
            //robot.messageRoom('#general', "data.keg.volume_ml_remain");
        } catch (error) {
            console.log(error);
        }
    });
};

