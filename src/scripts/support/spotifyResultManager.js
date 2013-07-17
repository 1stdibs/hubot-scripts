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
        return robot.brain.get(allMetaData) || [];
    }

    function setMetaData(data) {
        robot.brain.set(allMetaData, data);
    }

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
    return All.add(list, {
        type : type,
        userId : userId,
        timestamp : timestamp || now()
    });
};

Manager.getResult = All.get;

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

