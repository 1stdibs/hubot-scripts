# Description:
#   Control Spot from campfire. https://github.com/1stdibs/Spot
#
# Dependencies:
#   underscore
#
# Configuration:
#   HUBOT_SPOT_URL
#
# Commands:
#   hubot music status? - Lets you know what's up
#   hubot play! - Plays current playlist or song.
#   hubot pause - Pause the music.
#   hubot play next - Plays the next song.
#   hubot play back - Plays the previous song.
#   hubot playing? - Returns the currently-played song.
#   hubot volume? - Returns the current volume level.
#   hubot volume [0-100] - Sets the volume.
#   hubot volume+ - Bumps the volume.
#   hubot volume- - Bumps the volume down.
#   hubot mute - Sets the volume to 0.
#   hubot [name here] says turn it down - Sets the volume to 15 and blames [name here].
#   hubot say <message> - Tells hubot to read a message aloud.
#   hubot play <song> - Play a particular song. This plays the first most popular result.
#   hubot find x artist <artist-query> - Searches for x (or 6) most popular artist matching query
#   hubot find x music <track-query> - Searches for x (or 6) most popular tracks matching query
#   hubot find x music by <artist-query> - Searches for x (or 6) most popular tracks by artist-query
#   hubot find x albums <album-query> - Searches for x (or 6) most popular albums matching query
#   hubot find x albums by <artist-query> - Searches for x (or 6) most popular albums by artist-query
#   hubot show me album <album-query> - Pulls up the album for the given search, or if (x:y) format, the album associated with given result
#   hubot show me this album - Pulls up the album for the currently playing track
#   hubot show me music by this artist - Pulls up tracks by the current artist
#   hubot play n - Play the nth track from the last search results
#   hubot play x:y - Play the y-th track from x-th result set
#   hubot how much longer? - Hubot tells you how much is left on the current track
#   hubot queue? - Pulls up the current queue
#   hubot queue (track name | track result #) - Adds the given track to the queue
#   hubot dequeue #(queue number) - removes the given queue line item (by current position in the queue)
# Authors:
#   andromedado
https = require 'https'

VERSION = '2.1.0'

URL = "#{process.env.HUBOT_SPOT_URL}"

CAMPFIRE_CHRONOLOGICAL_DELAY = 700

DEFAULT_LIMIT = 6

Queue = {}

templates = require('./support/spotifyTemplates')


getCurrentVersion = (callback) ->
  https.get('https://raw.github.com/1stdibs/hubot-scripts/master/src/scripts/spot.coffee', (res) ->
    data = ''
    res.on('data', (d) ->
      data += d
    )
    res.on('end', () ->
      bits = data.match(/VERSION = '([\d\.]+)'/)
      version = bits && bits[1]
      callback(!version, version)
    )
  ).on('error', (e) ->
    callback(e);
  )

compareVersions = (base, comparator) ->
  if (base == comparator)
    return 'up-to-date'
  re = /^(\d+)(\.(\d+))?(\.(\d+))?/
  bParts = base.match(re)
  cParts = comparator.match(re)
  diff = false
  if (bParts && cParts)
    [{k : 1, n : 'major version'}, {k : 3, n : 'minor version'}, {k : 5, n : 'patch', pn : 'patches'}].forEach((obj) ->
      diff = diff || comparePart(bParts[obj.k], cParts[obj.k], obj.n, obj.pn)
    )
  if (!diff)
    diff = 'different than the repo version: ' + base
  return diff

comparePart = (b, c, partName, partNamePlural) ->
  if (b == c)
    return false
  diff = Math.abs(Number(c) - Number(b))
  if (Number(c) > Number(b))
    stem = 'ahead'
    suffix = '; the repo should probably be updated.'
  else
    stem = 'behind'
    suffix = '; you should probably update me. https://github.com/1stdibs/hubot-scripts'
  if (diff == 1)
    whats = partName
  else
    whats = partNamePlural || (partName + 's')
  return stem + ' by ' + diff + ' ' + whats + suffix

spotRequest = (message, path, action, options, callback) ->
  message.http("#{URL}#{path}")
    .query(options)[action]() (err, res, body) ->
      callback(err,res,body)

