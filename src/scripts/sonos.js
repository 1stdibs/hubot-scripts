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

var maxVol = DEFAULT_MAX_VOL;

var savedVolume = null;

var sonosInstance;

var volumeIsLocked = false;

function getSonos() {

    var host;
    var port;
    if (!sonosInstance) {
        host = process.env.HUBOT_SONOS_HOST || '192.168.96.150';
        port = process.env.HUBOT_SONOS_PORT || 1400;
        maxVol = process.env.HUBOT_SONOS_MAX_VOLUME || DEFAULT_MAX_VOL;
        maxVol = parseInt(maxVol, 10);
        sonosInstance = new sonos.Sonos(host, 1400);
    }
    return sonosInstance;
}

function getVolume (callback) {
    logInfo('Getting sonos volume...');
    getSonos().getVolume(function (err, vol) {
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
    var ratio = 100 / maxVol;
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
    var ratio = 100 / maxVol;
    logInfo('Calculating original user input volume with input "%s" and ratio to sonos "%s"', vol, ratio);
    return Math.ceil(vol * ratio);
}

function setVolumeTo (newVolume, callback) {
    if (newVolume < 0) {
        logInfo('New volume less than 0, using 0 instead');
        newVolume = 0;
    } else if (newVolume > maxVol) {
        logInfo('New volume greater than max, using max volume');
        newVolume = maxVol;
    }
    logInfo('Setting sonos volume to %s', String(newVolume));
    getSonos().setVolume(newVolume, callback);
}

function increaseVolByAmount (amount, callback) {
    logInfo('Increasing volume by %s', amount);
    getVolume(function (err, volume) {
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

/**
 * This will be able to handle things like emoji/keywords
 *
 * @param volume
 * @param callback
 */
function volumeToInt(volume, callback) {
    volume = (volume || volume === 0) ? parseInt(volume, 10) : null;
    if (volume === null || isNaN(volume)) {
        callback('Unable to parse volume param');
    }
    callback(null, volume < 0 ? 0 : (volume > 100) ? 100 : volume);
}

module.exports = function(robot) {

    function checkInputVolume (volume, msg) {
        volume = (volume || volume === 0) ? parseInt(volume, 10) : null;
        if (volume === null || isNaN(volume)) {
            sendErrorMessage(msg, 'Unable to parse volume param');
        }
        return volume < 0 ? 0 : (volume > 100) ? 100 : volume;
    }

    function getVolumeWithMsg (msg, text) {
        getVolume(function (err, volume) {
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

    function setVolumeWithMessage (volume, msg, text) {
        var newVol;
        volume = checkInputVolume(volume, msg);
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
        });
    }

    robot.respond(/vol(?:ume)? ?\+$/i, function(msg) {
        increaseVolByAmountWithMessage(msg, 7);
    });

    robot.respond(/vol(?:ume)? ?\-$/i, function(msg) {
        increaseVolByAmountWithMessage(msg, -7);
    });

    robot.respond(/vol(?:ume)? ?\+\+$/i, function(msg) {
        increaseVolByAmountWithMessage(msg, 14);
    });

    robot.respond(/vol(?:ume)? ?\-\-$/i, function(msg) {
        increaseVolByAmountWithMessage(msg, -14);
    });

    robot.respond(/vol(?:ume)?\?/i, function (msg) {
        getVolumeWithMsg(msg, 'Volume is currently ');
    });

    robot.respond(/(?:set )?vol(?:ume)?(?: to)? (\d+)$/i, function (msg) {
        if (volumeIsLocked) {
            return sendErrorMessage(msg, ':no_good: Volume is currently locked');
        }

        var volume = msg.match[1];
        setVolumeWithMessage(volume, msg);
    });

    robot.respond(/ mute$/i, function (msg) {
        getVolume(function (err, vol) {
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

    robot.respond(/lock vol(?:ume)? at (\d+)$/i, function (msg) {
        var volume = msg.match[1];
        volume = checkInputVolume(volume);
        if (volume > 70 || volume < 40) {
            return sendErrorMessage(msg, ':no_good: You may only lock at reasonable volumes');
        }
        setVolumeWithMessage(volume, msg, 'Volume locked at ');
        lockVolume();
    });
};
