// Description:
//   Hit an api with play and stop commands to play youtube videos
// 
// Configuration:
//   HUBOT_YOUTUBE_API_BASE_URL
// 
// Description:
//   Send a request to play a youtube video
//
// Commands:
//   hubot tube me <video> - Plays or queues the audio from a youtube video
//   hubot tube stop - Stops the current youtube video audio that is playing and empties the queue
//   hubot tube next - Proceeds to the next youtube clip in the queue
//            
// Authors:
//   jballant
//
/*jshint node:true */
"use strict";

var http = require('http');
var logger = require('./support/logger');
var nodeUrl = require('url');
var HUBOT_YOUTUBE_API_BASE_URL = "" + (process.env.HUBOT_YOUTUBE_API_BASE_URL || 'http://xserve:5051/');
var SPOTIFY_URL = "" + (process.env.HUBOT_SPOT_URL || "http://localhost ");

function makeUrl (tubeUrl) {
    // var findVideoIdForUrlReg = /^https:\/\/www\.youtube\.com\/watch\?v=(\w+)/;
    // var matches = tubeUrl.match(findVideoIdForUrlReg);
    // var vidId;
    // if (matches && matches[1]) {
    //     vidId = matches[1];
    // } else {
    //     return null;
    // }
    if (!tubeUrl) {
        return null;
    }
    return HUBOT_YOUTUBE_API_BASE_URL + 'play-youtube-uri?uri=' + encodeURIComponent(tubeUrl); 
}

function isValidTubeURL (url) {
    return (/^https:\/\/www\.youtube\.com\/watch\/?\?v=(\w+)/).test(url);
}

function hmsToSecondsOnly(str) {
    var p = str.split(':');
    var s = 0;
    var m = 1;
    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s;
}

function makeGetRequest (url, callback) {
    http.get(url, function (res) {
        logResponse(url, res);
        var body = '';
        if (callback) {
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                logInfo(body);
                if (res.statusCode >= 400) {
                    return callback('Request error for url "' + url + '" - status code: ' + res.statusCode, body);
                }
                callback(null, body);
            });
        }
    }).on('error', function (e) {
        logErr(e);
        if (callback) {
            callback(e);
        }
    });
}

function makePlayVideoRequest (tubeUrl, callback) {
    var url = makeUrl(tubeUrl);
    if (!url) {
        logInfo('Could not create play url for link %s', tubeUrl);
        return callback('Malformed youtube link');
    }
    logger.minorInfo('Requesting youtube sound clip "%s"', url);
    makeGetRequest(url, callback);
}

function makeStopVideoRequest (callback) {
    var url = HUBOT_YOUTUBE_API_BASE_URL + 'kill-video';
    logger.minorInfo('Requesting that the current youtube clip stop playing');
    makeGetRequest(url, callback);
}

// function makeSpotifyRequest (action, volume callback) {
//     var resolved = false;
//     var url = SPOTIFY_URL + '/' + action
//     var urlOptions = nodeUrl.
//     return http.request().query(options)[action]()(function (err, res, body) {
//         resolved = true;
//         return callback(err, res, body);
//     });
// }

function pauseSpotify (callback) {
    // return 
}

function restartSpotify (callback) {
    // body...
}

function logResponse (url, res) {
    logger.requestResolution(url, res.statusCode);
}

function logInfo () {
    logger.minorInfo.apply(logger, arguments);
}

function logErr (err) {
    logger.error(err);
}

function notFound (message) {
    return message.send('Not found');
}

module.exports = function (robot) {

    var playingVideo = false;
    var videoQueue = [];
    var videoTimeout;

    var clearVideoTimeout = function () {
        if (videoTimeout) {
            logInfo("Clearing current video timeout that is playing");
            clearTimeout(videoTimeout);
        }
    };

    var waitForVideoToFinish = function (message, videoUrl, videoTimeInHMS) {
        var wait = ((hmsToSecondsOnly(videoTimeInHMS) * 1000) + 4000);
        videoTimeout = setTimeout(function () {
            playingVideo = false;
            logInfo("youtube clip %s finished", videoUrl);
            if (videoQueue.length) {
                logInfo("Proceeding to next clip in queue");
                tubeMePlayVideo(message);
            } else {
                logInfo("End of youtube queue");
            }
        }, wait);
        logInfo("Waiting %s seconds, then will proceed to next item in queue", wait / 1000);
    };

    var tubeMePlayVideo = function (message) {
        if (!videoQueue.length) {
            return message.send("Youtube clip queue empty");
        }
        playingVideo = true;
        var nextUrl = videoQueue.shift();
        logInfo("deQueueing youtube clip %s", nextUrl);
        makePlayVideoRequest(nextUrl, function (err, time) {
            if (err) {
                playingVideo = false;
                return message.send(err);
            }

            waitForVideoToFinish(message, nextUrl, time);

            message.send("Playing youtube clip " + nextUrl);
        });
    };
    
    robot.respond(/tube me (.+)/i, function (message) {
        if (!message.match[1]) {
            logger.minorInfo('Could not find url match in message');
            return notFound(message);
        }
        var url = message.match[1];
        if (!isValidTubeURL(url)) {
            return message.send("Invalid youtube url");
        }
        videoQueue.push(url);
        if (playingVideo) {
            return message.send('Youtube clip ' + url + ' queued');
        }
        tubeMePlayVideo(message);
    });

    robot.respond(/tube next/i, function (message) {
        makeStopVideoRequest(function (err) {
            if (err) {
                logErr(err);
                return message.send('Error stopping youtube clip');
            }
            playingVideo = false;
            clearVideoTimeout();
            tubeMePlayVideo(message);
        });
    });

    robot.respond(/tube stop/i, function (message) {
        makeStopVideoRequest(function (err) {
            if (err) {
                logErr(err);
                return message.send('Error stopping youtube clip');
            }
            playingVideo = false;
            clearVideoTimeout();
            videoQueue = [];
            message.send("Stopped youtube clip");
        });
    });

};