# Description:
#   nugme is for that stoner life
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot nug me - Receive a nug
#   hubot nug bomb N - get N nugs

module.exports = (robot) ->

  robot.respond /nug (me|him|her)/i, (msg) ->
    msg.http("http://nugme.herokuapp.com/random")
      .get() (err, res, body) ->
        msg.send JSON.parse(body).nug

  robot.respond /nug bomb( (\d+))?/i, (msg) ->
    count = msg.match[2] || 5
    msg.http("http://nugme.herokuapp.com/bomb?count=" + count)
      .get() (err, res, body) ->
        msg.send nug for nug in JSON.parse(body).nugs

  robot.respond /how many nugs are there/i, (msg) ->
    msg.send "I don't know man. I smoked them all."

