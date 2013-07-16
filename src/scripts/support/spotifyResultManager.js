'use strict';
/**
 *
 * Notes:
 *  Names are pretty indexes scoped to their type
 */

var Manager = {},
    Result,
    All,
    ByUser,
    robot;

function now () {
    return ~~(Date.now() / 1000);
}

function typeToKey(type) {
    return type && type + 'rmList' || 'rmList';
}

function get(type) {
    return robot.brain.get(typeToKey(type)) || [];
}

function set(list, type) {
    robot.brain.set(typeToKey(type), list);
}

function getTypeFromName (name) {
    return String(name).toLowerCase().replace(/result:(\d+)$/, '');
}

function getIndexFromName (name) {
    String(name).toLowerCase().replace(/result:(\d+)$/, '');
    return +(RegExp.$1) - 1;
}

Result = (function () {
    var Result;

    Result = function (name, userId, timestamp) {
        this.name = name;
        this.userId = userId;
        this.timestamp = timestamp;
        this.type = getTypeFromName(name);
        this.index = getIndexFromName(name);
    };

    Result.prototype.getList = function () {
        return Manager.getListByName(this.name);
    };

    Result.prototype.serialize = function () {
        return {name : this.name, userId : this.userId, timestamp : this.timestamp};
    };

    Result.inflate = function (serialized) {
        return new Result(serialized.name, serialized.userId, serialized.timestamp);
    };

    return Result;
}());

All = (function () {
    var All = {},
        allKey = '__AllResultKeys';

    function aGet () {
        return robot.brain.get(allKey) || [];
    }

    function set (all) {
        robot.brain.set(allKey, all);
    }

    All.add = function (result) {
        var all = aGet(),
            l = all.push(result.serialize());
        set(all);
        if (result.userId) {
            ByUser.add(result);
        }
        return l - 1;
    };

    All.getLast = function (type) {
        var list;
        if (type) {
            list = get(type);
            return list.slice(-1)[0];//safe pop
        }
        return Result.inflate(aGet().slice(-1)[0]).getList();//safe pop
    };

    return All;
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
        spec.push(result.serialize());
        set(spec, result.userId, result.type);
        gen.push(result.serialize());
        set(gen, result.userId);
    };

    ByUser.get = function (userId, type) {
        return Array.prototype.slice.call(get.apply(this, arguments));
    };

    return ByUser;
}());

/**
 * @param list
 * @param type
 * @param userId
 * @param {int} timestamp
 * @returns {number} Index of persisted list
 */
Manager.persist = function (list, type, userId, timestamp) {
    var typedSilo = get(type) || [],
        i = typedSilo.push(list) - 1;
    timestamp = timestamp || now();
    set(typedSilo, type);
    All.add(new Result(Manager.nameList(i, type), userId, timestamp));
    return i;
};

/**
 * @param index
 * @param type
 * @returns {*}
 */
Manager.fetch = function (index, type) {
    return get(type)[index];
};

Manager.nameList = function (index, type) {
    type = type && type + 'Result' || 'result';
    return type.slice(0, 1).toUpperCase() + type.slice(1) + ':' + (index + 1);
};

Manager.getListByName = function (name) {
    var type = String(name).toLowerCase().replace(/result:(\d+)$/, ''),
        i = +(RegExp.$1) - 1;
    return get(type)[i];
};

Manager.getLastResult = All.getLast;

Manager.getLastResultForUser = function (userId, type) {
    var list = ByUser.get.apply(ByUser, arguments);
    if (!list.length) {
        return void 0;
    }
    return Result.inflate(list.pop());
};

module.exports = function (Robot) {
    robot = Robot;
    return Manager;
};

