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
//   hubot fusion me[ (name|id|*)[ (+|&&?) (name|id|*)]]
//   hubot fusion pokedex
//   hubot lickitung me
//   hubot (pokemonName|id) bomb[ X]
//
// Author:
//   andromedado

var pokedex = require('./support/pokedex'),
    stutter = 700,
    lickId = pokedex.getId('lickitung'),
    wildCards = [void 0, '*'];

function longId (id) {
    id = String(id);
    while (id.length < 3) {
        id = '0' + id;
    }
    return id;
}

function showOnsagerPokemon (msg, faceId, bodyId, verbose) {
    if (verbose !== false) {
        msg.send(":small_blue_diamond: " + pokedex.fusion.name(faceId, bodyId, verbose));
    }
    msg.send(pokedex.fusion.image(faceId, bodyId));
}

function showPokemon (msg, id, verbose) {
    if (verbose) {
        msg.send(":small_blue_diamond: " + pokedex.name(id) + " [#" + longId(id) + "]");
    }
    msg.send(pokedex.image(id));
}

function showAndRateUpTo (msg, id) {
    showPokemon(msg, id);
    msg.send(":small_blue_diamond: Currently up to " + id + " (" + pokedex.name(id) + ")");
    setTimeout(function () {
        msg.send(":small_blue_diamond: " + pokedex.evaluate(id));
    }, stutter);
}

module.exports = function(robot) {
    robot.respond(/pok[eé]dex\??/i, function (msg) {
        showAndRateUpTo(msg, pokedex.getMax());
    });
    robot.respond(/fusion pok[eé]dex\??/i, function (msg) {
        showAndRateUpTo(msg, pokedex.fusion.getMax());
    });
    robot.respond(/fusion me( ([^\+&]+)( ?(\+|&&?) ?(.+))?)?/i, function(msg) {
        var faceId, bodyId,
            reqFace = String(msg.match[2] || '').replace(/^\s+/, '').replace(/\s+$/, ''),
            reqBody = String(msg.match[5] || '').replace(/^\s+/, '').replace(/\s+$/, '');
        if (reqFace && !reqBody && Math.random() >= 0.5) {
            //If only one pokemon was requested,
            //randomize whether it'll be face or body
            reqBody = reqFace;
            reqFace = void 0;
            bodyId = pokedex.getId(reqBody);
            faceId = pokedex.fusion.random(bodyId);
        } else {
            faceId = wildCards.indexOf(reqFace) > -1 ? pokedex.fusion.random() : pokedex.getId(reqFace);
            bodyId = wildCards.indexOf(reqBody) > -1 ? pokedex.fusion.random(faceId) : pokedex.getId(reqBody);
        }
        if (!faceId || !bodyId) {
            msg.send(":small_blue_diamond: What's a \"" + (faceId ? reqBody : reqFace) + "\"?");
        } else if (!pokedex.fusion.fusable(faceId) || !pokedex.fusion.fusable(bodyId)) {
            msg.send(":small_blue_diamond: Sorry, " + (pokedex.fusion.fusable(faceId) ? reqBody : reqFace) + " isn't fusable yet...");
            showPokemon(msg, pokedex.fusion.fusable(faceId) ? bodyId : faceId);
        } else {
            showOnsagerPokemon(msg, faceId, bodyId, wildCards.indexOf(reqFace) > -1 || wildCards.indexOf(reqBody) > -1 || void 0);
        }
    });
    robot.respond(/lickitung me/i, function (msg) {
        showOnsagerPokemon(msg, lickId, pokedex.fusion.random(lickId), true);
    });
    robot.respond(/([\S]+)( body)? bomb( (\d+))?/i, function (msg) {
        var num, w = msg.match[1], id, randId, nots, faceId, bodyId;
        if (w == 'fusion') {
            id = pokedex.fusion.random();
        } else {
            id = pokedex.getId(w);
            if (!id || !pokedex.fusion.fusable(id)) {
                //wasn't a bomb for me
                return;
            }
        }
        nots = [id];
        num = Math.min(msg.match[4] || 3, 40);
        if (msg.match[2]) {
            bodyId = id;
        } else {
            faceId = id;
        }
        while (num--) {
            randId = pokedex.fusion.random(nots);
            nots.push(randId);
            if (msg.match[2]) {
                faceId = randId;
            } else {
                bodyId = randId;
            }
            showOnsagerPokemon(msg, faceId, bodyId, false);
        }
    });
};

