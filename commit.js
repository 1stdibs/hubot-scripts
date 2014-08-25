
var child;
var argv = require('optimist').argv;
var exec = require('child_process').exec;
var colors = require('colors');
var util = require('util');
var theChange = '[no declared change]';
var whatChanged;
var commitMessage;
var commands = require('./src/scripts/support/commitCommands');
var command;

var checkable = ['major', 'minor', 'patch'];

checkable.forEach(function (toCheck) {
    if (argv[toCheck]) {
        whatChanged = toCheck;
        theChange = argv[toCheck];
    }
});

if (!whatChanged) {
    console.log('Please provide a `major`/`minor`/`patch` flag'.red);
    process.exit();
}

commitMessage = util.format('[hubot-1stdibs] %s update: %s', whatChanged, theChange);

command = [
    'git reset -q HEAD',
    'git add --all .',
    util.format('git commit -m %s', JSON.stringify(commitMessage)),
    util.format('npm version %s', whatChanged),
    'git reset HEAD~1',
    'git commit -a --amend --no-edit',
    'git pull --rebase origin master',
    'git push origin master',
    'npm publish .',
    "ssh root@dibsy 'updateDibsy'"
].join(' && ');

child = exec(command);

child.stdout.pipe(process.stdout);
child.stderr.on('data', function (data) {
    (data + '').split('\n').forEach(function (dataLine) {
        dataLine = dataLine.replace(/^\s+|\s+$/, '');
        if (dataLine) {
            console.log(util.format('%s %s', '=='.yellow, dataLine));
        }
    });
});
child.on('error', function (err) {
    console.log('ERROR'.red);
    console.log(err);
    if (err.stack) {
        console.log(err.stack);
    }
});


