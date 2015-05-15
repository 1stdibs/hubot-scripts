//
// Description:
//   Send a request to play a youtube video
//
// Commands:
//   hubot tube me <video> - Plays the audio from a youtube video
//   hubot tube stop - Stops the current youtube video audio that is playing
//            
// Authors:
//   jballant
//
/*jshint node:true */
"use strict";

var http = require('http');
var logger = require('./support/logger');
var XSERV_BASE_URL = 'http://xserv:5051/';

function makeUrl (tubeUrl) {
    var findVideoIdForUrlReg = /^https:\/\/www\.youtube\.com\/watch\?v=(\w+)/;
    var matches = tubeUrl.match(findVideoIdForUrlReg);
    var vidId;
    if (matches && matches[1]) {
        vidId = matches[1];
    } else {
        return null;
    }
    return XSERV_BASE_URL + 'youtube/?vid=' + encodeURIComponent(vidId); 
}

function makePlayVideoRequest (tubeUrl, callback) {
    var url = makeUrl(tubeUrl);
    if (!url) {
        logger.minorInfo('Could not create play url for link %s', tubeUrl);
        return callback('Malformed youtube link');
    }
    logger.minorInfo('Requesting youtube sound clip "%s"', url);
    callback(null, url);
    // http.get(url, function (res) {
    //     logResponse(url, res);
    //     if (callback) {
    //         callback(null, url);
    //     }
    // });
}

function makeStopVideoRequest (callback) {
    var url = XSERV_BASE_URL + 'stop-youtube';
    logger.minorInfo('Requesting that the current youtube clip stop playing');
    http.get(url, function (res) {
        logResponse(url, res);
        if (callback) {
            callback();
        }
    });
}

function logResponse (url, res) {
    logger.requestResolution(url, res.statusCode);
}

function notFound (message) {
    return message.send('Not found');
}

module.exports = function (robot) {
    
    robot.respond(/tube me (.+)/i, function (message) {
        if (!message.match[1]) {
            logger.minorInfo('Could not find url match in message');
            return notFound(message);
        }
        var url = message.match[1];
        makePlayVideoRequest(url, function (err, finalUrl) {
            if (err) {
                return message.send(err);
            }
            return message.send("FIANL URL " + finalUrl);
        });
    });

    robot.respond(/tube stop/i, function (message) {
        makeStopVideoRequest();
    });

};