now = () ->
  return ~~(Date.now() / 1000)

trim = (str) ->
  return String(str).replace(/^\s+/, '').replace(/\s+$/, '')

words =
  'a couple': 2
  'default': 3
  'a few': 4
  'many': 6
  'a lot': 10
  'lots of': 10


determineLimit = (word) ->
  if (String(word).match(/^\d+$/))
    return word
  if (!word || !words.hasOwnProperty(word))
    word = 'default'
  return words[word]

spotNext = (msg) ->
  spotRequest msg, '/next', 'put', {}, (err, res, body) ->
    msg.send(":small_blue_diamond: #{body} :fast_forward:")

volumeRespond = (message) ->
  spotRequest message, '/volume', 'get', {}, (err, res, body) ->
    message.send("Spot volume is #{body}. :mega:")

remainingRespond = (message) ->
  spotRequest message, '/how-much-longer', 'get', {}, (err, res, body) ->
    message.send(":small_blue_diamond: #{body}")

playingRespond = (message) ->
  spotRequest message, '/playing', 'get', {}, (err, res, body) ->
    message.send("#{URL}/playing.png")
    message.send(":notes:  #{body}")
    next = Queue.next()
    if (next)
      message.send(":small_blue_diamond: Up next is \"#{next.name}\"")

getStrHandler = (message) ->
  return (err, str) ->
    if (err)
      sayMyError(err, message)
    else
      message.send(str)

sayMyError = (err, message) ->
  message.send(":flushed: " + err)

sayYourError = (message) ->
  message.send(":no_good: Syntax Error [" + Math.floor(Math.random() * Math.pow(10, 4)) + "]")

