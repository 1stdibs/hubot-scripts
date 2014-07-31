'use strict';

/**
 * This is setup in this way so that version number changes are not lost in merges.
 * e.g. two independent patch-increments, when git-merged,
 * will result in an appropriately high patch version number

 * HOW TO USE THIS FILE

 * 1. Decide if your change is major, minor or a patch
 *      Major - Breaking Change
 *      Minor - New Functionality
 *      Patch - Fix to existing Functionality
 * 2. If Minor, clear out array of patches
 *      If Major, clear out minor and patch arrays
 * 3. Add a description of your change to the BEGINNING of the appropriate array
 *      I use `changedArray[0]` to determine commit message
 * 4. From the package root, execute `node commit.js`

 */

var appName = 'Dibsy (Hubot)';
var majorChanges;
var minorChanges;
var patches;

majorChanges = [
    'removing `publish.js`',
    2, 1
];

minorChanges = [
    'auto-squash npm commit message'
];

patches = [
    'let\'s try pushing package in front of repo version',
    'figuring out npm version problem',
    'try again'
];

module.exports = {
    appName : appName,
    majorChanges : majorChanges,
    minorChanges : minorChanges,
    patches : patches,
    major : majorChanges.length,
    minor : minorChanges.length,
    patch : patches.length,
    version : [majorChanges.length, minorChanges.length, patches.length].join('.')
};

