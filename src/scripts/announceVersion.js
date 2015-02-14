//
// Description:
//   You can now ask "scripts version?" and hubot will announce the currently
//   running version (package.json based) of hubot-scripts
//
// Dependencies:
//   q
//
// Configuration:
//   HUBOT_SPOT_URL
//
// Commands:
//   hubot scripts version? - Announce Scripts Version
//
// Authors:
//   andromedado
//

var Q = require('q');
var fs = require('fs');
var util = require('util');

var versionDef;

function getVersion () {
    if (!versionDef) {
        versionDef = Q.defer();
        fs.readFile(__dirname + '/../../package.json', function (err, data) {
            if (err) {
                versionDef.reject(err);
                return;
            }
            var packageInfo;
            try {
                packageInfo = JSON.parse(data + '');
            } catch (e) {
                versionDef.reject(e);
                return;
            }
            versionDef.resolve(packageInfo.version);
        });
        //Permit Re-Attempt
        versionDef.promise.fail(function () {
            versionDef = void 0;
        });
    }
    return versionDef.promise;
}

module.exports = function (robot) {
    robot.respond(/scripts version\?/i, function (message) {
        getVersion().then(function (version) {
            message.send('Hubot-1stdibs Scripts Version ' + version);
        }, function (err) {
            var error = '\n' + err;
            if (err && err.stack) {
                error += '\n' + err.stack;
            }
            message.send(util.format('Experienced an error looking it up:%s', error));
        });
    });
};

