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

var faces = {
    noneOfIt : [
        ':confused:', ':weary:',
        ':unamused:', ':angry:'
    ],
    smiles : [
        ':grinning:', ':blush:',
        ':relaxed:', ':smirk:',
        ':grin:', ':wink:'
    ],
    neutral : [
        ':grimacing:', ':expressionless:',
        ':neutral_face:', ':no_mouth:'
    ],
    concerned : [
        ':frowning:', ':worried:',
        ':anguished:', ':fearful:'
    ]
};

var getOverIt = [
    'You should run a mile and get over it.',
    'You should write down your thoughts and keep quiet.'
];

var justDonts = [
    'Just don\'t go rubbing up against them.',
    'Just don\'t pass out racist pictures.'
];

var interventions = [
    'Go take a cold shower.'
];

function randEl (array) {
    return array && array.length && array[Math.floor(Math.random() * array.length)];
}

function concatRandFromEach(/* arr,... */) {
    var say = [];
    Array.prototype.forEach.call(arguments, function (arr) {
        say.push(randEl(arr));
    });
    return say.join(' ');
}

module.exports = function(robot) {

    robot.respond(/what should i do\?/i, function (msg) {
        msg.send(randEl(imageSrcs));
        msg.send(
            concatRandFromEach(
                randEl([getOverIt, justDonts])
//                randEl([faces.smiles, faces.noneOfIt, faces.neutral])
            )
        );
    });

    robot.hear(/you're cute/i, function (msg) {
        msg.send(randEl(imageSrcs));
        msg.reply(
            concatRandFromEach(
                randEl([faces.concerned, faces.noneOfIt])
//                randEl([interventions])
            )
        );
    });

};

