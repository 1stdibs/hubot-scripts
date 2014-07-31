
module.exports = {
    preCommit : [
    ],
    postCommit : [
        '(git pull --rebase origin master && git push origin master) || (echo "Ok fine, I\'ll stash" >&2 && git stash -u -q && git push origin master && git stash pop -q)',
        'npm publish .',
        "ssh root@dibsy 'updateDibsy'"
    ]
};

