// Description:
//   Turn up!
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   .* turn up.*
//   .* turnup.*
//   .* turnip.*
//
// Author:
//   Various Artists

var images = [
    'https://68.media.tumblr.com/4ea21ce02dd015ee9f1057524ec6e5ca/tumblr_o39ceghovA1sgl0ajo1_400.gif',
    'https://media.giphy.com/media/dLPTwfYtmuLF6/giphy.gif',
    'http://i1.kym-cdn.com/photos/images/original/000/708/752/6f5.gif',
    'http://www.lovethispic.com/uploaded_images/143705-Lisa-Simpson-Dancing.gif',
    'http://i.imgur.com/arTwCW7.gif',
    'http://i.imgur.com/m6VRS8u.gif',
    'http://i.imgur.com/MiC6C6l.gif',
    'https://media.giphy.com/media/olAik8MhYOB9K/giphy.gif',
    'https://media.giphy.com/media/BoPUZQRQEPogo/giphy.gif',
    'https://media.giphy.com/media/wqPWKOtW2AD9S/giphy.gif',
    'http://akns-images.eonline.com/eol_images/Entire_Site/2015810/rs_470x314-150910120306-giphy_3.gif',
    'http://public.articles.mtv.com/wp-content/uploads/style/2014/01/bombs-shimmy.gif',
    'http://cdn3-www.musicfeeds.com.au/assets/uploads/5d73c185050fc72385ead151133f2364.gif',
    'https://media.tenor.co/images/541b4abe6eb9f9545139bb2e0767009b/raw',
    'http://o.aolcdn.com/hss/storage/midas/6bc81f4958f714d71db568487588928c/202849138/1.gif',
    'https://media.giphy.com/media/3o6ozw9w2pPU8ndp0k/giphy.gif',
    'https://s3.amazonaws.com/rapgenius/kenan-and-kel-aw-here-it-goes-awh-here-goes-intro-kel-1352766252e.gif',
    'https://ddppchicago.files.wordpress.com/2017/02/overcoming.gif?w=665',
    'http://i.imgur.com/qK0BMiH.gif',
    'https://media.giphy.com/media/i2dE5VvBNxBw4/giphy.gif',
    'http://i.imgur.com/aZvNY8S.gif',
    'http://a.fod4.com/images/GifGuide/dancing/tumblr_lit5wdB6j21qcfba3o1_500.gif',
    'https://33.media.tumblr.com/6800b0da8ced43a3d142441d033b34a8/tumblr_nm568diaWN1rxw730o1_500.gif'
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

    robot.hear(/(turn up|turnup|turnip)/i, function (msg) {
        send(msg);
    });

};
