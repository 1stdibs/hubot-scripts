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
//   (shiabomb) - For when you need some motivation
//
// Author:
//   Chris - shamelessly cribbed from Joey, who stole from (taylor, andromedado)

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

function sendShia (msg) {
    return msg.send(msg.random(images) + "?_=" + (Math.ceil(Math.random() * 1000)));
}

module.exports = function(robot) {
    return robot.respond(/.*shiabomb/i, function (msg) {
        for (i = 0; i < 4; i++) {
            this.sendShia(msg);
        }
    });
};
