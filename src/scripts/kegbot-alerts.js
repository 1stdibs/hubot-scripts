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

function explainBeverage (beverage) {
    var base = beverage.name;
    var bits = [];
    if (beverage.style) {
        bits.push(beverage.style);
    }
    if (beverage.abv_percent) {
        var abv = parseFloat(beverage.abv_percent);
        bits.push(abv.toFixed(1) + '% ABV');
    }
    if (bits.length) {
        base += ' [' + bits.join(' - ') + ']';
    }
    return base;
}

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
                    //console.log(data);//See Examples at end of this file
                    robot.messageRoom('#general', ':beers: Session Started! :beers:');
                    //Comment about the hour! =)
                    break;
                case 'session_joined':
                    //console.log(data);//See Examples at end of this file
                    //Re-enable this when we have instant drink attribution
                    //i.e. session joined by bob
                    //robot.messageRoom('#general', 'Session Joined');
                    break;
                case 'keg_tapped':
                    //console.log(data);//See Examples at end of this file
                    robot.messageRoom('#general', ':boom: Keg Tapped! :beers:');
                    if (data.keg && data.keg.beverage) {
                        var liters = (parseFloat(data.keg.volume_ml_remain) / 1000).toFixed(1);
                        robot.messageRoom('#general', liters + ' liters of ' + explainBeverage(data.keg.beverage) + '\n✨🚚✨ Come and get it ✨🆓🍺✨');
                    }
                    break;
                case 'keg_ended':
                    //console.log(data);//See Examples at end of this file
                    robot.messageRoom('#general', ':exclamation: Keg Ended :dizzy_face:');
                    if (data.keg && data.keg.beverage) {
                        robot.messageRoom('#general', '🙋 Goodbye ' + explainBeverage(data.keg.beverage) + ' 🙎');
                    }
                    break;
                case 'drink_poured':
                    //console.log(data);//See Examples at end of this file
                    var who = data.user.display_name;
                    if (who === 'guest') {
                        who = 'Someone';
                    }
                    var drankMl = parseFloat(data.drink.volume_ml);
                    var drankOz = drankMl * 0.033814;//ml -> oz
                    var drankPints = drankOz * 0.0625;
                    var drinkName = data.keg.beverage.name;
                    var amount = (drankOz.toFixed(1)) + 'oz';
                    if (drankPints > 1) {
                        amount = (drankPints.toFixed(1)) + ' pints';//shame? credit?
                    }
                    var msg = who + ' poured ' + amount + ' of ' + drinkName;
                    console.log("Someone poured " + data.drink.volume_ml);
                    console.log("There's " + data.keg.volume_ml_remain + " left");
                    robot.messageRoom('#general', msg);
                    break;
            }
        } catch (error) {
            console.log(error);
        }
    });
};