module.exports = (robot) ->

  Queue = require('./support/spotifyQueue')(robot, URL)
  Support = require('./support/spotifySupport')(robot, URL, Queue)

  robot.respond /show (me )?(this )?album( (.+))?$/i, (message) ->
    if (message.match[2])#THIS [currently playing]
      Support.getCurrentAlbum (err, album, resultIndex) ->
        if (!err)
          str = templates.albumSummary(album, resultIndex)
        getStrHandler(message)(err, str)
    else if message.match[4]#Search Query
      Support.translateToAlbum message.match[4], message.message.user.id, (err, album, resultIndex) ->
        if (!err)
          str = templates.albumSummary(album, resultIndex)
        getStrHandler(message)(err, str)
    else#invalid syntax
      sayYourError(message)

  robot.respond /((find|show) )?(me )?((\d+) )?album(s)? (.+)/i, (message) ->
    if (message.match[6])#PLURAL
      Support.findAlbums message.match[7], message.message.user.id, message.match[5] || DEFAULT_LIMIT, getStrHandler(message)
    else
      Support.translateToAlbum trim(message.match[7]), message.message.user.id, (err, album, resultIndex) ->
        if (!err)
          str = templates.albumSummary(album, resultIndex)
        getStrHandler(message)(err, str)

  robot.respond /find ((\d+) )?artists (.+)/i, (message) ->
    Support.findArtists message.match[3], message.message.user.id, message.match[2] || DEFAULT_LIMIT, getStrHandler(message)

  robot.respond /(show|find) (me )?((\d+) )?(music|tracks|songs) (.+)/i, (message) ->
    Support.findTracks message.match[6], message.message.user.id, message.match[4] || DEFAULT_LIMIT, getStrHandler(message)

  robot.respond /purge results!/i, (message) ->
    Support.purgeLists()
    message.send(':ok_hand:')

  robot.respond /purge music cache!/i, (message) ->
    Support.purgeMusicDataCache();
    message.send(':ok_hand:')

  robot.respond /(play|queue) (.+)/i, (message) ->
    Support.translateToTrack trim(message.match[2]), message.message.user.id, (err, track) ->
      if (err)
        sayMyError(err, message)
        return
      if (message.match[1].toLowerCase() == 'play' && !Queue.locked())
        Queue.stop()
        message.send(':small_blue_diamond: Switching to ' + templates.trackLine(track, true))
        Support.playTrack track, (err) ->
          Queue.start()
          if (err)
            sayMyError(err, message)
        return
      Queue.addTrack track, (err, index) ->
        if (err)
          sayMyError(err, message)
          return
        message.send(":small_blue_diamond: #" + index + " in the queue is " + templates.trackLine(track))

  robot.respond /music status\??/i, (message) ->
    spotRequest message, '/seconds-left', 'get', {}, (err, res, body) ->
      seconds = parseInt(String(body).replace(/[^\d\.]+/g, ''), 10) || 1;
      setTimeout ( ->
        spotRequest message, '/seconds-left', 'get', {}, (err, res, body) ->
          seconds2 = parseInt(String(body).replace(/[^\d\.]+/g, ''), 10) || 1;
          if (seconds == seconds2)
            message.send ":small_blue_diamond: The music appears to be paused"
          else
            remainingRespond(message)
      ), 2000
    playingRespond(message)
    volumeRespond(message)
    Queue.describe(message)

  robot.respond /(show (me )?the )?queue\??\s*$/i, (message) ->
    Queue.describe(message)

  robot.respond /dequeue #(\d+)/i, (message) ->
    Queue.dequeue (+message.match[1]), (err, name) ->
      if (err)
        message.send(":flushed: " + err)
        return
      message.send(":small_blue_diamond: \"" + name + "\" removed from the queue")

  robot.respond /play!/i, (message) ->
    message.finish()
    spotRequest message, '/play', 'put', {}, (err, res, body) ->
      message.send(":notes:  #{body}")
  
  robot.respond /pause/i, (message) ->
    params = {volume: 0}
    spotRequest message, '/pause', 'put', params, (err, res, body) ->
      message.send("#{body} :cry:")
  
  robot.respond /next/i, (message) ->
    if (Queue.locked())
      message.send(":raised_hand: Not yet, this was queued")
      return
    if (Queue.next())
      Queue.playNext (err, track) ->
        if (err)
          spotNext message
          return
        message.send(":small_blue_diamond: Ok, on to #{track.name}")
    else
      spotNext message
  
  robot.respond /back/i, (message) ->
    spotRequest message, '/back', 'put', {}, (err, res, body) ->
      message.send("#{body} :rewind:")

  robot.respond /playing\?/i, playingRespond

  robot.respond /album art\??/i, (message) ->
    spotRequest message, '/playing', 'get', {}, (err, res, body) ->
      message.send("#{URL}/playing.png")

  robot.respond /volume\?/i, volumeRespond

  robot.respond /volume\+/i, (message) ->
    spotRequest message, '/bumpup', 'put', {}, (err, res, body) ->
      message.send("Spot volume bumped to #{body}. :mega:")

  robot.respond /volume\-/i, (message) ->
    spotRequest message, '/bumpdown', 'put', {}, (err, res, body) ->
      message.send("Spot volume bumped down to #{body}. :mega:")

  robot.respond /mute/i, (message) ->
    spotRequest message, '/mute', 'put', {}, (err, res, body) ->
      message.send("#{body} :mute:")

  robot.respond /volume (.*)/i, (message) ->
    params = {volume: message.match[1]}
    spotRequest message, '/volume', 'put', params, (err, res, body) ->
      message.send("Spot volume set to #{body}. :mega:")

  robot.respond /(how much )?(time )?(remaining|left)\??$/i, remainingRespond

  robot.respond /say (.*)/i, (message) ->
    what = message.match[1]
    params = {what: what}
    spotRequest message, '/say', 'put', params, (err, res, body) ->
      message.send(what)

  robot.respond /say me/i, (message) ->
    message.send('no way ' + message.message.user.name)

  robot.respond /(.*) says.*turn.*down.*/i, (message) ->
    name = message.match[1]
    message.send("#{name} says, 'Turn down the music and get off my lawn!' :bowtie:")
    params = {volume: 15}
    spotRequest message, '/volume', 'put', params, (err, res, body) ->
      message.send("Spot volume set to #{body}. :mega:")

  robot.respond /spot version\??/i, (message) ->
    getCurrentVersion((e, repoVersion) ->
      msg = ':small_blue_diamond: Well, ' + message.message.user.name + ', my Spot version is presently ' + VERSION
      if (!e)
        msg += '; I am ' + compareVersions(repoVersion, VERSION)
      message.send msg
    )


