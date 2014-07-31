
var exec = require('child_process').exec;
var colors = require('colors');
var util = require('util');
var version = require('./src/scripts/support/spotVersion');
var theChange = '[no declared change]';
var whatChanged = '??';
var commitMessage;
var commands = require('./src/scripts/support/commitCommands');
var command;

if (version.patches[0]) {
    theChange = version.patches[0];
    whatChanged = 'patch';
} else if (version.minorChanges[0]) {
    theChange  = version.minorChanges[0];
    whatChanged = 'minor change';
} else if (version.majorChanges[0]) {
    theChange = version.majorChanges[0];
    whatChanged = 'major change';
}

commitMessage = util.format('[%s %s] %s: %s', version.appName, version.version, whatChanged, theChange);

command = [].concat(commands.preCommit, [
    'git reset -q HEAD',
    'git add --all .',
    util.format('git commit -m %s', JSON.stringify(commitMessage))
], commands.postCommit).join(' && ');

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

