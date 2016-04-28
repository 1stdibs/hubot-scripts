// Description:
//   Allows running some simple volume controls on a Sonos system
//
// Dependencies:
//   "sonos": "^0.8.0"
//
// Configuration:
//   HUBOT_SONOS_HOST
//   HUBOT_SONOS_PORT
//   HUBOT_SONOS_MAX_VOLUME
//
// Commands:
//   hubot vol + - Increase the volume a little
//   hubot vol - - Decrease the volume a little
//   hubot vol ++ - Increase the volume by quite a bit
//   hubot vol -- - Decrease the volume by quite a bit
//   hubot set vol to <number> - Set the volume to a specific number (between 0 and 100)
//   hubot lock vol at <number> - Lock the volume for a few minutes at a specific volume
//   hubot mute - Set the volume to 0
//   hubot unmute - Restore volume to level before mute
// 
// Author:
//   berg, jballant
//

var logger = require('./support/logger');
var sonos = require('sonos');

var DEFAULT_MAX_VOL = 50;

var MAX_PUBLIC_VOLUME = 100;
var MIN_PUBLIC_VOLUME = 0;

var maxVol = DEFAULT_MAX_VOL;

var savedVolume = null;

var sonosInstance = [];

var volumeIsLocked = false;

var SONOS_HOST_MAP = {
    'main'  : process.env.HUBOT_SONOS_HOST,
    'bar '  : '192.168.96.159'
};

var SONOS_PORT_MAP = {
    'main'  : process.env.HUBOT_SONOS_PORT,
    'bar '  : process.env.HUBOT_SONOS_PORT
};

function getSonos(type) {
    var host;
    var port;

    type = type || 'main';

    if (!sonosInstance[type]) {
        host = SONOS_HOST_MAP[type];
        port = SONOS_PORT_MAP[type] || 1400;
        maxVol = process.env.HUBOT_SONOS_MAX_VOLUME || DEFAULT_MAX_VOL;
        maxVol = parseInt(maxVol, 10);
        sonosInstance[type] = new sonos.Sonos(host, port);
    }
    return sonosInstance[type];
}

function getPrivateVolume (callback, type) {
    logInfo('Getting sonos volume...');
    getSonos(type).getVolume(function (err, vol) {
        if (vol) {
            logInfo('Got sonos volume %s', vol);
        }
        callback(err, vol);
    });
}

/**
 * Give the public facing volume, and this will translate it into
 * the value to use privately
 *
 * @param vol
 * @returns {number}
 */
function publicToPrivateVolume (vol) {
    var ratio = MAX_PUBLIC_VOLUME / maxVol;
    logInfo('Calculating new volume with input "%s" and ratio to sonos "%s"', vol, ratio);
    return Math.floor(vol / ratio);
}

/**
 * Give the private volume, and this will translate it into
 * the public facing integer
 *
 * @param vol
 * @returns {number}
 */
function privateToPublicVolume (vol) {
    var ratio = MAX_PUBLIC_VOLUME / maxVol;
    logInfo('Calculating original user input volume with input "%s" and ratio to sonos "%s"', vol, ratio);
    return Math.ceil(vol * ratio);
}

function setVolumeTo (newVolume, callback, type) {
    if (newVolume < 0) {
        logInfo('New volume less than 0, using 0 instead');
        newVolume = 0;
    } else if (newVolume > maxVol) {
        logInfo('New volume greater than max, using max volume');
        newVolume = maxVol;
    }
    logInfo('Setting sonos volume to %s', String(newVolume));
    getSonos(type).setVolume(newVolume, callback);
}

function increaseVolByAmount (amount, callback) {
    logInfo('Increasing volume by %s', amount);
    getPrivateVolume(function (err, volume) {
        if (err) {
            return callback(err);
        }
        volume = parseInt(volume, 10);
        var newVol = publicToPrivateVolume(privateToPublicVolume(volume) + amount);
        logInfo('Calculated new sonos volume: %s', newVol);
        setVolumeTo(newVol, callback);
    });
}

function logErr (err) {
    logger.error(err);
}

function logInfo () {
    logger.minorInfo.apply(logger, arguments);
}

function sendErrorMessage (msg, err) {
    if (err && err.message) {
        logErr(err);
    }
    var text = (err && typeof err === 'string') ? err : 'An error occurred communicating with Sonos';
    return msg.send(text);
}

function lockVolume () {
    var duration = (3 * 60 * 1000);
    logInfo('Locking sonos volume for %s seconds', duration / 1000);
    volumeIsLocked = true;
    setTimeout(function () {
        volumeIsLocked = false;
        logInfo('Volume is now unlocked');
    }, duration);
}

var volumeKeywords = {
    '💯' : MAX_PUBLIC_VOLUME,
    ':100:' : MAX_PUBLIC_VOLUME,
    'max' : MAX_PUBLIC_VOLUME
};

