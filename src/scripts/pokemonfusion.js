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
//
// Author:
//   andromedado

var pokedex = require('./support/pokedex'),
    wildCards = [void 0, '*'];

module.exports = function(robot) {
    robot.respond(/make me a pokemon/i, function(msg) {
        var faceId = pokedex.random(),
            bodyId = pokedex.random(faceId);
        msg.send(":small_blue_diamond: I call it " + pokedex.name(faceId, bodyId, true));
        msg.send(pokedex.image(faceId, bodyId));
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
            msg.send(":small_blue_diamond: " + pokedex.name(faceId, bodyId, !reqFace || !reqBody));
            msg.send(pokedex.image(faceId, bodyId));
        }
    });
};

