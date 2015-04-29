//
// Description:
//   Control Spot from campfire. https://github.com/1stdibs/Spot
//
// Dependencies:
//   underscore
//
// Configuration:
//   HUBOT_SPOT_URL
//
// Commands:
//   hubot music status? - Lets you know what's up
//   hubot play! - Plays current playlist or song.
//   hubot pause - Pause the music.
//   hubot play next - Plays the next song.
//   hubot play back - Plays the previous song.
//   hubot playing? - Returns the currently-played song.
//   hubot volume? - Returns the current volume level.
//   hubot volume [0-100] - Sets the volume.
//   hubot volume + - Bumps the volume.
//   hubot volume - - Bumps the volume down.
//   hubot mute - Sets the volume to 0.
//   hubot [name here] says turn it down - Sets the volume to 15 and blames [name here].
//   hubot say <message> - Tells hubot to read a message aloud.
//   hubot play <song> - Play a particular song. This plays the first most popular result.
//   hubot find x artist <artist-query> - Searches for x (or 6) most popular artist matching query
//   hubot find x music <track-query> - Searches for x (or 6) most popular tracks matching query
//   hubot find x music by <artist-query> - Searches for x (or 6) most popular tracks by artist-query
//   hubot find x albums <album-query> - Searches for x (or 6) most popular albums matching query
//   hubot find x albums by <artist-query> - Searches for x (or 6) most popular albums by artist-query
//   hubot show me album <album-query> - Pulls up the album for the given search, or if (x:y) format, the album associated with given result
//   hubot show me this album - Pulls up the album for the currently playing track
//   hubot show me music by this artist - Pulls up tracks by the current artist
//   hubot play n - Play the nth track from the last search results
//   hubot play x:y - Play the y-th track from x-th result set
//   hubot how much longer? - Hubot tells you how much is left on the current track
//   hubot queue? - Pulls up the current queue
//   hubot queue (track name | track result #) - Adds the given track to the queue
//   hubot dequeue #(queue number) - removes the given queue line item (by current position in the queue)
// Authors:
//   andromedado, jballant
//
/*jslint node: true */
"use strict";

var CAMPFIRE_CHRONOLOGICAL_DELAY,
    DEFAULT_LIMIT,
    Queue,
    URL,
    VERSION,
    comparePart,
    compareVersions,
    determineLimit,
    getCurrentVersion,
    getStrHandler,
    https,
    now,
    playingRespond,
    remainingRespond,
    sayMyError,
    sayYourError,
    setVolume,
    spotNext,
    spotRequest,
    templates,
    trim,
    volumeLockDuration,
    volumeLocked,
    volumeRespond,
    words,
    _;

var showAlbumArt;

var logger = require('./support/logger');
var emoji = require('./support/emoji');
var versioning = require('./support/spotVersion');
var util = require('util');

https = require('https');

_ = require('underscore');

VERSION = versioning.version;

URL = "" + process.env.HUBOT_SPOT_URL;

CAMPFIRE_CHRONOLOGICAL_DELAY = 700;

DEFAULT_LIMIT = 6;

Queue = {};

templates = require('./support/spotifyTemplates');

