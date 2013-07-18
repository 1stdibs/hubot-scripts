# Description:
#   Control Spot from campfire. https://github.com/minton/spot
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
#   hubot play <song> - Play a particular song. This plays the first most popular result.
#   hubot query <song> - Searches Spotify for a particular song, shows what "Play <song>" would play.
#   hubot volume? - Returns the current volume level.
#   hubot volume [0-100] - Sets the volume.
#   hubot volume+ - Bumps the volume.
#   hubot volume- - Bumps the volume down.
#   hubot mute - Sets the volume to 0.
#   hubot [name here] says turn it down - Sets the volume to 15 and blames [name here].
#   hubot say <message> - Tells hubot to read a message aloud.
#   hubot how much longer? - Hubot tells you how much is left on the current track
#   hubot find x music <search> - Searches and pulls up x (or 3) most popular matches
#   hubot play #n - Play the nth track from the last search results
#   hubot album #n - Pull up album info for the nth track in the last search results
#   hubot last find - Pulls up the most recent find query
#   hubot queue? - Pulls up the current queue
#   hubot queue (track name | track result #) - Adds the given track to the queue
#   hubot dequeue #(queue number) - removes the given queue line item (by current position in the queue)
# Authors:
#   mcminton, andromedado
https = require 'https'

VERSION = '1.4.8'

URL = "#{process.env.HUBOT_SPOT_URL}"

CAMPFIRE_CHRONOLOGICAL_DELAY = 700

DEFAULT_LIMIT = 3

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

recordUserQueryResults = (message, results) ->
  uQ = message.robot.brain.get('userQueries') || {}
  uD = uQ[message.message.user.id] = uQ[message.message.user.id] || {}
  uD.queries = uD.queries || []
  uD.queries.push(
    text: message.message.text
    time: now()
    results: results
  )
  message.robot.brain.set('userQueries', uQ)

getLastResultsRelevantToUser = (robot, user) ->
  uQ = robot.brain.get('userQueries') || {}
  uD = uQ[user.id] = uQ[user.id] || {}
  uD.queries = uD.queries || []
  lastUQTime = 0
  if (uD.queries.length)
    lastUQTime = uD.queries[uD.queries.length - 1].time
  lqT = robot.brain.get('lastQueryTime')
  if (lqT && lqT > lastUQTime && lqT - lastUQTime > 60)
    return robot.brain.get('lastQueryResults')
  if (uD.queries.length)
    return uD.queries[uD.queries.length - 1].results
  return null

explain = (data) ->
  if not data.artists
    return 'nothin\''
  artists = []
  artists.push(a.name) for a in data.artists
  A = []
  if data.album
    album = data.album.name
    if data.album.released
      album += ' [' + data.album.released + ']'
    A = ['Album: ' + album]
  return ['Track: ' + data.name].concat(A).concat([
    'Artist: ' + artists.join(', '),
    'Length: ' + calcLength(data.length)
    ]).join("\n")

now = () ->
  return ~~(Date.now() / 1000)

trim = (str) ->
  return String(str).replace(/^\s+/, '').replace(/\s+$/, '')

render = (explanations) ->
  str = ""
  for exp, i in explanations
    str += '#' + (i + 1) + "\n" + exp + "\n"
  return str

renderAlbum = (album) ->
  artists = []
  if not album.artists
    artists.push('No one...?')
  else
    artists.push(a.name) for a in album.artists
  pt1 = [
    '#ALBUM#',
    'Name: ' + album.name,
    'Artist: ' + artists.join(', '),
    'Released: ' + album.released,
    'Tracks:'
    ].join("\n") + "\n"
  explanations = (explain track for track in album.tracks)
  return pt1 + render(explanations)

nothingFoundMessage = 'I found nothin\''

nothinFound = (message) ->
  message.send(':small_blue_diamond: ' + nothingFoundMessage)

showResults = (robot, message, results) ->
  if not results or not results.length
    nothinFound(message)
    return
  explanations = (explain track for track in results)
  message.send(":small_blue_diamond: I found:")
  setTimeout(() ->
    message.send(render(explanations))
  , CAMPFIRE_CHRONOLOGICAL_DELAY)

calcLength = (seconds) ->
  iSeconds = parseInt(seconds, 10)
  if (iSeconds < 60)
    return (Math.round(iSeconds * 10) / 10) + ' seconds'
  rSeconds = iSeconds % 60
  if (rSeconds < 10)
    rSeconds = '0' + rSeconds
  return Math.floor(iSeconds / 60) + ':' + rSeconds

playTrack = (track, message, callback) ->
  callback = callback || ->
  if not track or not track.uri
    callback('invalid track')
    message.send(":flushed:")
    return
  message.send(":small_blue_diamond: Switching to: " + track.name)
  spotRequest message, '/play-uri', 'post', {'uri' : track.uri}, (err, res, body) ->
    callback(err, body)
    if (err)
      message.send(":flushed: " + err)

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

