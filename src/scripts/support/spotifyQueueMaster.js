/*jslint node:true */
"use strict";

var _slice = Array.prototype.slice;

module.exports = function (initialQueues) {
    var
        EventEmitter = require('events').EventEmitter,
        queueMaster = new EventEmitter(),
        defaultQueue,
        notifyOthers,
        not,
        any,
        eventCallbacks,
        _queues = [];

    function initialize() {
        initialQueues = initialQueues || [];
        initialQueues.forEach(function (queue) {
            queueMaster.addQueue(queue);
        });
        return queueMaster;
    }

    notifyOthers = function (orignator, event, args) {
        args = args || [];
        args.unshift(event);
        not(orignator).forEach(function (queue) {
            queue.emit.apply(queue, args);
        });
        return queueMaster;
    };

    not = function (notQueue) {
        var queues = [];
        _queues.forEach(function (queue) {
            if (queue._queueId !== notQueue._queueId) {
                queues.push(queue);
            }
        });
        return queues;
    };

    any = function (func) {
        return _queues.some(func);
    };

    eventCallbacks = {
        stopDefault: function () {
            defaultQueue.stop();
        },
        queueFinished: function () {
            this._isPlaying = false;
            var anyStillPlaying = any(function (q) {
                return q._isPlaying;
            });
            if (!anyStillPlaying) {
                defaultQueue.playNext();
            }
        },
        queueStop: function () {
            this._isPlaying = false;
            defaultQueue.start();
        },
        addTrack: function () {
            defaultQueue.stop();
            this.start();
        }
    };

    queueMaster.at = function (index) {
        return _queues[index];
    };

    queueMaster.setDefault = function (queue) {
        if (!queue._queueId) {
            queueMaster.addQueue(queue);
        }
        defaultQueue = queue;
        queue.isDefault = true;
        not(queue).forEach(function (q) {
            q.isDefault = false;
        });
    };

    queueMaster.addQueue = function (queue) {
        var id = _queues.length;
        _queues.push(queue);
        queue._queueId = id;
        return queueMaster;
    };

    queueMaster.conduct = function () {
        if (!defaultQueue) {
            throw new Error('A Default Queue is required');
        }
        not(defaultQueue).forEach(function (q) {
            if (!q.isEmpty()) {
                q._isPlaying = true;
            }
            q.on('playNext:requested', eventCallbacks.stopDefault);
            q.on('finished', eventCallbacks.queueFinished);
            q.on('stop', eventCallbacks.queueStop);
            q.on('addTrack', eventCallbacks.addTrack);
        });
    };

    return initialize();
};