// Description:
//   Throw a smokebomb to cover your tracks!
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   .* smokebomb.*
//
// Author:
//   Shad, Written For Taylor Bragg

var images = [
    "https://s-media-cache-ak0.pinimg.com/originals/7c/18/d9/7c18d9ad2ea1bde311b78fce30c23945.gif",
    "http://blogfiles.wfmu.org/KF/2014/04/23/cartoon_smoke.gif",
    "http://www.reactiongifs.us/wp-content/uploads/2015/07/smoke_bomb_archer.gif",
    "http://i.imgur.com/E21FhIf.gif",
    "http://i.imgur.com/uocDcnW.gif",
    "http://media.fyre.co/ehIL2qumSGeNTEzSqK3X_ninja_magic.gif",
    "http://i.imgur.com/hPip3nF.gif",
    "http://cdn.makeagif.com/media/10-16-2015/Bxsvl2.gif",
    "http://i.imgur.com/DPhNOpo.gifv"
];

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function send (msg, howMany) {
    var items = shuffle(images);
    howMany = howMany || 1;
    for (i = 0; i < howMany; i++) {
        //This way there are no duplicates unless you've asked for more than we have
        msg.send(items[i % items.length] + "?_=" + (Math.ceil(Math.random() * 1000)));
    }
}

module.exports = function(robot) {

    //[ALTER THIS REGEX TO SUIT YOUR NEEDS]
    robot.hear(/smokebomb/i, function (msg) {
        send(msg);
    });

    //[ALTER THIS REGEX TO SUIT YOUR NEEDS]
    robot.respond(/smokebomb( (\d+))?/i, function (msg) {
        var howMany = msg.match[2] || 4;
        send(msg, howMany);
    });

};
