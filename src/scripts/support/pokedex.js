
var _ = require('underscore'),
    pokemonData = require('./pokemonData'),
    pokemonFusionList = require('./pokemonFusionList'),
    evaluations = require('./pokedexEvaluations'),
    max = _.chain(pokemonData).keys().map(parseInt).max().value(),
    nameToIdLookup,
    evaluationIntro,
    pokedex = {};

evaluationIntro = "Good to see you! How is your POKÉDEX coming? Here, let me take a look!";

nameToIdLookup = {};
_.each(pokemonFusionList, function (data, id) {
    nameToIdLookup[data.name.toLowerCase()] = id;
});

function idToName (id) {
    if (!pokemonData.hasOwnProperty(id)) {
        return null;
    }
    return pokemonData[id].name;
}

function sizeToSrcName (size) {
    return 'tinySrc';
}

pokedex.evaluate = function (num) {
    var i;
    num = parseInt(num, 10);
    for (i in evaluations) {
        if (evaluations.hasOwnProperty(i)) {
            if (num < parseInt(i, 10)) {
                return evaluations[i];
            }
        }
    }
    return '...';
};

pokedex.random = function (nots, upperBound) {
    var id;
    upperBound = Math.min(upperBound || max, max);
    if (!nots) {
        nots = [];
    } else if (!_.isArray(nots)) {
        nots = [nots];
    }
    do {
        id = Math.ceil(Math.random() * upperBound);
    } while (nots.indexOf(id) > -1);
    return id;
};

pokedex.getId = function (str) {
    if (str.match(/^\d+$/)) {
        if (pokemonData.hasOwnProperty(str)) {
            return str;
        }
        return null;
    }
    if (nameToIdLookup.hasOwnProperty(str.toLowerCase())) {
        return nameToIdLookup[str.toLowerCase()];
    }
    return null;
};

pokedex.image = function (id, size) {
    return pokemonData[id][sizeToSrcName(size)];
};

pokedex.name = function (id) {
    return idToName(id);
};

pokedex.fusion = require('./pokedexFusionPlugin')(pokedex);

module.exports = pokedex;

