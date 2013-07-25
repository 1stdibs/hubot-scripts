
var Queue = {},
    get,
    _ = require('underscore'),
    templates = require('./spotifyTemplates'),
    queueName = 'spotifyQueue',
    url,
    interval,
    intervalDuration = 20000,
    lockDuration = 10000,
    lockTimeout,
    timeout,
    tryingToPlay,
    playNext,
    robot = {};

function spotRequest(path, method, params, callback) {
    robot.http(url + path).query(params)[method]()(callback);
}

function set (queue) {
    robot.brain.set(queueName, queue);
}

function ping () {
    var q = get();
    console.log('ping!');
    if (q.length && !interval) {
        console.log('begin interval!');
        interval = setInterval(checkUp, intervalDuration);
        checkUp();
    } else if (!q.length && interval) {
        Queue.stop();
    }
}

function checkUp () {
    var q = get();
    if (!q.length) {
        Queue.stop();
        return;
    }
    console.log('seconds left?');
    spotRequest('/seconds-left', 'get', {}, function (err, res, body) {
        if (!err) {
            seconds = parseInt(String(body).replace(/[^\d\.]+/g, ''), 10) || 1;
            console.log(seconds);
            if (timeout) {
                clearTimeout(timeout);
            }
            if (!tryingToPlay) {
                timeout = setTimeout(playNext, seconds * 1000);
            }
        }
    });
}

get = Queue.get = function () {
    var q = robot.brain.get(queueName);
    return Array.prototype.slice.call(q || []);
};

Queue.locked = function () {
    return !!lockTimeout || !!tryingToPlay;
};

Queue.stop = function () {
    console.log('stopping the queue');
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
    if (timeout) {
        clearTimeout(timeout);
        timeout = null;
    }
};

Queue.start = function () {
    ping();
};

playNext = Queue.playNext = function (callback) {
    var q = get(),
        track = q.shift();
    callback = callback || function () {};
    if (!track) {
        callback('empty queue');
        return;
    }
    if (tryingToPlay) {
        callback('already trying');
        return;
    }
    tryingToPlay = true;
    spotRequest('/play-uri', 'post', {'uri' : track.href}, function (err, res, body) {
        lockTimeout = setTimeout(function () {
            lockTimeout = null;
        }, lockDuration);
        tryingToPlay = false;
        if (!err) {
            callback(void 0, track);
            Queue.removeTrack(track);
            return;
        }
        callback(err);
    });
}

Queue.describe = function (msg) {
    var queue = Queue.get();
    msg.send(templates.summarizeQueue(queue));
};

Queue.dequeue = function (index, callback) {
    var q = get();
    callback = callback || function () {};
    if (q[index]) {
        Queue.removeTrack(q[index]);
        callback(void 0, q[index].name);
        return;
    }
    callback('bad index');
};

Queue.removeTrack = function (track) {
    set(_.filter(get(), function (t) {
        return track.href != t.href;
    }));
    ping();
};

Queue.addTrack = function (track, callback) {
    var queue, index;
    callback = callback || function () {};
    if (!track.href) {
        callback('invalid track');
        return Queue;
    }
    queue = Queue.get();
    _.each(queue, function (t, i) {
        if (track.href == t.href) {
            index = +i + 1;
        }
    });
    if (index === void 0) {
        index = queue.push(track) - 1;
        set(queue);
        ping();
    }
    callback(void 0, index);
};

Queue.next = function () {
    return get().shift();
};

module.exports = function (Robot, URL) {
    robot = Robot;
    url = URL;
    ping();
    robot.on('connected', ping);
    return Queue;
};
