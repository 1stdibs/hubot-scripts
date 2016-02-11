// Description:
//   Get some panda photos
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot panda me
//   hubot pandabomb (n)
//
// Author:
//   Presto (most code copied from shiabomb)

var images = [
  'http://i.imgur.com/qOtSOLv.gif',
  'http://i.imgur.com/93QElBD.gif',
  'http://i.imgur.com/VrhXsul.gif',
  'http://i.imgur.com/jdcDbyo.gif',
  'http://i.imgur.com/QQFF0c9.gif',
  'http://i.imgur.com/XqXbIVb.gif',
  'http://i.imgur.com/qCi0v2O.gif',
  'http://i.imgur.com/Lg9iNlB.gif',
  'http://i.imgur.com/qQgHN8Z.gif',
  'http://i.imgur.com/FFRNKqt.gif',
  'http://i.imgur.com/QyftTYH.gif',
  'http://i.imgur.com/nURUQQk.gif',
  'http://i.imgur.com/kHe5gs5.gif',
  'http://i.imgur.com/iBgGpmG.gif',
  'http://i.imgur.com/wR1eYYf.gif',
  'http://i.imgur.com/uKsThQJ.gif',
  'http://i.imgur.com/FlhR0jF.gif',
  'http://i.imgur.com/n0nAJlF.gif',
  'http://i.imgur.com/URdN7ow.gif',
  'http://i.imgur.com/fIvlNCG.gif',
  'http://i.imgur.com/96Mdit8.gif',
  'http://i.imgur.com/FVr3VRo.gif',
  'http://i.imgur.com/jKG94c8.gif',
  'http://i.imgur.com/YXXjgBu.gif',
  'http://i.imgur.com/zxuhMGN.gif',
  'http://i.imgur.com/L3kXbYt.gif',
  'http://i.imgur.com/8SrT8nu.gif',
  'http://i.imgur.com/iylkhQE.gif',
  'http://i.imgur.com/ehxejmS.gif',
  'http://i.imgur.com/lcIZpTh.gif',
  'http://i.imgur.com/vogTqVb.gif',
  'http://i.imgur.com/jtnigrj.gif',
  'http://i.imgur.com/pqG4PYJ.gif',
  'http://i.imgur.com/ZYPVFJu.gif',
  'http://i.imgur.com/P5Fboeo.gif',
  'http://i.imgur.com/nadm5ju.gif',
  'http://i.imgur.com/4iQUAt4.gif',
  'http://i.imgur.com/bggT1RV.gif',
  'http://i.imgur.com/gVmdZ0d.gif',
  'http://i.imgur.com/PX0J0R7.gif',
  'http://i.imgur.com/NOnFghF.gif'
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

function sendPanda (msg, howMany) {
    var pandas = shuffle(images);
    howMany = howMany || 1;
    for (i = 0; i < howMany; i++) {
        msg.send(pandas[i % pandas.length] + "?_=" + Math.random());
    }
}

module.exports = function(robot) {

    robot.respond(/((panda) )+me/i, function (msg) {
        sendPanda(msg);
    });

    robot.respond(/.*pandabomb( (\d+))?/i, function (msg) {
        var howMany = msg.match[2] || 4;
        sendPanda(msg, howMany);
    });

};
