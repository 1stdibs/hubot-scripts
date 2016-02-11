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
//   Dibsy spiderbomb - Spiders for when you need 'em most
//   spider/spiders - Drops a single pic
//
// Author:
//   Joey - EXTREMELY stolen from andromedo and his awesome shiabomb

var images = [
    "https://media.giphy.com/media/OM8JhWiICevDy/giphy.gif",
    "https://media.giphy.com/media/ERsmR91gnL5Sw/giphy.gif",
    "http://bestanimations.com/Animals/Insects/Spiders/spider-animated-gif-16.gif",
    "http://cdn.list25.com/wp-content/uploads/2014/07/imgarcade.com-comment_fiaqvCGfHW5p6Ni6XvqlomhtlYitrn1c.gif",
    "http://cdn.ebaumsworld.com/mediaFiles/picture/705380/84037338.gif",
    "https://s-media-cache-ak0.pinimg.com/originals/b6/62/72/b66272eea9f0136bd6d928bc55cb95a8.gif",
    "http://i.imgur.com/HNb69vY.gif",
    "http://cdn.list25.com/wp-content/uploads/2014/07/forum.encyclopediadramatica.se-kBCn1.gif",
    "http://cdn2.list25.com/wp-content/uploads/2014/07/gifsec.com-GIF-Huge-Spider.gif",
    "http://cdn3.list25.com/wp-content/uploads/2014/07/metro.co_.uk-spider4.gif",
    "http://cdn2.list25.com/wp-content/uploads/2014/07/www.buzzfeed.com-anigif_enhanced-buzz-12918-1418657848-6.gif"



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

function sendSpiders (msg, howMany) {
    var spiders = shuffle(images);
    howMany = howMany || 1;
    for (i = 0; i < howMany; i++) {
        //This way there are no duplicates unless you've asked for more Spiders than we have
        msg.send(spiders[i % spiders.length] + "?_=" + (Math.ceil(Math.random() * 1000)));
    }
}

module.exports = function(robot) {

    robot.respond(/((spider|spiders) )+me/i, function (msg) {
        sendSpiders(msg);
    });

    robot.respond(/.*spiderbomb( (\d+))?/i, function (msg) {
        var howMany = msg.match[2] || 4;
        sendSpiders(msg, howMany);
    });

};