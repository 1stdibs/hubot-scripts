
var _ = require('underscore'),
    pokemonFusionList = require('./pokemonFusionList'),
    max = _.max(_.keys(pokemonFusionList)),
    nameToIdLookup,
    pokedex = {};

nameToIdLookup = {};
_.each(pokemonFusionList, function (data, id) {
    nameToIdLookup[data.name.toLowerCase()] = id;
});

function idToName (id) {
    if (!pokemonFusionList.hasOwnProperty(id)) {
        return null;
    }
    return pokemonFusionList[id].name;
}

function makeName (firstId, secondId) {
    var first = pokemonFusionList[firstId].prefix,
        second = pokemonFusionList[secondId].suffix;
    return first.slice(-2)===second.slice(0,2)?first.slice(0,first.length-2)+second:first.slice(-1)===second.slice(0,1)?first.slice(0,first.length-1)+second:first+second;
}

pokedex.random = function (not) {
    var id;
    do {
        id = Math.ceil(Math.random() * max);
    } while (id == not);
    return id;
};

pokedex.getId = function (str, randNot) {
    if (str.match(/^\d+$/)) {
        if (pokemonFusionList.hasOwnProperty(str)) {
            return str;
        }
        return null;
    }
    if (nameToIdLookup.hasOwnProperty(str.toLowerCase())) {
        return nameToIdLookup[str.toLowerCase()];
    }
    return null;
};

pokedex.image = function (faceId, bodyId) {
    //If no body, use vanilla pokemon image
    bodyId = bodyId || faceId;
    return "http://images.alexonsager.net/pokemon/fused/" + bodyId + "/" + bodyId + "." + faceId + ".png";
};

pokedex.name = function (faceId, bodyId, verbose) {
    var exp;
    if (!bodyId) {
        return idToName(faceId);
    }
    exp = makeName(faceId, bodyId);
    if (verbose) {
        exp += ' [' + idToName(faceId) + ' + ' + idToName(bodyId) + ']';
    }
    return exp;
};

module.exports = pokedex;