/**
 *
 * Example Events Data

 { kind: 'session_started',
   user_id: 'guest',
   drink:
    { volume_ml: 127.38619676945667,
      user_id: 'guest',
      url: '/drinks/488',
      ticks: 347,
      session_id: 14,
      keg:
       { volume_ml_remain: 34999.89118942735,
         full_volume_ml: 58673.9,
         illustration_thumbnail_url: 'http://localhost/static/images/keg/thumb/keg-srm14-3.png',
         served_volume_ml: 23674.008810572657,
         type_id: '6',
         spilled_ml: 0,
         start_time: '2015-05-15T19:49:19+00:00',
         illustration_url: 'http://localhost/static/images/keg/full/keg-srm14-3.png',
         percent_full: 59.65155067146951,
         size_name: 'half-barrel',
         beverage: [Object],
         size_id: 0,
         end_time: '2015-05-15T19:49:19+00:00',
         keg_type: 'half-barrel',
         online: true,
         remaining_volume_ml: 34999.89118942735,
         spilled_volume_ml: 0,
         type: [Object],
         id: 6,
         size_volume_ml: 58673.9,
         size: [Object] },
      session:
       { name: '',
         url: '/sessions/2015/5/26/14',
         start_time: '2015-05-26T17:30:48.663606+00:00',
         volume_ml: 127.38619676945667,
         end_time: '2015-05-26T20:30:48.663606+00:00',
         id: 14 },
      user:
       { username: 'guest',
         url: '/drinkers/guest',
         is_active: true,
         display_name: 'guest' },
      time: '2015-05-26T17:30:48.663606+00:00',
      duration: 2,
      keg_id: 6,
      id: 488 },
   session_id: 14,
   session:
    { name: '',
      url: '/sessions/2015/5/26/14',
      start_time: '2015-05-26T17:30:48.663606+00:00',
      volume_ml: 127.38619676945667,
      is_active: true,
      end_time: '2015-05-26T20:30:48.663606+00:00',
      id: 14 },
   drink_id: 488,
   time: '2015-05-26T17:30:48.663606+00:00',
   id: 527,
   user:
    { username: 'guest',
      display_name: 'guest',
      url: '/drinkers/guest',
      is_active: true,
      is_superuser: false,
      is_staff: false,
      last_login: '2015-05-08T20:54:35+00:00',
      email: '',
      date_joined: '2015-05-08T20:54:35+00:00' } }

 { kind: 'drink_poured',
   user_id: 'guest',
   keg:
    { volume_ml_remain: 4700.555947136541,
      full_volume_ml: 19570.6,
      illustration_thumbnail_url: 'http://localhost/static/images/keg/thumb/keg-srm14-1.png',
      served_volume_ml: 14870.044052863457,
      type_id: '5',
      spilled_ml: 0,
      start_time: '2015-05-15T19:47:31+00:00',
      illustration_url: 'http://localhost/static/images/keg/full/keg-srm14-1.png',
      percent_full: 24.018455985695596,
      size_name: 'sixth',
      beverage:
       { abv_percent: 5,
         picture: [Object],
         style: 'Brown Ale',
         beverage_type: 'beer',
         name: 'Nut Brown',
         producer: [Object],
         id: 5,
         color_hex: '#C35900' },
      size_id: 0,
      end_time: '2015-05-15T19:47:31+00:00',
      keg_type: 'sixth',
      online: true,
      remaining_volume_ml: 4700.555947136541,
      spilled_volume_ml: 0,
      type:
       { name: 'Nut Brown',
         style_id: '0',
         image: [Object],
         abv: 5,
         brewer_id: '3',
         id: '5' },
      id: 5,
      size_volume_ml: 19570.6,
      size: { volume_ml: 19570.6, id: 0, name: 'sixth' } },
   drink:
    { volume_ml: 342.143906020558,
      user_id: 'guest',
      url: '/drinks/429',
      ticks: 932,
      session_id: 13,
      keg:
       { volume_ml_remain: 4700.555947136541,
         full_volume_ml: 19570.6,
         illustration_thumbnail_url: 'http://localhost/static/images/keg/thumb/keg-srm14-1.png',
         served_volume_ml: 14870.044052863457,
         type_id: '5',
         spilled_ml: 0,
         start_time: '2015-05-15T19:47:31+00:00',
         illustration_url: 'http://localhost/static/images/keg/full/keg-srm14-1.png',
         percent_full: 24.018455985695596,
         size_name: 'sixth',
         beverage: [Object],
         size_id: 0,
         end_time: '2015-05-15T19:47:31+00:00',
         keg_type: 'sixth',
         online: true,
         remaining_volume_ml: 4700.555947136541,
         spilled_volume_ml: 0,
         type: [Object],
         id: 5,
         size_volume_ml: 19570.6,
         size: [Object] },
      session:
       { name: '',
         url: '/sessions/2015/5/22/13',
         start_time: '2015-05-22T16:35:47+00:00',
         volume_ml: 1139.13362701909,
         end_time: '2015-05-22T20:26:42.786574+00:00',
         id: 13 },
      user:
       { username: 'guest',
         url: '/drinkers/guest',
         is_active: true,
         display_name: 'guest' },
      time: '2015-05-22T17:26:42.786574+00:00',
      duration: 6,
      keg_id: 5,
      id: 429 },
   session_id: 13,
   session:
    { name: '',
      url: '/sessions/2015/5/22/13',
      start_time: '2015-05-22T16:35:47+00:00',
      volume_ml: 1139.13362701909,
      is_active: true,
      end_time: '2015-05-22T20:26:42.786574+00:00',
      id: 13 },
   drink_id: 429,
   time: '2015-05-22T17:26:42.786574+00:00',
   keg_id: 5,
   id: 467,
   user:
    { username: 'guest',
      display_name: 'guest',
      url: '/drinkers/guest',
      is_active: true,
      is_superuser: false,
      is_staff: false,
      last_login: '2015-05-08T20:54:35+00:00',
      email: '',
      date_joined: '2015-05-08T20:54:35+00:00' } }

 { kind: 'session_joined',
   user_id: 'guest',
   drink:
    { volume_ml: 180.2496328928047,
      user_id: 'guest',
      url: '/drinks/872',
      ticks: 491,
      session_id: 24,
      keg:
       { volume_ml_remain: 58493.6503671072,
         full_volume_ml: 58673.9,
         illustration_thumbnail_url: 'http://localhost/static/images/keg/thumb/keg-srm14-5.png',
         served_volume_ml: 180.2496328928047,
         type_id: '10',
         spilled_ml: 0,
         start_time: '2015-06-04T17:10:24+00:00',
         illustration_url: 'http://localhost/static/images/keg/full/keg-srm14-5.png',
         percent_full: 99.69279418464973,
         size_name: 'half-barrel',
         beverage: [Object],
         size_id: 0,
         end_time: '2015-06-04T17:10:24+00:00',
         keg_type: 'half-barrel',
         online: true,
         remaining_volume_ml: 58493.6503671072,
         spilled_volume_ml: 0,
         type: [Object],
         id: 10,
         size_volume_ml: 58673.9,
         size: [Object] },
      session:
       { name: '',
         url: '/sessions/2015/6/4/24',
         start_time: '2015-06-04T16:40:10+00:00',
         volume_ml: 4617.4743024963245,
         end_time: '2015-06-04T20:16:48.339404+00:00',
         id: 24 },
      user:
       { username: 'guest',
         url: '/drinkers/guest',
         is_active: true,
         display_name: 'guest' },
      time: '2015-06-04T17:16:48.339404+00:00',
      duration: 3,
      keg_id: 10,
      id: 872 },
   session_id: 24,
   session:
    { name: '',
      url: '/sessions/2015/6/4/24',
      start_time: '2015-06-04T16:40:10+00:00',
      volume_ml: 4617.4743024963245,
      is_active: true,
      end_time: '2015-06-04T20:16:48.339404+00:00',
      id: 24 },
   drink_id: 872,
   time: '2015-06-04T17:16:48.339404+00:00',
   id: 960,
   user:
    { username: 'guest',
      display_name: 'guest',
      url: '/drinkers/guest',
      is_active: true,
      is_superuser: false,
      is_staff: false,
      last_login: '2015-05-08T20:54:35+00:00',
      email: '',
      date_joined: '2015-05-08T20:54:35+00:00' } }

 { keg:
    { volume_ml_remain: 58493.6503671072,
      full_volume_ml: 58673.9,
      illustration_thumbnail_url: 'http://kegbot.intranet.1stdibs.com/static/images/keg/thumb/keg-srm14-5.png',
      served_volume_ml: 180.249632892805,
      type_id: '10',
      spilled_ml: 0,
      start_time: '2015-06-04T17:10:24+00:00',
      illustration_url: 'http://kegbot.intranet.1stdibs.com/static/images/keg/full/keg-srm14-5.png',
      percent_full: 99.69279418464973,
      size_name: 'half-barrel',
      beverage:
       { abv_percent: 7.5,
         style: 'American Pale Wheat Ale',
         beverage_type: 'beer',
         name: 'Little Sumpin\' Sumpin\'',
         producer: [Object],
         id: 10,
         color_hex: '#C35900' },
      size_id: 0,
      end_time: '2015-06-04T17:18:37.973860+00:00',
      keg_type: 'half-barrel',
      online: false,
      remaining_volume_ml: 58493.6503671072,
      spilled_volume_ml: 0,
      type:
       { style_id: '0',
         brewer_id: '10',
         id: '10',
         abv: 7.5,
         name: 'Little Sumpin\' Sumpin\'' },
      id: 10,
      size_volume_ml: 58673.9,
      size: { volume_ml: 58673.9, id: 0, name: 'half-barrel' } },
   kind: 'keg_ended',
   keg_id: 10,
   id: 963,
   time: '2015-06-04T17:18:37.973860+00:00' }


 { keg:
    { volume_ml_remain: 300000,
      full_volume_ml: 300000,
      illustration_thumbnail_url: 'http://kegbot.intranet.1stdibs.com/static/images/keg/thumb/keg-srm14-5.png',
      served_volume_ml: 0,
      type_id: '11',
      spilled_ml: 0,
      start_time: '2015-06-04T17:19:21.952989+00:00',
      illustration_url: 'http://kegbot.intranet.1stdibs.com/static/images/keg/full/keg-srm14-5.png',
      percent_full: 100,
      size_name: 'euro-30-liter',
      beverage:
       { abv_percent: 5,
         style: 'Euro Pale Lager',
         beverage_type: 'beer',
         name: 'Singha',
         producer: [Object],
         id: 11,
         color_hex: '#C35900' },
      size_id: 0,
      end_time: '2015-06-04T17:19:21.935447+00:00',
      keg_type: 'euro-30-liter',
      online: true,
      remaining_volume_ml: 300000,
      spilled_volume_ml: 0,
      type:
       { style_id: '0',
         brewer_id: '11',
         id: '11',
         abv: 5,
         name: 'Singha' },
      id: 12,
      size_volume_ml: 300000,
      size: { volume_ml: 300000, id: 0, name: 'euro-30-liter' } },
   kind: 'keg_tapped',
   keg_id: 12,
   id: 964,
   time: '2015-06-04T17:19:21.952989+00:00' } */

