# Notifies about Jenkins build errors via Jenkins Notification Plugin
#
# Dependencies:
#   "url": ""
#   "querystring": ""
#
# Configuration:
#   Just put this url <HUBOT_URL>:<PORT>/hubot/jenkins-notify?room=<room> to your Jenkins
#   Notification config. See here: https://wiki.jenkins-ci.org/display/JENKINS/Notification+Plugin
#
# Commands:
#   None
#
# URLS:
#   POST /hubot/jenkins-notify?room=<room>[&type=<type>]
#
# Authors:
#   spajus

url = require('url')
querystring = require('querystring')
http = require 'http'

module.exports = (robot) ->

  robot.router.post "/hubot/jenkins-notify", (req, res) ->

    @failing ||= []
    query = querystring.parse(url.parse(req.url).query)

    res.end('')

    envelope = {}
    envelope.user = {}
    envelope.room = query.room if query.room
    envelope.user.type = query.type if query.type

    room = 'dev'

    try
      data = req.body

      if data.build.phase == 'STARTED'
        console.log "jenkins-notify: A build has started! Oooh, the excitement!!"
        if data.name.match(/mothra.*qa/i)
          http.get 'http://xserve:5051/mothra-qa', (res) ->
            console.log "MOTHRA!!"
            console.log res.statusCode
      if data.build.phase == 'COMPLETED'
        console.log "jenkins-notify: A build has finished! Oooh, the excitement!!"
        if data.build.status == 'FAILURE'
          console.log "Failure"
          if data.name in @failing
            build = "is still"
          else
            build = "started"
          robot.messageRoom room, "#{data.name} build ##{data.build.number} #{build} failing (#{encodeURI(data.build.full_url)})"
          @failing.push data.name unless data.name in @failing
          if data.name.match(/mothra.*qa/i)
            console.log "MOTHRA!!"
            console.log res.statusCode
            robot.messageRoom '#dev', "Mothra has the upper hand!"
            robot.messageRoom '#dev', "http://i.imgur.com/CoqJxBx.gif"
        if data.build.status == 'SUCCESS'
          console.log "Success"
          #if data.name in @failing
          #  index = @failing.indexOf data.name
          #  @failing.splice index, 1 if index isnt -1
          #  robot.messageRoom room, "#{data.name} build is fixed! ##{data.build.number} (#{encodeURI(data.build.full_url)})"
          #else
          #  console.log "Sending success"
          #  robot.messageRoom room, "#{data.name} build succeeded! ##{data.build.number} (#{encodeURI(data.build.full_url)})"
          if data.name == '1stdibs.com Deploy Production PROD PROD PROD PROD'
            http.get 'http://xserve:5051/shipit', (res) ->
              console.log res.statusCode
            robot.messageRoom "#release", "1stdibs.com hotfix has been release!"
            robot.messageRoom "#release", "I hope you know what you're doing..."
          if data.name == 'Admin-v2 Deploy (PROD)'
            http.get 'http://xserve:5051/shipit-adminv2', (res) ->
              console.log res.statusCode
            robot.messageRoom "#release", "Admin v2 hotfix has been release!"
            robot.messageRoom "#release", "I hope you know what you're doing..."
          if data.name == 'Admin-v1 Deploy (PROD) (RACKSPACE)'
            http.get 'http://xserve:5051/shipit-adminv1', (res) ->
              console.log res.statusCode
            robot.messageRoom "#release", "Admin v1 hotfix has been release!"
            robot.messageRoom "#release", "I hope you know what you're doing..."
          if data.name == 'JAVA-InventoryService (Prod)'
            http.get 'http://xserve:5051/shipit-inventory', (res) ->
              console.log res.statusCode
            robot.messageRoom "#release", "Inventory service hotfix has been release!"
            robot.messageRoom "#release", "I hope you know what you're doing..."
          if data.name == 'JAVA-IdentityService (Prod)'
            http.get 'http://xserve:5051/shipit-identity', (res) ->
              console.log res.statusCode
            robot.messageRoom "#release", "Identity service hotfix has been release!"
            robot.messageRoom "#release", "I hope you know what you're doing..."
          if data.build and data.build.parameters and data.build.parameters.SERVER_HOSTNAME == 'deathstar.1stdibs.com'
            http.get 'http://xserve:5051/deathstar', (res) ->
              console.log res.statusCode
            robot.messageRoom "#dev", "The Death Star is now fully armed and operational"


    catch error
      console.log "jenkins-notify error: #{error}. Data: #{req.body}"
      console.log error.stack