function randEl (arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getVersionString () {
    return util.format(':sparkles::%s::sparkles:Dibsy-Spot-Integration v%s:sparkles::%s::sparkles:', randEl(emoji.things), versioning.version, randEl(emoji.things));
}

//getCurrentVersion = function (callback) {
//    return https.get('https://raw.github.com/1stdibs/hubot-scripts/master/src/scripts/spot.js', function (res) {
//        var data;
//        data = '';
//        res.on('data', function (d) {
//            return data += d;
//        });
//        return res.on('end', function () {
//            var bits, version;
//            bits = data.match(/VERSION = '([\d\.]+)'/);
//            version = bits && bits[1];
//            return callback(!version, version);
//        });
//    }).on('error', function (e) {
//        return callback(e);
//    });
//};

compareVersions = function (base, comparator) {
    var bParts, cParts, diff, re;
    if (base === comparator) {
        return 'up-to-date';
    }
    re = /^(\d+)(\.(\d+))?(\.(\d+))?/;
    bParts = base.match(re);
    cParts = comparator.match(re);
    diff = false;
    if (bParts && cParts) {
        [
            {
                k: 1,
                n: 'major version'
            }, {
                k: 3,
                n: 'minor version'
            }, {
                k: 5,
                n: 'patch',
                pn: 'patches'
            }
        ].forEach(function (obj) {
            return diff = diff || comparePart(bParts[obj.k], cParts[obj.k], obj.n, obj.pn);
        });
    }
    if (!diff) {
        diff = 'different than the repo version: ' + base;
    }
    return diff;
};

comparePart = function (b, c, partName, partNamePlural) {
    var diff, stem, suffix, whats;
    if (b === c) {
        return false;
    }
    diff = Math.abs(Number(c) - Number(b));
    if (Number(c) > Number(b)) {
        stem = 'ahead';
        suffix = '; the repo should probably be updated.';
    } else {
        stem = 'behind';
        suffix = '; you should probably update me. https://github.com/1stdibs/hubot-scripts';
    }
    if (diff === 1) {
        whats = partName;
    } else {
        whats = partNamePlural || (partName + 's');
    }
    return stem + ' by ' + diff + ' ' + whats + suffix;
};

spotRequest = require('./support/spotRequest');

now = function () {
    return ~~(Date.now() / 1000);
};

trim = function (str) {
    return String(str).replace(/^\s+/, '').replace(/\s+$/, '');
};

volumeLockDuration = 60000;

words = {
    'a couple': 2,
    'default': 3,
    'a few': 4,
    'many': 6,
    'a lot': 10,
    'lots of': 10
};

determineLimit = function (word) {
    if (String(word).match(/^\d+$/)) {
        return word;
    }
    if (!word || !words.hasOwnProperty(word)) {
        word = 'default';
    }
    return words[word];
};

spotNext = function (msg) {
    return spotRequest(msg, '/next', 'put', {}, function (err, res, body) {
        if (err) {
            return sayMyError(err, msg);
        }
        return msg.send(":small_blue_diamond: " + body + " :fast_forward:");
    });
};

volumeRespond = function (message) {
    return spotRequest(message, '/volume', 'get', {}, function (err, res, body) {
        if (err) {
            return sayMyError(err, message);
        }
        return message.send("Spot volume is " + body + ". :mega:");
    });
};

remainingRespond = function (message) {
    return spotRequest(message, '/how-much-longer', 'get', {}, function (err, res, body) {
        if (err) {
            return sayMyError(err, message);
        }
        return message.send(":small_blue_diamond: " + body);
    });
};

playingRespond = function (message) {
    return spotRequest(message, '/playing', 'get', {}, function (err, res, body) {
        var next;
        if (err) {
            return sayMyError(err, message);
        }
        showAlbumArt(message);
        message.send(":notes:  " + body);
        next = Queue.next();
        if (next) {
            return message.send(":small_blue_diamond: Up next is \"" + next.name + "\"");
        }
    });
};

getStrHandler = function (message) {
    return function (err, str) {
        if (err) {
            return sayMyError(err, message);
        } else {
            return message.send(str);
        }
    };
};

sayMyError = function (err, message) {
    return message.send(":flushed: " + err);
};

sayYourError = function (message) {
    return message.send(":no_good: Syntax Error [" + Math.floor(Math.random() * Math.pow(10, 4)) + "]");
};

volumeLocked = false;

setVolume = function (level, message) {
    var params;
    level = level + "";
    if (volumeLocked) {
        message.send(':no_good: Volume is currently locked');
        return;
    }
    if (level.match(/^\++$/)) {
        spotRequest(message, '/bumpup', 'put', {}, function (err, res, body) {
            if (err) {
                return sayMyError(err, message);
            }
            return message.send("Spot volume bumped to " + body + ". :mega:");
        });
        return;
    }
    if (level.match(/^-+$/)) {
        spotRequest(message, '/bumpdown', 'put', {}, function (err, res, body) {
            if (err) {
                return sayMyError(err, message);
            }
            return message.send("Spot volume bumped down to " + body + ". :mega:");
        });
        return;
    }
    if (!level.match(/^\d+$/)) {
        message.send("Invalid volume: " + level);
        return;
    }
    params = {
        volume: level
    };
    return spotRequest(message, '/volume', 'put', params, function (err, res, body) {
        if (err) {
            return sayMyError(err, message);
        }
        return message.send("Spot volume set to " + body + ". :mega:");
    });
};

function setupDefaultQueue(queue, reload, callback) {
    var fs = require('fs');

    if (!queue.isEmpty() || reload) {
        if (!reload) {
            logger.minorInfo('found no redis stuff for %s', queue.getName());
        } else {
            logger.minorInfo('reloading playlist for %s', queue.getName());
        }
        logger.minorInfo('reading file %s', process.env.HUBOT_SPOTIFY_PLAYLIST_FILE);
        fs.readFile(process.env.HUBOT_SPOTIFY_PLAYLIST_FILE, 'utf-8', function (err, data) {
            if (err) { throw err; }
            var json = JSON.parse(data),
                len = json.length,
                i = -1,
                list;

            //list = json;
            list = _.shuffle(json);
            queue.clear(); // Empty the existing playlist, new songs wont be added otherwise
            queue.addTracks(list); // Add the shuffled list to the empty playlist
            queue.playNext(); // Start playling
            queue.start();
            if (callback) {
                callback(queue);
            }
        });
    }
}

module.exports = function (robot) {
    var Assoc,
        Support,
        playlistQueue = require('./support/spotifyQueue')(robot, URL, 'playlistQueue', true),
        queueMaster = require('./support/spotifyQueueMaster')();
    var say = require('./support/say');

    say.attachToRobot(robot);

    Queue = require('./support/spotifyQueue')(robot, URL);
    Support = require('./support/spotifySupport')(robot, URL, Queue);
    Assoc = require('./support/spotifyAssoc')(robot);

    //if (process.env.HUBOT_SPOTIFY_PLAYLIST_FILE) {
    //    // Set up default queue
    //    setupDefaultQueue(playlistQueue);
    //
    //    // Set the default queue on the queue master
    //    queueMaster.setDefault(playlistQueue);
    //
    //    // Add the user queue
    //    queueMaster.addQueue(Queue);
    //
    //    // Conduct the queues (the default queue will
    //    // play if user queue is empty)
    //   queueMaster.conduct();
    //}

    Queue.start();

    showAlbumArt = function showAlbumArt(message) {
        //No Longer Works =(
        //message.send("" + URL + "/now/playing/" + Math.ceil(Math.random() * 10000000000) + '/album.png');
        return Support.getCurrentTrackURL(function (err, url) {
            if (err) {
                sayMyError(err, message);
            } else {
                message.send(url);
            }
        });
    };


    function blame (message) {
        return Support.translateToTrack('this', message.message.user.id, function (err, track) {
            var user;
            if (err) {
                sayMyError(err, message);
                return;
            }
            user = Assoc.get(track.href);
            if (user) {
                return message.send(':small_blue_diamond: ' + user + ' requested ' + templates.trackLine(track));
            }
            return message.send(':small_blue_diamond: Spotify Playlist');
        });
    }


    robot.respond(/show (me )?this album/i, function (message) {
        return Support.getCurrentAlbum(function (err, album, resultIndex) {
            var str;
            if (!err) {
                str = templates.albumSummary(album, resultIndex);
            }
            return getStrHandler(message)(err, str);
        });
    });
    robot.respond(/((find|show) )?(me )?((\d+) )?album(s)? (.+)/i, function (message) {
        if (message.match[6]) {
            return Support.findAlbums(message.match[7], message.message.user.id, message.match[5] || DEFAULT_LIMIT, getStrHandler(message));
        }
        if (!message.match[7] || trim(message.match[7]) !== 'art') {
            return Support.translateToAlbum(trim(message.match[7]), message.message.user.id, function (err, album, resultIndex) {
                var str;
                if (!err) {
                  str = templates.albumSummary(album, resultIndex);
                }
                return getStrHandler(message)(err, str);
            });
        }
    });
    robot.respond(/find ((\d+) )?artists (.+)/i, function (message) {
        return Support.findArtists(message.match[3], message.message.user.id, message.match[2] || DEFAULT_LIMIT, getStrHandler(message));
    });
    robot.respond(/(show|find) (me )?((\d+) )?(music|tracks|songs) (.+)/i, function (message) {
        return Support.findTracks(message.match[6], message.message.user.id, message.match[4] || DEFAULT_LIMIT, getStrHandler(message));
    });
    robot.respond(/purge results!/i, function (message) {
        Support.purgeLists();
        return message.send(':ok_hand:');
    });
    robot.respond(/purge music cache!/i, function (message) {
        Support.purgeMusicDataCache();
        return message.send(':ok_hand:');
    });

    robot.respond(/blame\s*$/i, blame);
    robot.respond(/who asked for (.+)\??/i, blame);

    robot.respond(/(play|queue) (.+)/i, function (message) {
        return Support.translateToTrack(trim(message.match[2]), message.message.user.id, function (err, track) {
            if (err) {
                sayMyError(err, message);
                return;
            }
            Assoc.set(track.href, message.message.user.name);
            if (message.match[1].toLowerCase() === 'play' && !Queue.locked()) {
                Queue.stop();
                message.send(':small_blue_diamond: Switching to ' + templates.trackLine(track, true));
                Support.playTrack(track, function (err) {
                    Queue.start();
                    if (err) {
                        return sayMyError(err, message);
                    }
                });
                return;
            }
            return Queue.addTrack(track, function (err, index) {
                if (err) {
                    sayMyError(err, message);
                    return;
                }
                return message.send(":small_blue_diamond: #" + index + " in the queue is " + templates.trackLine(track));
            });
        });
    });

    robot.respond(/music status\??/i, function (message) {
        spotRequest(message, '/seconds-left', 'get', {}, function (err, res, body) {
            if (err) {
                return sayMyError(err, message);
            }
            var seconds;
            seconds = parseInt(String(body).replace(/[^\d\.]+/g, ''), 10) || 1;
            return setTimeout(function () {
                return spotRequest(message, '/seconds-left', 'get', {}, function (err, res, body) {
                    if (err) {
                        return sayMyError(err, message);
                    }
                    var seconds2;
                    seconds2 = parseInt(String(body).replace(/[^\d\.]+/g, ''), 10) || 1;
                    if (seconds === seconds2) {
                        return message.send(":small_blue_diamond: The music appears to be paused");
                    }
                    return remainingRespond(message);
                });
            }, 2000);
        });
        blame(message);
        playingRespond(message);
        volumeRespond(message);
        return Queue.describe(message);
    });
    robot.respond(/(show (me )?the )?queue\??\s*$/i, function (message) {
        return Queue.describe(message);
    });
    robot.respond(/dequeue #?(\d+)/i, function (message) {
        return Queue.dequeue(+message.match[1], function (err, name) {
            if (err) {
                message.send(":flushed: " + err);
                return;
            }
            return message.send(":small_blue_diamond: \"" + name + "\" removed from the queue");
        });
    });
    robot.respond(/play!/i, function (message) {
        message.finish();
        return spotRequest(message, '/play', 'put', {}, function (err, res, body) {
            if (err) {
                return sayMyError(err, message);
            }
            return message.send(":notes:  " + body);
        });
    });
    robot.respond(/pause/i, function (message) {
        var params;
        params = {
            volume: 0
        };
        return spotRequest(message, '/pause', 'put', params, function (err, res, body) {
            if (err) {
                return sayMyError(err, message);
            }
            return message.send("" + body + " :cry:");
        });
    });
    robot.respond(/next/i, function (message) {
        if (Queue.locked()) {
            message.send(":raised_hand: Not yet, this was queued");
            return;
        }
        var q = (Queue.isEmpty()) ? playlistQueue : Queue;
        if (q.next()) {
            return q.playNext(function (err, track) {
                if (err) {
                  spotNext(message);
                  return;
                }
                return q.send(":small_blue_diamond: Ok, on to " + track.name);
            });
        } else {
            return spotNext(message);
        }
    });
    robot.respond(/back/i, function (message) {
        return spotRequest(message, '/back', 'put', {}, function (err, res, body) {
            if (err) {
                return sayMyError(err, message);
            }
            return message.send("" + body + " :rewind:");
        });
    });

    robot.respond(/playing\?/i, function (message) {
        playingRespond(message);
        return blame(message);
    });

    robot.respond(/album art\??/i, function (message) {
        return spotRequest(message, '/playing', 'get', {}, function (err, res, body) {
            if (err) {
                sayMyError(err, message);
            }
            return showAlbumArt(message);
        });
    });
    robot.respond(/lock volume at (\d+)/i, function (message) {
        var volume;
        if (volumeLocked) {
            message.send(':no_good: Volume is currently locked');
            return;
        }
        volume = parseInt(message.match[1]) || 0;
        setVolume(volume, message);
        if (volume < 45) {
            message.send(':no_good: I won\'t lock the volume that low');
            return;
        }
        if (volume > 65) {
            message.send(':no_good: I won\'t lock the volume that high');
            return;
        }
        volumeLocked = true;
        return setTimeout(function () {
            return volumeLocked = false;
        }, volumeLockDuration);
    });
    robot.respond(/mute/i, function (message) {
        return setVolume(0, message);
    });
    robot.respond(/volume(.*)/i, function (message) {
        var adi;
        adi = trim(message.match[1]);
        if (!adi || adi === '?') {
            volumeRespond(message);
            return;
        }
        return setVolume(adi, message);
    });
    robot.respond(/(how much )?(time )?(remaining|left)\??$/i, remainingRespond);
    robot.respond(/say me/i, function (message) {
        return message.send('no way ' + message.message.user.name);
    });
    robot.respond(/(.*) says.*turn.*down.*/i, function (message) {
        var name, params;
        name = message.match[1];
        message.send("" + name + " says, 'Turn down the music and get off my lawn!' :bowtie:");
        params = {
            volume: 15
        };
        return spotRequest(message, '/volume', 'put', params, function (err, res, body) {
            if (err) {
                return sayMyError(err, message);
            }
            return message.send("Spot volume set to " + body + ". :mega:");
        });
    });
    robot.respond(/reload default playlist/i, function (message) {
        setupDefaultQueue(playlistQueue, true, function () {
            message.send("Reloaded default playlist");
        });
    });
    //TODO: Make a responder to add to defaultQueue

    robot.messageRoom('#general', getVersionString());

    return robot.respond(/spot version\??/i, function (message) {
        return message.send(getVersionString());
//        return getCurrentVersion(function (e, repoVersion) {
//            var msg;
//            msg = getVersionString();
//            if (!e) {
//                msg += '; I am ' + compareVersions(repoVersion, VERSION);
//            }
//            return message.send(msg);
//        });
    });
};


