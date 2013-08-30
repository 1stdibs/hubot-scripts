// Description:
//   HR Problems Solved!
//
// Dependencies:
//   None
//
// Commands:
//   hubot what should I do? - dispenses helpful advice
//
// Author:
//   andromedado

//http://www.hrclassroom.com/Images/DefaultTemplate/cert_seal.gif
//http://www.hrclassroom.com/Images/DefaultTemplate/cert_title.gif

var imageSrcs = [
    'http://www.hrclassroom.com/trainings/Trainings/LegacyImages/hof096ml.jpg',
    'http://www.hrclassroom.com/trainings/Trainings/LegacyImages/cas036ml.jpg',
    'http://www.hrclassroom.com/trainings/Trainings/LegacyImages/cbu039ml.jpg',
    'http://www.hrclassroom.com/trainings/Trainings/LegacyImages/bco_037l.jpg',
    'http://www.hrclassroom.com/trainings/Trainings/LegacyImages/fac079ml.jpg',
    'http://www.hrclassroom.com/trainings/Trainings/LegacyImages/e005624l.jpg',
    'http://www.hrclassroom.com/trainings/Trainings/LegacyImages/35281l-b.jpg',
    'http://www.hrclassroom.com/trainings/Trainings/LegacyImages/cas078mh.jpg'
];

var getOverIt = [
    'You should run a mile and get over it.',
    'You should write down your thoughts and keep quiet.'
];

var interventions = [
    'Go take a cold shower.'
];

var justDonts = [
    'Just don\'t go rubbing up against them.',
    'Just don\'t pass out racist pictures.'
];

function rand(arr) {
    return arr && arr.length && arr[Math.floor(Math.random() * arr.length)]
}

module.exports = function(robot) {

    robot.respond(/what should i do\?/i, function (msg) {
        msg.send(rand(imageSrcs));
        msg.send(rand(rand([getOverIt, justDonts])));
    });

    robot.hear(/you're cute/i, function (msg) {
        msg.send(rand(imageSrcs));
        msg.reply(rand(interventions));
    });

};

