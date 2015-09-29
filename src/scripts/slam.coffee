# Description:
#   Slams from Ders and others
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   (Slam|Burn) - Get Slammed
#
# Author:
#   taylor

images = [
  "http://media1.giphy.com/media/IfaFEvfGz8CXK/giphy.gif",
  "http://38.media.tumblr.com/tumblr_m825bbnJIA1qam74xo1_500.gif",
  "http://33.media.tumblr.com/tumblr_m7dpky3KDX1rof6ulo1_500.gif",
  "http://i.imgur.com/ct3PcLA.gif",
  "http://reactiongif.org/wp-content/uploads/GIF/2014/08/GIF-amazing-classic-funny-OMG-rap-rapper-shocked-stare-Supa-Hot-Fire-surprised-GIF.gif",
  "http://media.giphy.com/media/xvWLAWTMsaEtG/giphy.gif",
  "http://data.whicdn.com/images/47936497/large.gif",
  "http://i58.photobucket.com/albums/g246/sey115/Photobucket%20Desktop%20-%20Sage%20Youngs%20MacBook/Funny%20and%20Random/willsmithsurprised_zpsbf418514.gif",
  "https://31.media.tumblr.com/1f7b873fec16573d26011e481ed0e50e/tumblr_inline_n1hy48UTMW1qklnuf.gif",
  "http://24.media.tumblr.com/tumblr_ma4vh18eP61rz79v5o2_500.gif",
  "http://massivnews.com/wp-content/uploads/2013/01/Christian-Bale-0001.gif",
  "https://38.media.tumblr.com/be1396e7b6d816233cad6deea60cff39/tumblr_nrkl22d6HW1tq4of6o1_400.gif",
  "https://d.gr-assets.com/hostedimages/1380365332ra/717283.gif"
  ]


module.exports = (robot) ->
  robot.hear /dibsy (slam|burn)/i, (msg) ->
    msg.send msg.random images
