// Description:
//   Blaaaaaargh!
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot smashing|nigel me - For when you want to be smashing
//   hubot smashingbomb|smashbomb|nigelbomb (n) - For when you want to be REALLY smashing
//
// Author:
//   Chris, who stole basically the whole thing from andromedado

var images = [
    "http://cdn.smosh.com/sites/default/files/bloguploads/nigel-thornberry-aladdin.gif",
    "http://i.imgur.com/1o6KD.gif",
    "https://68.media.tumblr.com/5089c413fdf54f6afdca6bb76b851dc2/tumblr_inline_njey9eRAx31sgmxn6.gif",
    "http://38.media.tumblr.com/8773013060a6d094953505ea44460b92/tumblr_nisx9egtQo1rm7d3so1_500.gif",
    "https://68.media.tumblr.com/5406c2ea1b2e4934cf9203ab6476f034/tumblr_n4aa48TLK91qa6ucqo1_500.gif",
    "https://68.media.tumblr.com/fca646db21ce39aa08611fdf31fa3740/tumblr_inline_njey84oNqV1sgmxn6.gif",
    "http://i.giphy.com/Q8fN8ADCh5UWI.gif",
    "http://i.giphy.com/KPuD5AY07fteM.gif",
    "http://i.giphy.com/2gpTg0thRt0ek.gif",
    "https://thefigureskatinglawyer.files.wordpress.com/2012/08/nigelsmashing.gif",
    "http://cdn.smosh.com/sites/default/files/ftpuploads/bloguploads/nigel-thornberry-gif-single-ladies.gif",
    "http://2.media.dorkly.cvcdn.com/90/50/b410d677a61906d097e0b12fafcf67ec.gif",
    "http://25.media.tumblr.com/ea8db6029006ce4ec9ca0d694e303966/tumblr_mincudVD5E1rm7d3so1_400.gif",
    "http://24.media.tumblr.com/tumblr_medgogg94B1rpr100o1_r1_400.gif",
    "http://25.media.tumblr.com/tumblr_m3ps38gNaM1qi84ovo1_500.gif",
    "http://i.imgur.com/cRmXk.gif",
    "http://24.media.tumblr.com/tumblr_mdhzvv8GJN1rrnep7o1_250.gif",
    "http://i.imgur.com/EvYOU.gif",
    "http://i.imgur.com/cun8Q.gif",
    "http://i.imgur.com/NxR28Qc.gif",
    "http://i.imgur.com/St9nA.gif",
    "http://i.imgur.com/OMBuL.gif",
    "http://i.imgur.com/jVEDX.gif",
    "http://i.imgur.com/i8hLM.gif",
    "http://i.imgur.com/AKZW8.gif",
    "http://i.imgur.com/tTE5e.gif",
    "http://i.imgur.com/8UCyO.gif",
    "http://i.imgur.com/bAzz0.gif",
    "http://i.imgur.com/9D0S5.gif",
    "http://i.imgur.com/MTk53.gif",
    "http://i.imgur.com/qJQIi.gif",
    "http://i.imgur.com/vyNZo.gif",
    "http://i.imgur.com/NbWYQ.gif",
    "http://i.imgur.com/1OuuF.gif",
    "http://i.imgur.com/u9qYQ.gif",
    "http://i.imgur.com/aChx6.gif",
    "http://i.imgur.com/hwmGD.gif",
    "http://i.imgur.com/HU6Bj.gif",
    "http://i.imgur.com/FvVJB.gif",
    "http://i.imgur.com/bHhCw.gif",
    "http://i.imgur.com/pAk3c.gif",
    "http://i.imgur.com/KZRbJ.gif",
    "http://i.imgur.com/ho8Gw.gif",
    "http://i.imgur.com/dP1Yk.gif",
    "http://i.imgur.com/8JczC.gif",
    "http://i.imgur.com/F2mRD.gif",
    "http://i.imgur.com/Vjg6o.gif",
    "http://i.imgur.com/YjiPy.gif",
    "http://i.imgur.com/OYzxA.gif",
    "http://i.imgur.com/hZpQT.gif",
    "http://i.imgur.com/8Fkut.gif",
    "http://i.imgur.com/d9diF.gif",
    "http://i.imgur.com/nPkJB.gif"
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

function sendNigel (msg, howMany) {
    var nigels = shuffle(images);
    howMany = howMany || 1;
    for (i = 0; i < howMany; i++) {
        //This way there are no duplicates unless you've asked for more Nigels than we have
        msg.send(nigels[i % nigels.length] + "?_=" + (Math.ceil(Math.random() * 1000)));
    }
}

module.exports = function(robot) {

    robot.respond(/((smashing|nigel) )+me/i, function (msg) {
        sendNigel(msg);
    });

    robot.respond(/.*(smashbomb|smashingbomb|nigelbomb)( (\d+))?/i, function (msg) {
        var howMany = msg.match[2] || 4;
        sendNigel(msg, howMany);
    });

};
