// Description:
//   Hubot api for http://pokemon.alexonsager.net/
//
// Dependencies:
//   underscore
//
// Configuration:
//   none
//
// Commands:
//   hubot make me a pokemon
//   hubot fusion me[ (name|id|*)[ (+|and|&&?) (name|id|*)]]
//   hubot lickitung me
//   hubot lickitung bomb[ X]
//
// Author:
//   andromedado

var pokedex = require('./support/pokedex'),
    lickId = pokedex.getId('lickitung'),
    wildCards = [void 0, '*'],
    showPokemon;

showPokemon = function (msg, faceId, bodyId, verbose) {
    if (verbose !== false) {
        msg.send(":small_blue_diamond: " + pokedex.name(faceId, bodyId, verbose));
    }
    msg.send(pokedex.image(faceId, bodyId));
};

module.exports = function(robot) {
    robot.respond(/make me a pokemon/i, function(msg) {
        var faceId = pokedex.random(),
            bodyId = pokedex.random(faceId);
        showPokemon(msg, faceId, bodyId, true);
    });
    robot.respond(/fusion me( ([\S]+)( (\+|and|&&?) ([\S]+))?)?/i, function(msg) {
        var faceId, bodyId,
            reqFace = msg.match[2],
            reqBody = msg.match[5];
        if (reqFace && !reqBody && Math.random() >= 0.5) {
            //If only one pokemon was requested,
            //randomize whether it'll be face or body
            reqBody = reqFace;
            reqFace = void 0;
            bodyId = pokedex.getId(reqBody);
            faceId = pokedex.random(bodyId);
        } else {
            faceId = wildCards.indexOf(reqFace) > -1 ? pokedex.random() : pokedex.getId(reqFace);
            bodyId = wildCards.indexOf(reqBody) > -1 ? pokedex.random(faceId) : pokedex.getId(reqBody);
        }
        if (!faceId || !bodyId) {
            msg.send(":small_blue_diamond: What's a \"" + (faceId ? reqBody : reqFace) + "\"?");
        } else {
            showPokemon(msg, faceId, bodyId, wildCards.indexOf(reqFace) > -1 || wildCards.indexOf(reqBody) > -1 || void 0);
        }
    });
    robot.respond(/lickitung me/i, function (msg) {
        showPokemon(msg, lickId, pokedex.random(lickId), true);
    });
    robot.respond(/lickitung bomb( (\d+))?/i, function (msg) {
        var num = Math.min(msg.match[2] || 3, 40);
        while (num--) {
            showPokemon(msg, lickId, pokedex.random(lickId), false);
        }
    });
};

