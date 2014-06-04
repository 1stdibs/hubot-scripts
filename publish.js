
var exec = require('child_process').exec;
var colors = require('colors');
var util = require('util');
var command;
var argv = require('optimist').argv;
var commitType = 'patch';
var commitMessage = '[Dibsy %s]';
var baseMessage;

if (argv.major) {
    commitType = 'major';
} else if (argv.minor) {
    commitType = 'minor';
} else {
    commitType = 'patch';
}

commitMessage = util.format('%s %s', commitMessage, commitType);

if (argv.m || argv.message) {
    baseMessage = argv.m || argv.message;
    commitMessage = util.format('%s: %s', commitMessage, baseMessage);
} else {
    baseMessage = commitType;
}

command = [
    'git reset -q HEAD',
    'git add --all .',
    util.format('git commit -m %s', JSON.stringify(baseMessage)),
    util.format('npm version %s -m %s', commitType, JSON.stringify(commitMessage))
].join(' && ');

exec(command, function (err, stdout, stderr) {
    if (err) {
        console.log('ERROR:'.red.bold);
        console.log(err);
    }
    if (stdout) {
        console.log('STDOUT:'.green.bold);
        console.log(stdout);
    }
    if (stderr) {
        console.log('STDERR:'.yellow.bold);
        console.log(stderr);
    }
});