var relativeVolumeKeywords = {
    '-' : function (curVolume) {
        return curVolume - 7;
    },
    '--' : function (curVolume) {
        return curVolume - 14;
    },
    '+' : function (curVolume) {
        return curVolume + 7;
    },
    '++' : function (curVolume) {
        return curVolume + 14;
    }
};

function boundPublicVolume (vol) {
    return Math.min(MAX_PUBLIC_VOLUME, Math.max(0, vol));
}

/**
 * This will be able to handle things like emoji/keywords
 *
 * @param volume
 * @param callback
 */
function volumeToInt(volume, callback, type) {
    var vol = (volume + '').replace(/^\s+|\s+$/g, '');
    if ((/^\d+$/).test(vol)) {
        callback(null, boundPublicVolume(parseInt(vol, 10)));
        return;
    }
    if (volumeKeywords.hasOwnProperty(vol)) {
        callback(null, boundPublicVolume(volumeKeywords[vol]));
        return;
    }
    if (relativeVolumeKeywords.hasOwnProperty(vol)) {
        getPrivateVolume(function (err, privateVolume) {
            if (err) {
                callback(err);
                return;
            }
            var currentVolume = privateToPublicVolume(privateVolume);
            callback(null, boundPublicVolume((relativeVolumeKeywords[vol])(currentVolume)));
        });
        return;
    }
    callback('Unable to parse volume param: ' + volume);
}

module.exports = function(robot) {

    function getVolumeWithMsg (msg, text) {
        getPrivateVolume(function (err, volume) {
            if (err) { return sendErrorMessage(msg, err); }
            text = text || 'Volume set to ';
            msg.send(text + privateToPublicVolume(volume));
        });
    }

    function sendVolLockedMessage (msg) {
        return sendErrorMessage(msg, ':no_good: Volume is currently locked');
    }

    function increaseVolByAmountWithMessage (msg, amount) {
        if (volumeIsLocked) {
            return sendVolLockedMessage(msg);
        }
        increaseVolByAmount(amount, function (err) {
            if (err) { return sendErrorMessage(msg, err); }
            getVolumeWithMsg(msg);
        });
    }

    function setVolumeWithMessage (volume, msg, text, type) {
        var newVol;
        volume = boundPublicVolume(volume);
        newVol = publicToPrivateVolume(volume);
        if (volumeIsLocked) {
            return sendVolLockedMessage(msg);
        }
        setVolumeTo(newVol, function (err) {
            if (err) {
                return sendErrorMessage(msg);
            }
            text = text || 'Volume set to ';
            msg.send(text + volume);
        }, type);
    }

    robot.respond(/vol(?:ume)?\?/i, function (msg) {
        getVolumeWithMsg(msg, 'Volume is currently ');
    });

    robot.respond(/music status\??/i, function (message) {
        return getVolumeWithMsg(message, 'Volume is currently ');
    });

    robot.respond(/(?:set )?(bar )?vol(?:ume)?(?: to)? (.+)$/i, function (msg) {
        if (volumeIsLocked) {
            return sendErrorMessage(msg, ':no_good: Volume is currently locked');
        }

        var type = msg.match[1];
        var volume = msg.match[2];

        volumeToInt(volume, function (err, volume) {
            if (err) {
                sendErrorMessage(err);
                return;
            }
            setVolumeWithMessage(volume, msg, '', type);
        }, type);
    });

    robot.respond(/ mute$/i, function (msg) {
        getPrivateVolume(function (err, vol) {
            if (err) {
                return sendErrorMessage(msg);
            }
            savedVolume = privateToPublicVolume(parseInt(vol, 10));
            setVolumeWithMessage(0, msg);
        });
    });

    robot.respond(/ unmute$/i, function (msg) {
        if (savedVolume !== null) {
            setVolumeWithMessage(savedVolume, msg);
            savedVolume = null;
        } else {
            msg.send('Volume is not muted');
        }
    });

    robot.respond(/lock vol(?:ume)? at (.+)$/i, function (msg) {
        var volume = msg.match[1];
        volumeToInt(volume, function (err, volume) {
            if (err) {
                sendErrorMessage(err);
                return;
            }
            if (volume > 70 || volume < 40) {
                return sendErrorMessage(msg, ':no_good: You may only lock at reasonable volumes');
            }
            setVolumeWithMessage(volume, msg, 'Volume locked at ');
            lockVolume();
        });
    });

    return robot.router.get("/hubot/volume-decay", function(req, res) {
        logInfo('Decaying volume by 5');
        res.end('');
        getPrivateVolume(function (err, privateVolume) {
            if (err) {
                callback(err);
                return;
            }
            var currentVolume = privateToPublicVolume(privateVolume);
            var targetVolume = currentVolume - 5;
            logInfo('Old volume: ' + currentVolume);
            logInfo('New volume: ' + targetVolume);
            setVolumeTo (publicToPrivateVolume(targetVolume), function (res) {
                logInfo(res);
            });
        });
    });

};
