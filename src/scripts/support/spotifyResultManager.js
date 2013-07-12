'use strict';
/**
 *
 * Notes:
 *  Names are pretty indexes scoped to their type
 */

var Manager = {},
    Result,
    All,
    robot;

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
    return String(name).toLowerCase().replace(/result#(\d+)$/, '');
}

function getIndexFromName (name) {
    String(name).toLowerCase().replace(/result#(\d+)$/, '');
    return +(RegExp.$1) - 1;
}

Result = (function () {
    var Result;

    Result = function (name, userId) {
        this.name = name;
        this.userId = userId;
        this.type = getTypeFromName(name);
        this.index = getIndexFromName(name);
    };

    Result.prototype.getList = function () {
        return Manager.getListByName(this.name);
    };

    Result.prototype.serialize = function () {
        return {name : this.name, userId : this.userId};
    };

    Result.inflate = function (serialized) {
        return new Result(serialized.name, serialized.userId);
    };

    return Result;
});

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

/**
 * @param list
 * @param type
 * @param userId
 * @returns {number} Index of persisted list
 */
Manager.persist = function (list, type, userId) {
    var silo = get(type) || [],
        i = silo.push(list) - 1;
    set(silo, type);
    All.add(new Result(Manager.nameList(i, type), userId));
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
    return type.slice(0, 1).toUpperCase() + type.slice(1) + '#' + (index + 1);
};

Manager.getListByName = function (name) {
    var type = String(name).toLowerCase().replace(/result#(\d+)$/, ''),
        i = +(RegExp.$1) - 1;
    return get(type)[i];
};

Manager.getLastResult = All.getLast;

module.exports = function (Robot) {
    robot = Robot;
    return Manager;
};

