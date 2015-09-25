# Description:
#   derpin and nerpin
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   (nerp|herp|derp) - Derp a doo
#
# Author:
#   corey

images = [
  "http://i0.kym-cdn.com/photos/images/original/000/072/039/HerpDerp.jpg",
  "http://vignette3.wikia.nocookie.net/inciclopedia/images/c/c8/Derp1.jpg/revision/latest?cb=20110608183440",
  "https://imagemacros.files.wordpress.com/2009/12/johnny_derp_depp.jpg?w=720",
  "http://vignette2.wikia.nocookie.net/minecraftfanfictions/images/5/5d/Frabz-i-dont-always-derp-but-i-always-herp-before-i-derp-cd4d16.jpg/revision/latest?cb=20131107230804",
  "https://s3.amazonaws.com/prod_sussleimg/cab86c5d7843f0a773396a3c7ebe71e9.jpg",
  "http://i.ytimg.com/vi/nQB4nAjZIdE/hqdefault.jpg",
  "https://cdn.scratch.mit.edu/static/site/users/avatars/474/4102.png",
  "http://img.izismile.com/img/img5/20120716/640/do_the_derp_640_33.jpg",
  "http://stream1.gifsoup.com/view7/2879983/i-herped-my-derp-o.gif"
  ]


module.exports = (robot) ->
  robot.hear /nerp|herp|derp/i, (msg) ->
    msg.send msg.random images
