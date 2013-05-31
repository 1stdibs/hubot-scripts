
var fusion = {},
    _ = require('underscore'),
    pokemonFusionList = require('./pokemonFusionList'),
    max = _.chain(pokemonFusionList).keys().map(function (num) {return parseInt(num, 10);}).max().value();

function makeName (firstId, secondId) {
    var first = pokemonFusionList[firstId].prefix,
        second = pokemonFusionList[secondId].suffix;
    return first.slice(-2)===second.slice(0,2)?first.slice(0,first.length-2)+second:first.slice(-1)===second.slice(0,1)?first.slice(0,first.length-1)+second:first+second;
}

fusion.getMax = function () {
    return max;
};

fusion.fusable = function (id) {
    return pokemonFusionList.hasOwnProperty(id);
};

fusion.image = function (faceId, bodyId) {
    //If no body, use vanilla pokemon image
    if (!bodyId || faceId === bodyId) {
        return 'http://images.alexonsager.net/pokemon/' + faceId + '.png';
    }
    return "http://images.alexonsager.net/pokemon/fused/" + bodyId + "/" + bodyId + "." + faceId + ".png";
};

module.exports = function (pokedex) {

    fusion.random = function (nots) {
        return pokedex.random(nots, max);
    };

    fusion.name = function (faceId, bodyId, verbose) {
        var exp;
        if (!bodyId) {
            return pokedex.name(faceId);
        }
        exp = makeName(faceId, bodyId);
        if (verbose) {
            exp += ' [' + pokedex.name(faceId) + ' + ' + pokedex.name(bodyId) + ']';
        }
        return exp;
    };

    return fusion;
};

