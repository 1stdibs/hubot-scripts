'use strict';
/**
 * ++Actual result lists should be stored separately from
 *   result meta-data; so that we can efficiently search
 *   through the meta-data without inflating the whole
 *   result lists.
 *
 *
 * Notes:
 *  Names are pretty indexes scoped to their type
 */

var Manager = {},
    All,
    ByType,
    ByUser,
    robot;

Manager.types = {
    TRACKS : 'tracks',
    ALBUMS : 'albums',
    ARTISTS : 'artists'
};

function now () {
    return ~~(Date.now() / 1000);
}

ByType = (function () {
    var ByType = {};

    function typeToKey (type) {
        return ['__TypeResults', type].join('');
    }

    function get (type) {
        return robot.brain.get(typeToKey(type)) || [];
    }

    function set (list, type) {
        return robot.brain.set(typeToKey(type), list);
    }

    ByType.add = function (result) {
        var spec = get(result.type);
        spec.push(result);
        set(spec, result.type);
    };

    ByType.get = get;

    return ByType;
}());

ByUser = (function () {
    var ByUser = {};

    function argsToKey () {
        var key = ['__UserResults', arguments[0]];
        if (arguments.length > 1) {
            key.push(arguments[1]);
        }
        return key.join('');
    }

    function get (userId, type) {
        var key = argsToKey.apply(this, arguments);
        return robot.brain.get(key) || [];
    }

    function set (list, userId, type) {
        var key = argsToKey.apply(this, Array.prototype.slice.call(arguments, 1));
        return robot.brain.set(key, list);
    }

    ByUser.add = function (result) {
        var spec = get(result.userId, result.type),
            gen = get(result.userId);
        spec.push(result);
        set(spec, result.userId, result.type);
        gen.push(result);
        set(gen, result.userId);
    };

    ByUser.get = function (userId, type) {
        return Array.prototype.slice.call(get.apply(this, arguments));
    };

    return ByUser;
}());

All = (function () {
    var All = {},
        allKey = '__AllResultKeys',
        allMetaData = '__AllMetaData';

    function get () {
        var all = robot.brain.get(allKey);
        return all && Array.prototype.slice.call(all) || [];
    }

    function set (all) {
        robot.brain.set(allKey, Array.prototype.slice.call(all));
    }

    function getMetaData() {
        var data = robot.brain.get(allMetaData);
        return data && Array.prototype.slice.call(data) || [];
    }

    function setMetaData(data) {
        robot.brain.set(allMetaData, data);
    }

    All.purge = function () {
        set([]);
        setMetaData([]);
    };

    All.add = function (list, metaData) {
        var all = get(), allMetaData = getMetaData();
        metaData.index = all.push(list) - 1;
        allMetaData.push(metaData);
        set(all);
        setMetaData(allMetaData);
        ByType.add(metaData);
        if (metaData.userId) {
            ByUser.add(metaData);
        }
        return metaData.index;
    };

    All.get = function (index) {
        return get()[index];
    };

    All.getAllMetaData = function () {
        return getMetaData();
    };

    All.getMetaData = function (index) {
        return getMetaData()[index];
    };

    return All;
}());

/**
 * @param list
 * @param type
 * @param userId
 * @param {int} timestamp
 * @returns {number} Index of persisted list
 */
Manager.persist = function (list, type, userId, timestamp) {
    var ts = timestamp || now();
    return All.add(list, {
        type : type,
        numResults : list.length,
        userId : userId,
        timestamp : ts
    });
};

Manager.purge = All.purge;

Manager.getResultMetaData = All.getMetaData;

Manager.getResult = All.get;

function getScore (metaData, type, userId, listIndex) {
    var timeScore = 0,
        minutesAgo,
        userScore = 0;
    /**
     * If any of the criteria is directly contrary, score is -1
     */
    if (type && metaData.type != type) {
        return -1;
    }
    if (listIndex !== void 0 && listIndex >= metaData.numResults) {
        return -1;
    }
    /**
     * If no criteria ruled this out,
     * balance timing against userId
     */
    minutesAgo = (now() - metaData.timestamp) / 60;
    if (minutesAgo < 2) {
        //first two minutes has time score between 9-10
        timeScore = ((2 - minutesAgo) / 2) + 9;
    } else if (minutesAgo <= 10) {
        //two to ten minutes has time score between 1-9
        timeScore = (((10 - minutesAgo) / 8) * 8) + 1;
    } else {
        //subsequently has between 0-1
        timeScore = (999 - minutesAgo) / 999;//0-1
    }
    if (userId) {
        userScore = metaData.userId == userId ? 1 : 0;
    }
    return timeScore + userScore;
}

Manager.getRelevantMetaData = function (type, userId, listIndex) {
    var metaData = All.getAllMetaData();
    if (!metaData.length) {
        return null;
    }
    metaData.sort(function (a, b) {
        var A = getScore(a, type, userId, listIndex),
            B = getScore(b, type, userId, listIndex);
        if (A == B) {
            return 0;
        }
        return A > B ? 1 : -1;
    });
    return metaData.pop();
};

Manager.getRelevantResult = function (type, userId, listIndex) {
    return All.get(Manager.getRelevantMetaData(type, userId, listIndex).index);
};

Manager.getLastResultMetaDataForUser = function (userId, type) {
    return ByUser.get.apply(ByUser, arguments).pop();
};

Manager.getLastResultForUser = function (userId, type) {
    var last = Manager.getLastResultMetaDataForUser(userId, type);
    return All.get(last && last.index);
};

module.exports = function (Robot) {
    robot = Robot;
    return Manager;
};

