// Description:
//   The greatest poet of a generation
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot shia me - For when you need some motivation
//   hubot shiabomb (n) - For when you need a lot of motivation
//
// Author:
//   Chris - shamelessly cribbed from Joey, who stole from (taylor, andromedado)
//   andromedado

var images = [
    "http://i.giphy.com/qvdqF0PGFPfyg.gif",
    "http://i.giphy.com/hXFuVE9WUpX1u.gif",
    "http://i.giphy.com/oe8Ii2ZyKl1fy.gif",
    "http://i.giphy.com/ACcXRXwUqJ6Ok.gif",
    "http://i.giphy.com/VHngktboAlxHW.gif",
    "http://i.giphy.com/7rj2ZgttvgomY.gif",
    "http://i.giphy.com/qDPg6HNz2NfAk.gif",
    "http://i.giphy.com/hMRwHs6D80E5a.gif",
    "https://ak-hdl.buzzfed.com/static/2014-10/21/20/enhanced/webdr08/anigif_enhanced-9506-1413938269-8.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy-23.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy-31.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy-41.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy-51.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy-61.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy-71.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy-91.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy-111.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy-101.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy-121.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy-141.gif",
    "https://collegecandy.files.wordpress.com/2015/11/giphy10.gif"
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

function sendShia (msg, howMany) {
    var shias = shuffle(images);
    howMany = howMany || 1;
    for (i = 0; i < howMany; i++) {
        //This way there are no duplicates unless you've asked for more Shias than we have
        msg.send(shias[i % shias.length] + "?_=" + (Math.ceil(Math.random() * 1000)));
    }
}

module.exports = function(robot) {

    robot.respond(/((shia|labeouf) )+me/i, function (msg) {
        sendShia(msg);
    });

    robot.respond(/.*shiabomb( (\d+))?/i, function (msg) {
        var howMany = msg.match[2] || 4;
        sendShia(msg, howMany);
    });

};