withTrack = (track, robot, message, callback) ->
  playNum = track.match(/#(\d+)\s*$/)
  if (playNum)
    r = getLastResultsRelevantToUser(robot, message.message.user)
    i = parseInt(playNum[1], 10) - 1
    if (r && r[i])
      callback(null, r[i])
      return
    callback('out of bounds');
    return
  if (track.match(/^that$/i))
    lastSingle = robot.brain.get('lastSingleQuery')
    if (lastSingle)
      callback(null, lastSingle)
      return
    lR = robot.brain.get('lastQueryResults')
    if (lR && lR.length)
      callback(null, lR[0])
      return
    callback(nothingFoundMessage)
    return
  params = {q: track}
  spotRequest message, '/single-query', 'get', params, (err, res, body) ->
    if (err)
      callback(err)
      return
    try
      track = JSON.parse(body)
      if (!track || !track.uri)
        callback(nothingFoundMessage)
      else
        callback(null, track)
    catch e
      callback(e)

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

sayError = (err, message) ->
  message.send(":flushed: " + err)

getStrHandler = (message) ->
  return (err, str) ->
    if (err)
      sayError(err, message)
    else
      message.send(str)

module.exports = (robot) ->

  Queue = require('./support/spotifyQueue')(robot, URL)
  Support = require('./support/spotifySupport')(robot, URL)

  robot.respond /find ((\d+) )?album(s)? (.+)/i, (message) ->
    if (message.match[3])#PLURAL
      Support.findAlbums message.match[4], message.message.user.id, message.match[2] || DEFAULT_LIMIT, getStrHandler(message)
      return
    Support.translateToAlbum trim(message.match[3]), message.message.user.id, (err, album) ->
      if (!err)
        str = templates.albumSummary(album)
      getStrHandler(message)(err, str)

  robot.respond /find ((\d+) )?artists (.+)/i, (message) ->
    Support.findArtists message.match[3], message.message.user.id, message.match[2] || DEFAULT_LIMIT, getStrHandler(message)

  robot.respond /find ((\d+) )?(music|tracks|songs) (.+)/i, (message) ->
    Support.findTracks message.match[4], message.message.user.id, message.match[2] || DEFAULT_LIMIT, getStrHandler(message)

  robot.respond /purge results!/i, (message) ->
    Support.purgeLists()
    message.send(':ok_hand:')

  robot.respond /(play|queue) (.+)/i, (message) ->
    Support.translateToTrack trim(message.match[2]), message.message.user.id, (err, track) ->
      if (err)
        sayError(err, message)
        return
      if (message.match[1].toLowerCase() == 'play' && !Queue.locked())
        Queue.stop()
        message.send(':small_blue_diamond: Switching to ' + templates.trackLine(track, true))
        Support.playTrack track, (err) ->
          Queue.start()
          if (err)
            sayError(err, message)
        return
      Queue.addTrack track, (err, index) ->
        if (err)
          sayError(err, message)
          return
        message.send(":small_blue_diamond: \"" + track.name + "\" is " + index + " in the queue")

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

  robot.respond /queue\??\s*$/i, (message) ->
    Queue.describe(message)

  robot.respond /dequeue #(\d+)/i, (message) ->
    Queue.dequeue (+message.match[1] - 1), (err, name) ->
      if (err)
        message.send(":flushed: " + err)
        return
      message.send(":small_blue_diamond: \"" + name + "\" removed from the queue")

#  robot.respond /queue (.+)/i, (message) ->
#    withTrack message.match[1], robot, message, (err, track) ->
#      if (err)
#        message.send(":flushed: " + err)
#        return
#      Queue.addTrack track, (err, index) ->
#        if (err)
#          message.send(":flushed: " + err)
#          return
#        message.send(":small_blue_diamond: \"" + track.name + "\" is " + index + " in the queue")

  robot.respond /play!/i, (message) ->
    message.finish()
    spotRequest message, '/play', 'put', {}, (err, res, body) ->
      message.send(":notes:  #{body}")
  
  robot.respond /pause/i, (message) ->
    params = {volume: 0}
    spotRequest message, '/pause', 'put', params, (err, res, body) ->
      message.send("#{body} :cry:")
  
  robot.respond /next/i, (message) ->
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

#  robot.respond /play (.*)/i, (message) ->
#    if (Queue.locked())
#      withTrack message.match[1], robot, message, ->
#      message.send(":small_blue_diamond: I just put on a track, one sec")
#      return
#    Queue.stop()
#    withTrack message.match[1], robot, message, (err, track) ->
#      if (err)
#        message.send(":flushed: " + err)
#        Queue.start()
#        return
#      playTrack(track, message, () -> Queue.start())

  robot.respond /album .(\d+)/i, (message) ->
    r = getLastResultsRelevantToUser(robot, message.message.user)
    n = parseInt(message.match[1], 10) - 1
    if (!r || !r[n])
      message.send(":small_blue_diamon: out of bounds...")
      return
    spotRequest message, '/album-info', 'get', {'uri' : r[n].album.uri}, (err, res, body) ->
      album = JSON.parse(body)
      album.tracks.forEach((track) ->
        track.album = track.album || r[n].album
        track.album.uri = r[n].album.uri
      )
      recordUserQueryResults(message, album.tracks)
      robot.brain.set('lastQueryResults', album.tracks)
      message.send(renderAlbum album)

  robot.respond /(how much )?(time )?(remaining|left)\??$/i, remainingRespond

  robot.respond /query (.*)/i, (message) ->
    params = {q: message.match[1]}
    spotRequest message, '/single-query', 'get', params, (err, res, body) ->
      track = JSON.parse(body)
      robot.brain.set('lastSingleQuery', track)
      message.send(":small_blue_diamond: I found:")
      setTimeout(() ->
        message.send(explain track)
      , CAMPFIRE_CHRONOLOGICAL_DELAY)

  robot.respond /last find\??/i, (message) ->
    data = robot.brain.get 'lastQueryResults'
    if (!data || data.length == 0)
      message.send(":small_blue_diamond: I got nothin'")
      return
    recordUserQueryResults(message, data)
    showResults(robot, message, data)

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


