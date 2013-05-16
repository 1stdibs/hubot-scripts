# Description:
#   See the status of NYC subways
#
# Dependencies:
#   "xml2js": "0.1.14"
#
# Configuration:
#   None
#
# Commands:
#   hubot mta me <train> - the status of a nyc subway line
#
# Author:
#   jgv

xml2js = require('xml2js')

ucWords = (str) ->
  return String(str).toLowerCase().replace /^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, (char1) ->
    return char1.toUpperCase()

module.exports = (robot) ->
  robot.respond /mta\s*(?:me)?\s*(\w+)?/i, (msg) ->
    mtaMe msg

mtaMe = (msg) ->
  msg.http('http://mta.info/status/serviceStatus.txt')
  .get() (err, res, body) ->
    if err
      throw err
    parser = new xml2js.Parser({'explicitRoot' : 'service', 'normalize' : 'false' })
    parser.parseString body, (err, res) ->
      if err
        throw err
      re = new RegExp(msg.match[1], 'gi')
      if msg.match[1].length is 1 or msg.match[1].toUpperCase() is 'SIR'
        for k in res.service.subway[0].line
          str = k.name[0]
          if str.match(re)
            if k.status[0] == 'GOOD SERVICE'
              msg.send 'the ' + str + ' train is ok!'
            else if k.status[0] == 'PLANNED WORK'
              msg.send 'heads up, the ' + str + ' train has planned work.'
            else
              msg.send 'the ' + str + ' train is all kinds of messed up: ' + ucWords(k.status[0])
            if k.text[0]
              msg.send String(k.text[0]).replace(/<.*?>/g, '').replace(/&amp;/g, '&').replace(/(\s+|&.*?;)/g, ' ')
      else
        msg.send 'thats not a valid subway line!'
