// Description:
//   Spiders for everyone!
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   (spiderbomb) - Spiders for when you need 'em most
//
// Author:
//   Joey - stolen from (taylor, andromedado)

var images = [
    "https://media.giphy.com/media/OM8JhWiICevDy/giphy.gif",
    "https://media.giphy.com/media/ERsmR91gnL5Sw/giphy.gif"
];

for (var i = 0; i < 130; i++) {
    images.push("https://ak-hdl.buzzfed.com/static/2014-11/22/5/enhanced/webdr01/anigif_enhanced-19058-1416653074-7.gif");
}

module.exports = function(robot) {
    return robot.hear(/dibsy (spiderbomb)/i, function(msg) {
        return msg.send(msg.random(images) + "?_=" + (Math.ceil(Math.random() * 1000)));
    });
};

