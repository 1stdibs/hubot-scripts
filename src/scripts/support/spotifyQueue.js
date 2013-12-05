/*global module, setInterval, require, __dirname */
/*jslint node: true */
"use strict";

var _ = require('underscore'),
    templates = require('./spotifyTemplates'),
    metaData = require('./spotifyMetaData'),
    instances = 0,
    isSpotTrackUriRe = /^spotify:track:[A-Z0-9a-z]{22}$/,
    EE = require('events').EventEmitter;

module.exports = function (Robot, URL, queueName, forever) {

    instances++;

    queueName = queueName || 'spotifyQueue' + instances;

    var
        metDat,
        Queue = new EE(),
        get,
        getTrackHref,
        url,
        interval,
        intervalDuration = 20000,
        lockDuration = 10000,
        lockTimeout,
        timeout,
        tryingToPlay,
        playNext,
        isSpotTrackUri,
        robot = {};

    function spotRequest(path, method, params, callback) {
        robot.http(url + path).query(params)[method]()(callback);
    }

    function set(queue) {
        robot.brain.set(queueName, queue);
    }

    function checkUp() {
        var q = get(), seconds;
        if (!q.length) {
            Queue.stop();
            return;
        }
        //console.log('seconds left?');
        /*jslint unparam: true */
        spotRequest('/seconds-left', 'get', {}, function (err, res, body) {
            if (!err) {
                seconds = parseInt(String(body).replace(/[^\d\.]+/g, ''), 10) || 1;
                //console.log(seconds);
                if (timeout) {
                    clearTimeout(timeout);
                }
                //console.log('trying to play??', tryingToPlay);
                if (!tryingToPlay) {
                    //console.log('***SETTING TIME OUT', queueName);
                    timeout = setTimeout(playNext, seconds * 1000);
                    Queue.emit('playNext:beginTimeout', timeout);
                }
            }
        });
        /*jslint unparam: false */
    }

    function ping() {
        var q = get();
        //console.log('ping!');
        if (q.length && !interval) {
            //console.log('begin interval!', queueName);
            interval = setInterval(checkUp, intervalDuration);
            checkUp();
        } else if (!q.length && interval) {
            Queue.stop();
        }
    }

    get = Queue.get = function () {
        var q = robot.brain.get(queueName);
        return Array.prototype.slice.call(q || []);
    };

    getTrackHref = function (track) {
        return (_.isString(track)) ? track : track.href;
    };

    isSpotTrackUri = function (t) {
        return _.isString(t) && isSpotTrackUriRe.test(t);
    };

    Queue.locked = function () {
        return !!lockTimeout || !!tryingToPlay;
    };

    Queue.stop = function () {
        //console.log('stopping the queue');
        if (interval) {
            clearInterval(interval);
            interval = null;
            Queue.emit('stop:interval');
        }
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
            Queue.emit('stop:timeout');
        }
        Queue.emit('stop');
    };

    Queue.start = function () {
        ping();
        Queue.emit('start');
    };

    playNext = function (callback) {
        var q = get(),
            track = q.shift();
        callback = callback || function () {};
        if (!track) {
            Queue.emit('finished');
            callback('empty queue');
            return;
        }
        if (tryingToPlay) {
            callback('already trying');
            return;
        }
        tryingToPlay = true;

        /*jslint unparam: true */
        spotRequest('/play-uri', 'post', {'uri' : getTrackHref(track) }, function (err, res, body) {
            lockTimeout = setTimeout(function () {
                lockTimeout = null;
            }, lockDuration);
            tryingToPlay = false;
            if (!err) {
                Queue.emit('playNext:done', track);
                callback(undefined, track);
                if (!forever) {
                    Queue.removeTrack(track);
                } else {
                    q.push(track);
                    set(q);
                }
                return;
            }
            callback(err);
        });
        /*jsline unparam: false */
        Queue.emit('playNext:requested');
    };

    Queue.describe = function (msg) {
        var queue = Queue.get();

        if (queue.length > 50) {
            queue = queue.slice(0, 50);
        }

        Queue.resolveTracks(queue, function () {
            msg.send(templates.summarizeQueue(queue));
        });
    };

    /**
     * Resolves the tracks from the spotify meta data
     * api in a queue (array) that haven't already been
     * resolved yet (ie they are just uri strings)
     * @param  {object|string|mixed[]} queue
     * @param  {Function} callback
     * @return {undefined}
     */
    Queue.resolveTracks = function (queue, callback) {
        if (!_.isArray(queue)) {
            queue = [queue];
        }

        var unResolvedTracks = 0;
        unResolvedTracks = queue.length - 1;

        queue.forEach(function (track, index) {
            if (_.isString(track)) {
                setTimeout(function () {
                    metDat.fetchTrack(track, function (err, t) {
                        if (err) { callback(err, t); }
                        unResolvedTracks--;
                        queue[index] = t;
                        if (!unResolvedTracks) {
                            callback(undefined, queue);
                        }
                    });
                }, index * 300);
            } else {
                unResolvedTracks--;
                if (!unResolvedTracks) {
                    callback(undefined, queue);
                }
            }
        });
    };

    Queue.dequeue = function (index, callback) {
        var q = get();
        callback = callback || function () {};

        if (q[index]) {
            Queue.removeTrack(q[index]);
            Queue.emit('dequeue', q[index]);
            Queue.resolveTracks(q[index], function (err, qu) {
                if (err) { throw err; }
                callback(undefined, qu[0].name);
            });
            return;
        }
        callback('bad index');
    };

    Queue.removeTrack = function (track) {
        set(_.filter(get(), function (t) {
            return getTrackHref(track) !== getTrackHref(t);
        }));
        ping();
    };

    Queue.addTrack = function (track, callback) {
        //console.log('> adding track:', track);
        var queue, index;
        callback = callback || function () {};
        if (!track.href && !isSpotTrackUri(track)) {
            //console.log('invalid track');
            callback('invalid track');
            return Queue;
        }
        queue = Queue.get();
        _.each(queue, function (t, i) {
            if (getTrackHref(track) === getTrackHref(t)) {
                index = +i + 1;
            }
        });
        if (index === undefined) {
            index = queue.push(track) - 1;
            set(queue);
            ping();
        }
        Queue.emit('addTrack', track, index);
        callback(undefined, index);
    };

    Queue.next = function () {
        return get().shift();
    };

    Queue.set = function (q) {
        set(q);
    };

    Queue.playNext = function () {
        playNext();
        if (!Queue.isEmpty()) {
            Queue.emit('playNext:userInitiated');
        }
    };

    Queue.isEmpty = function () {
        return !!get().length;
    };

    Queue.getName = function () {
        return queueName;
    };

    robot = Robot;
    metDat = metaData(robot);
    url = URL;
    ping();
    robot.on('connected', ping);

    return Queue;
};
