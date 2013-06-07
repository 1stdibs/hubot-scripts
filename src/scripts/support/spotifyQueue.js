
var Queue = {},
    get,
    _ = require('underscore'),
    templates = require('./spotifyTemplates'),
    queueName = 'spotifyQueue',
    url,
    interval,
    intervalDuration = 20000,
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

get = Queue.get = function () {
    var q = robot.brain.get(queueName);
    return Array.prototype.slice.call(q || []);
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
    spotRequest('/play-uri', 'post', {'uri' : track.uri}, function (err, res, body) {
        tryingToPlay = false;
        if (!err) {
            callback(void 0, track);
            Queue.removeTrack(track);
            return;
        }
        callback(err);
    });
}

function checkUp () {
    var q = get();
    if (!q.length) {
        clearInterval(interval);
        interval = null;
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

Queue.ping = function () {
    var q = get();
    console.log('ping!');
    if (q.length && !interval) {
        console.log('begin interval!');
        interval = setInterval(checkUp, intervalDuration);
        checkUp();
    } else if (!q.length && interval) {
        clearInterval(interval);
        interval = null;
    }
};

Queue.describe = function (msg) {
    var queue = Queue.get(), str = [];
    if (!queue.length) {
        msg.send(":small_blue_diamond: The queue is empty");
        return;
    }
    str.push('::QUEUE::');
    str.push.apply(str, _.map(queue, function (track, i) {
        return '#' + (+i + 1) + ' ' + templates.trackSingleLine(track);
    }));
    msg.send(str.join("\n"));
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
        return track.uri != t.uri;
    }));
    Queue.ping();
};

Queue.addTrack = function (track, callback) {
    var queue, index;
    callback = callback || function () {};
    if (!track.uri) {
        callback('invalid track');
        return Queue;
    }
    queue = Queue.get();
    _.each(queue, function (t, i) {
        if (track.uri == t.uri) {
            index = +i + 1;
        }
    });
    if (index === void 0) {
        index = queue.push(track);
        set(queue);
        Queue.ping();
    }
    callback(void 0, index);
};

Queue.next = function () {
    return get().shift();
};

module.exports = function (Robot, URL) {
    robot = Robot;
    url = URL;
    Queue.ping();
    return Queue;
};
