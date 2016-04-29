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

var MAX_VOLS = {
    main: DEFAULT_MAX_VOL,
    bar: 60
};

var VOL_RATIOS = {
    main: MAX_PUBLIC_VOLUME / MAX_VOLS.main,
    bar: MAX_PUBLIC_VOLUME / MAX_VOLS.bar
};

var savedVolume = null;

var sonosInstance = [];

var volumeIsLocked = false;

var SONOS_HOST_MAP = {
    main: process.env.HUBOT_SONOS_HOST,
    bar : '192.168.96.159'
};

var SONOS_PORT_MAP = {
    main: process.env.HUBOT_SONOS_PORT,
    bar : process.env.HUBOT_SONOS_PORT
};

var SONOS_SPEAKERS = {
    main: 'main',
    bar: 'bar'
};

function getSonos(type) {
    var host;
    var port;

    type = type || 'main';

    if (!sonosInstance[type]) {
        host = SONOS_HOST_MAP[type];
        port = SONOS_PORT_MAP[type] || 1400;
        MAX_VOLS[type] = parseInt(MAX_VOLS[type], 10);
        sonosInstance[type] = new sonos.Sonos(host, port);
    }
    return sonosInstance[type];
}

function getPrivateVolume (callback, type) {
    logInfo('Getting sonos volume for %s speaker...', type);
    getSonos(type).getVolume(function (err, vol) {
        if (vol) {
            logInfo('Got sonos volume for %s speaker: %s ', type, vol);
        }
        callback(err, vol);
    });
}

/**
 * Give the public facing volume, and this will translate it into
 * the value to use privately
 *
 * @param vol
 * @param type
 * @returns {number}
 */
function publicToPrivateVolume (vol, type) {
    var ratio = VOL_RATIOS[type];
    logInfo('Calculating new volume for %s with input "%s" and ratio to sonos "%s"', type, vol, ratio);
    return Math.floor(vol / ratio);
}

/**
 * Give the private volume, and this will translate it into
 * the public facing integer
 *
 * @param vol
 * @param type
 * @returns {number}
 */
function privateToPublicVolume (vol, type) {
    var ratio = VOL_RATIOS[type];
    logInfo('Calculating original user input volume with input "%s" and ratio to sonos "%s"', vol, ratio);
    return Math.ceil(vol * ratio);
}

function setVolumeTo (newVolume, callback, type) {
    if (newVolume < 0) {
        logInfo('New volume less than 0, using 0 instead');
        newVolume = 0;
    } else if (newVolume > MAX_VOLS[type]) {
        logInfo('New volume greater than max, using max volume');
        newVolume = MAX_VOLS[type];
    }
    logInfo('Setting sonos volume to %s', String(newVolume));
    getSonos(type).setVolume(newVolume, callback);
}

function increaseVolByAmount (amount, callback, type) {
    logInfo('Increasing volume by %s', amount);
    getPrivateVolume(function (err, volume) {
        if (err) {
            return callback(err);
        }
        volume = parseInt(volume, 10);
        var newVol = publicToPrivateVolume(privateToPublicVolume(volume) + amount, type);
        logInfo('Calculated new sonos volume: %s', newVol);
        setVolumeTo(newVol, callback, type);
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
 * @param type
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
            var currentVolume = privateToPublicVolume(privateVolume, type);
            callback(null, boundPublicVolume((relativeVolumeKeywords[vol])(currentVolume)));
        }, type);
        return;
    }
    callback('Unable to parse volume param: ' + volume);
}

module.exports = function(robot) {

    function getVolumeWithMsg (msg, text, type) {
        type = type || 'main';
        getPrivateVolume(function (err, volume) {
            if (err) { return sendErrorMessage(msg, err); }
            text = text || 'Volume set to ';
            msg.send(text + privateToPublicVolume(volume, type));
        }, type);
    }

    function sendVolLockedMessage (msg) {
        return sendErrorMessage(msg, ':no_good: Volume is currently locked');
    }

    function increaseVolByAmountWithMessage (msg, amount, type) {
        if (volumeIsLocked) {
            return sendVolLockedMessage(msg);
        }
        increaseVolByAmount(amount, function (err) {
            if (err) { return sendErrorMessage(msg, err); }
            getVolumeWithMsg(msg);
        }, type);
    }

    function setVolumeWithMessage (volume, msg, text, type) {
        var newVol;
        volume = boundPublicVolume(volume);
        newVol = publicToPrivateVolume(volume, type);
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

    function getSpeakerType(match) {
        var type = match || 'main';
        return type.trim();
    }

    robot.respond(/(.* )?vol(?:ume)?\?/i, function (msg) {
        var type = getSpeakerType(msg.match[1]);

        if (!SONOS_SPEAKERS[type]) {
            return sendErrorMessage(msg, ':no_good: ' + type + ' is not a valid speaker');
        }

        getVolumeWithMsg(msg, 'Volume is currently ', type);
    });

    robot.respond(/music status\??/i, function (message) {
        return getVolumeWithMsg(message, 'Volume is currently ');
    });

    robot.respond(/music status\??/i, function (message) {
        return getVolumeWithMsg(message, 'Bar Volume is currently ', 'bar');
    });

    robot.respond(/(?:set )?(.* )?vol(?:ume)?(?: to)? (.+)$/i, function (msg) {
        if (volumeIsLocked) {
            return sendErrorMessage(msg, ':no_good: Volume is currently locked');
        }

        var type = getSpeakerType(msg.match[1]);
        var volume = msg.match[2];

        if (!SONOS_SPEAKERS[type]) {
            return sendErrorMessage(msg, ':no_good: ' + type + ' is not a valid speaker');
        }

        volumeToInt(volume, function (err, volume) {
            if (err) {
                sendErrorMessage(err);
                return;
            }
            setVolumeWithMessage(volume, msg, '', type);
        }, type);
    });

    robot.respond(/ mute( .*)?$/i, function (msg) {
        var type = getSpeakerType(msg.match[1]);

        if (!SONOS_SPEAKERS[type]) {
            return sendErrorMessage(msg, ':no_good: ' + type + ' is not a valid speaker');
        }

        getPrivateVolume(function (err, vol) {
            if (err) {
                return sendErrorMessage(msg);
            }
            savedVolume = privateToPublicVolume(parseInt(vol, 10), type);
            setVolumeWithMessage(0, msg, '', type);
        }, type);
    });

    robot.respond(/ unmute( .*)?$/i, function (msg) {
        var type = getSpeakerType(msg.match[1]);

        if (!SONOS_SPEAKERS[type]) {
            return sendErrorMessage(msg, ':no_good: ' + type + ' is not a valid speaker');
        }

        if (savedVolume !== null) {
            setVolumeWithMessage(savedVolume, msg, '', type);
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
        var type = SONOS_SPEAKERS.main;
        logInfo('Decaying volume by 5');
        res.end('');
        getPrivateVolume(function (err, privateVolume) {
            var currentVolume = privateToPublicVolume(privateVolume);
            var targetVolume = currentVolume - 5;
            logInfo('Old volume: ' + currentVolume);
            logInfo('New volume: ' + targetVolume);
            setVolumeTo(publicToPrivateVolume(targetVolume), function (res) {
                logInfo(res);
            }, type);
        }, type);
    });

};
